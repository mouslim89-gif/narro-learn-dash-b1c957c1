import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedWord {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  jlpt?: string[];
  partsOfSpeech?: string[];
}

interface FlashcardStore {
  savedWords: SavedWord[];
  addWord: (entry: SavedWord) => void;
  removeWord: (id: string) => void;
  hasWord: (id: string) => boolean;
}

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      savedWords: [],
      addWord: (entry) => {
        if (!get().savedWords.find(w => w.id === entry.id)) {
          set({ savedWords: [...get().savedWords, entry] });
        }
      },
      removeWord: (id) => {
        set({ savedWords: get().savedWords.filter(w => w.id !== id) });
      },
      hasWord: (id) => {
        return !!get().savedWords.find(w => w.id === id);
      },
    }),
    { name: 'yomimasu-flashcards' }
  )
);
