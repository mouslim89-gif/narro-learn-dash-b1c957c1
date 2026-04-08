import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  jlpt?: string[];
  partsOfSpeech?: string[];
  mastery: number; // 0 = new, 1-2 = learning, 3+ = known
}

interface FlashcardStore {
  savedWords: SavedWord[];
  addWord: (entry: Omit<SavedWord, 'mastery'>) => void;
  removeWord: (id: string) => void;
  hasWord: (id: string) => boolean;
  incrementMastery: (id: string) => void;
  resetMastery: (id: string) => void;
}

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      savedWords: [],
      addWord: (entry) => {
        if (!get().savedWords.find(w => w.id === entry.id)) {
          set({ savedWords: [...get().savedWords, { ...entry, mastery: 0 }] });
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
          savedWords: get().savedWords.map(w =>
            w.id === id ? { ...w, mastery: (w.mastery || 0) + 1 } : w
          ),
        });
      },
      resetMastery: (id) => {
        set({
          savedWords: get().savedWords.map(w =>
            w.id === id ? { ...w, mastery: 0 } : w
          ),
        });
      },
    }),
    { name: 'yomimasu-flashcards' }
  )
);
