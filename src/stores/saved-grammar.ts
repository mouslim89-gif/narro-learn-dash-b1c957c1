import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GrammarNote } from '@/data/book-grammar';

export interface SavedGrammar extends GrammarNote {
  id: string;
  bookId?: string;
  savedAt: string;
}

interface SavedGrammarStore {
  savedItems: SavedGrammar[];
  saveGrammar: (item: Omit<SavedGrammar, 'savedAt'>) => void;
  removeGrammar: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedGrammarStore = create<SavedGrammarStore>()(
  persist(
    (set, get) => ({
      savedItems: [],
      saveGrammar: (item) => {
        if (get().isSaved(item.id)) return;
        set((state) => ({
          savedItems: [
            ...state.savedItems,
            { ...item, savedAt: new Date().toISOString() },
          ],
        }));
      },
      removeGrammar: (id) => {
        set((state) => ({
          savedItems: state.savedItems.filter((i) => i.id !== id),
        }));
      },
      isSaved: (id) => get().savedItems.some((i) => i.id === id),
    }),
    {
      name: 'tsundoku-saved-grammar',
    }
  )
);
