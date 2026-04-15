import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SRS_INTERVALS = [0, 1, 3, 7, 30]; // days

export interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  jlpt?: string[];
  partsOfSpeech?: string[];
  contextSentence?: string;
  mastery: number; // 0 = new, 1-2 = learning, 3+ = known
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
  addWord: (entry: Omit<SavedWord, 'mastery'>) => void;
  removeWord: (id: string) => void;
  hasWord: (id: string) => boolean;
  incrementMastery: (id: string) => void;
  resetMastery: (id: string) => void;
  adjustMastery: (id: string, quality: 'again' | 'hard' | 'good') => void;
  getDueCount: () => number;
  getDueWords: () => SavedWord[];
}

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      savedWords: [],
      addWord: (entry) => {
        if (!get().savedWords.find(w => w.id === entry.id)) {
          set({
            savedWords: [...get().savedWords, {
              ...entry,
              mastery: 0,
              nextReviewAt: new Date().toISOString(),
            }],
          });
        }
      },
      removeWord: (id) => {
        set({ savedWords: get().savedWords.filter(w => w.id !== id) });
      },
      hasWord: (id) => {
        return !!get().savedWords.find(w => w.id === id);
      },
      incrementMastery: (id) => {
        set({
          savedWords: get().savedWords.map(w => {
            if (w.id !== id) return w;
            const newMastery = (w.mastery || 0) + 1;
            return {
              ...w,
              mastery: newMastery,
              lastReviewedAt: new Date().toISOString(),
              nextReviewAt: getNextReviewDate(newMastery),
            };
          }),
        });
      },
      resetMastery: (id) => {
        set({
          savedWords: get().savedWords.map(w =>
            w.id === id ? {
              ...w,
              mastery: 0,
              lastReviewedAt: new Date().toISOString(),
              nextReviewAt: new Date().toISOString(),
            } : w
          ),
        });
      },
      getDueCount: () => {
        const now = new Date().toISOString();
        return get().savedWords.filter(w => !w.nextReviewAt || w.nextReviewAt <= now).length;
      },
      getDueWords: () => {
        const now = new Date().toISOString();
        return get().savedWords.filter(w => !w.nextReviewAt || w.nextReviewAt <= now);
      },
    }),
    { name: 'yomimasu-flashcards' }
  )
);
