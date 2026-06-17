import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushFlashcard, deleteFlashcard as cloudDeleteFlashcard } from '@/lib/sync/cloud-sync';
import { applyReview, migrateCard, SRS_LIMITS, type Quality } from '@/lib/srs';

export interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  jlpt?: string[];
  partsOfSpeech?: string[];
  contextSentence?: string;
  /** Tokens of the context sentence (surface + reading) for furigana rendering. */
  contextTokens?: { t: string; r?: string }[];
  mastery: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  // SM-2 fields (local-first, backfilled on demand)
  easeFactor?: number;
  interval?: number;
  reps?: number;
  lapses?: number;
}

interface FlashcardStats {
  lastResetDate: string;
  newCardsDoneToday: number;
  reviewsDoneToday: number;
}

interface FlashcardSettings {
  newCardLimit: number;
  reviewLimit: number;
}

interface FlashcardStore {
  savedWords: SavedWord[];
  isReviewing: boolean;
  syncUserId: string | null;
  settings: FlashcardSettings;
  stats: FlashcardStats;
  setIsReviewing: (v: boolean) => void;
  addWord: (entry: Omit<SavedWord, 'mastery'>) => void;
  removeWord: (id: string) => void;
  hasWord: (id: string) => boolean;
  incrementMastery: (id: string) => void;
  resetMastery: (id: string) => void;
  adjustMastery: (id: string, quality: 'again' | 'hard' | 'good' | 'easy') => void;
  getDueCount: () => number;
  getDueWords: () => SavedWord[];
  setSettings: (settings: Partial<FlashcardSettings>) => void;
  // Sync helpers
  hydrateWords: (words: SavedWord[], userId: string) => void;
  clearWords: () => void;
}

const QUALITY_MAP: Record<'again'|'hard'|'good'|'easy', Quality> = {
 again: 0,
 hard: 3,
 good: 4,
 easy: 5,
};

// Debounce push per word
const pushTimers = new Map<string, number>();
function schedulePush(userId: string, word: SavedWord) {
 const existing = pushTimers.get(word.id);
 if (existing) clearTimeout(existing);
 const t = window.setTimeout(() => {
 pushFlashcard(userId, word).catch(() => {});
 pushTimers.delete(word.id);
 }, 1500);
 pushTimers.set(word.id, t);
}

export const useFlashcardStore = create<FlashcardStore>()(
 persist(
  (set, get) => ({
    savedWords: [],
    isReviewing: false,
    syncUserId: null,
    settings: {
      newCardLimit: SRS_LIMITS.DEFAULT_NEW_CARDS,
      reviewLimit: SRS_LIMITS.DEFAULT_REVIEWS,
    },
    stats: {
      lastResetDate: new Date().toLocaleDateString(),
      newCardsDoneToday: 0,
      reviewsDoneToday: 0,
    },
    setIsReviewing: (v) => set({ isReviewing: v }),
    setSettings: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),
    addWord: (entry) => {
      if (get().savedWords.find(w => w.id === entry.id)) return;
      const newWord: SavedWord = {
        ...entry,
        mastery: 0,
        easeFactor: 2.5,
        interval: 0,
        reps: 0,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
      };
      set({ savedWords: [...get().savedWords, newWord] });
      const uid = get().syncUserId;
      if (uid) schedulePush(uid, newWord);
    },
    removeWord: (id) => {
      set({ savedWords: get().savedWords.filter(w => w.id !== id) });
      const uid = get().syncUserId;
      if (uid) {
        const t = pushTimers.get(id);
        if (t) { clearTimeout(t); pushTimers.delete(id); }
        cloudDeleteFlashcard(uid, id).catch(() => {});
      }
    },
    hasWord: (id) => !!get().savedWords.find(w => w.id === id),
    incrementMastery: (id) => {
      get().adjustMastery(id, 'good');
    },
    resetMastery: (id) => {
      const updated = get().savedWords.map(w =>
        w.id === id ? {
          ...w,
          mastery: 0,
          reps: 0,
          interval: 0,
          easeFactor: 2.5,
          lapses: (w.lapses ?? 0),
          lastReviewedAt: new Date().toISOString(),
          nextReviewAt: new Date().toISOString(),
        } : w
      );
      set({ savedWords: updated });
      const uid = get().syncUserId;
      const w = updated.find(x => x.id === id);
      if (uid && w) schedulePush(uid, w);
    },
    adjustMastery: (id, quality) => {
      const state = get();
      const today = new Date().toLocaleDateString();
      let { stats } = state;

      // Reset stats if new day
      if (stats.lastResetDate !== today) {
        stats = {
          lastResetDate: today,
          newCardsDoneToday: 0,
          reviewsDoneToday: 0,
        };
      }

      const word = state.savedWords.find(w => w.id === id);
      if (!word) return;

      const isNew = !word.reps || word.reps === 0;
      const newStats = { ...stats };
      if (isNew) {
        newStats.newCardsDoneToday += 1;
      } else {
        newStats.reviewsDoneToday += 1;
      }

      const updated = state.savedWords.map(w => {
        if (w.id !== id) return w;
        const migrated = migrateCard(w);
        const result = applyReview(migrated, QUALITY_MAP[quality]);
        return { ...migrated, ...result };
      });

      set({ savedWords: updated, stats: newStats });
      const uid = state.syncUserId;
      const updatedWord = updated.find(x => x.id === id);
      if (uid && updatedWord) schedulePush(uid, updatedWord);
    },
    getDueCount: () => {
      return get().getDueWords().length;
    },
    getDueWords: () => {
      const state = get();
      const now = new Date().toISOString();
      const today = new Date().toLocaleDateString();
      let { stats, settings } = state;

      if (stats.lastResetDate !== today) {
        stats = {
          lastResetDate: today,
          newCardsDoneToday: 0,
          reviewsDoneToday: 0,
        };
      }

      const dueWords = state.savedWords.filter(w => !w.nextReviewAt || w.nextReviewAt <= now);
      
      const reviewsRemaining = Math.max(0, settings.reviewLimit - stats.reviewsDoneToday);
      const newRemaining = Math.max(0, settings.newCardLimit - stats.newCardsDoneToday);

      const reviews = dueWords.filter(w => (w.reps ?? 0) > 0).slice(0, reviewsRemaining);
      const news = dueWords.filter(w => !(w.reps ?? 0) || w.reps === 0).slice(0, newRemaining);

      return [...reviews, ...news];
    },
    hydrateWords: (words, userId) => set({
      savedWords: words.map(migrateCard),
      syncUserId: userId,
    }),
    clearWords: () => {
      pushTimers.forEach((t) => clearTimeout(t));
      pushTimers.clear();
      set({ savedWords: [], syncUserId: null });
    },
  }),
  {
    name: 'yomimasu-flashcards',
    partialize: (state) => ({ 
      savedWords: state.savedWords,
      settings: state.settings,
      stats: state.stats 
    }),
    onRehydrateStorage: () => (state) => {
      if (state) state.isReviewing = false;
    },
  }
)
);
