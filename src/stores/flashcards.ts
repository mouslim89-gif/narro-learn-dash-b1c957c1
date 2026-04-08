import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DictionaryEntry } from '@/data/dictionary';

interface FlashcardStore {
  savedWords: DictionaryEntry[];
  addWord: (entry: DictionaryEntry) => void;
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
