import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushFlashcard, deleteFlashcard as cloudDeleteFlashcard } from '@/lib/sync/cloud-sync';

const SRS_INTERVALS = [0, 1, 3, 7, 30]; // days

export interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  jlpt?: string[];
  partsOfSpeech?: string[];
  contextSentence?: string;
  mastery: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

function getNextReviewDate(mastery: number): string {
  const days = SRS_INTERVALS[Math.min(mastery, SRS_INTERVALS.length - 1)];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

interface FlashcardStore {
  savedWords: SavedWord[];
  isReviewing: boolean;
  syncUserId: string | null;
  setIsReviewing: (v: boolean) => void;
  addWord: (entry: Omit<SavedWord, 'mastery'>) => void;
  removeWord: (id: string) => void;
  hasWord: (id: string) => boolean;
  incrementMastery: (id: string) => void;
  resetMastery: (id: string) => void;
  adjustMastery: (id: string, quality: 'again' | 'hard' | 'good') => void;
  getDueCount: () => number;
  getDueWords: () => SavedWord[];
  // Sync helpers
  hydrateWords: (words: SavedWord[], userId: string) => void;
  clearWords: () => void;
}

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
      setIsReviewing: (v) => set({ isReviewing: v }),
      addWord: (entry) => {
        if (get().savedWords.find(w => w.id === entry.id)) return;
        const newWord: SavedWord = {
          ...entry,
          mastery: 0,
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
        const updated = get().savedWords.map(w => {
          if (w.id !== id) return w;
          const newMastery = (w.mastery || 0) + 1;
          return {
            ...w,
            mastery: newMastery,
            lastReviewedAt: new Date().toISOString(),
            nextReviewAt: getNextReviewDate(newMastery),
          };
        });
        set({ savedWords: updated });
        const uid = get().syncUserId;
        const w = updated.find(x => x.id === id);
        if (uid && w) schedulePush(uid, w);
      },
      resetMastery: (id) => {
        const updated = get().savedWords.map(w =>
          w.id === id ? {
            ...w,
            mastery: 0,
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
        const updated = get().savedWords.map(w => {
          if (w.id !== id) return w;
          const now = new Date().toISOString();
          if (quality === 'again') {
            return { ...w, mastery: 0, lastReviewedAt: now, nextReviewAt: now };
          }
          if (quality === 'hard') {
            const d = new Date(); d.setDate(d.getDate() + 1);
            return { ...w, lastReviewedAt: now, nextReviewAt: d.toISOString() };
          }
          const newMastery = (w.mastery || 0) + 1;
          return { ...w, mastery: newMastery, lastReviewedAt: now, nextReviewAt: getNextReviewDate(newMastery) };
        });
        set({ savedWords: updated });
        const uid = get().syncUserId;
        const w = updated.find(x => x.id === id);
        if (uid && w) schedulePush(uid, w);
      },
      getDueCount: () => {
        const now = new Date().toISOString();
        return get().savedWords.filter(w => !w.nextReviewAt || w.nextReviewAt <= now).length;
      },
      getDueWords: () => {
        const now = new Date().toISOString();
        return get().savedWords.filter(w => !w.nextReviewAt || w.nextReviewAt <= now);
      },
      hydrateWords: (words, userId) => set({ savedWords: words, syncUserId: userId }),
      clearWords: () => {
        pushTimers.forEach((t) => clearTimeout(t));
        pushTimers.clear();
        set({ savedWords: [], syncUserId: null });
      },
    }),
    { name: 'yomimasu-flashcards' }
  )
);
