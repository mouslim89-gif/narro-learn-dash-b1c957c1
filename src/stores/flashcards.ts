import { create } from'zustand';
import { persist } from'zustand/middleware';
import { pushFlashcard, deleteFlashcard as cloudDeleteFlashcard } from'@/lib/sync/cloud-sync';
import { applyReview, migrateCard, type Quality } from'@/lib/srs';

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

interface FlashcardStore {
  savedWords: SavedWord[];
  isReviewing: boolean;
  syncUserId: string | null;
  dailyGoal: number;
  dailyNewGoal: number;
  reviewedToday: { date: string; count: number };
  newToday: { date: string; count: number };
  history: { date: string; count: number }[];
  setIsReviewing: (v: boolean) => void;
  setDailyGoal: (v: number) => void;
  setDailyNewGoal: (v: number) => void;
  addWord: (entry: Omit<SavedWord, 'mastery'>) => void;
  removeWord: (id: string) => void;
  attachContext: (id: string, context: { sentence?: string; tokens?: { t: string; r?: string }[] }) => void;
  hasWord: (id: string) => boolean;
  incrementMastery: (id: string) => void;
  resetMastery: (id: string) => void;
  adjustMastery: (id: string, quality: 'again' | 'hard' | 'good' | 'easy') => void;
  /** Records one review in the shared daily counters / streak history. */
  recordReview: (isFirstReview: boolean) => void;
  getDueCount: () => number;
  getDueWords: () => SavedWord[];
  getReviewedTodayCount: () => number;
  getNewTodayCount: () => number;
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
      dailyGoal: 10,
      dailyNewGoal: 5,
      reviewedToday: { date: new Date().toISOString().split('T')[0], count: 0 },
      newToday: { date: new Date().toISOString().split('T')[0], count: 0 },
      history: [],
      setIsReviewing: (v) => set({ isReviewing: v }),
      setDailyGoal: (v) => set({ dailyGoal: v }),
      setDailyNewGoal: (v) => set({ dailyNewGoal: v }),
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
  attachContext: (id, context) => {
    const word = get().savedWords.find(w => w.id === id);
    if (!word) return;
    const updatedWord = { 
      ...word, 
      contextSentence: context.sentence ?? word.contextSentence,
      contextTokens: context.tokens ?? word.contextTokens 
    };
    set({
      savedWords: get().savedWords.map(w => w.id === id ? updatedWord : w)
    });
    const uid = get().syncUserId;
    if (uid) schedulePush(uid, updatedWord);
  },
  hasWord: (id) => !!get().savedWords.find(w => w.id === id),
 incrementMastery: (id) => {
 // Treat as a"Good"review (back-compat helper)
 get().adjustMastery(id,'good');
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
      recordReview: (isFirstReview) => {
        const today = new Date().toISOString().split('T')[0];
        const currentReviewed = get().reviewedToday;
        const newCount = currentReviewed.date === today ? currentReviewed.count + 1 : 1;

        const currentNew = get().newToday;
        const newTodayCount = isFirstReview
          ? (currentNew.date === today ? currentNew.count + 1 : 1)
          : (currentNew.date === today ? currentNew.count : 0);

        const newHistory = [...get().history];
        const histIdx = newHistory.findIndex(h => h.date === today);
        if (histIdx >= 0) {
          newHistory[histIdx] = { date: today, count: newCount };
        } else {
          newHistory.push({ date: today, count: newCount });
          if (newHistory.length > 90) newHistory.shift(); // Keep 90 days
        }

        set({
          reviewedToday: { date: today, count: newCount },
          newToday: { date: today, count: newTodayCount },
          history: newHistory,
        });
      },
      adjustMastery: (id, quality) => {
        let isFirstReview = false;

        const updated = get().savedWords.map(w => {
          if (w.id !== id) return w;
          const migrated = migrateCard(w);
          if (migrated.reps === 0 && quality !== 'again') {
            isFirstReview = true;
          }
          const result = applyReview(migrated, QUALITY_MAP[quality]);
          return { ...migrated, ...result };
        });

        set({ savedWords: updated });
        get().recordReview(isFirstReview);

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
      getReviewedTodayCount: () => {
        const today = new Date().toISOString().split('T')[0];
        const reviewed = get().reviewedToday;
        return reviewed.date === today ? reviewed.count : 0;
      },
      getNewTodayCount: () => {
        const today = new Date().toISOString().split('T')[0];
        const current = get().newToday;
        return current.date === today ? current.count : 0;
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
      dailyGoal: state.dailyGoal,
      dailyNewGoal: state.dailyNewGoal,
      reviewedToday: state.reviewedToday,
      newToday: state.newToday,
      history: state.history
    }),
 onRehydrateStorage: () => (state) => {
 if (state) state.isReviewing = false;
 },
 }
 )
);
