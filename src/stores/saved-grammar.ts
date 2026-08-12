import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GrammarNote } from '@/data/book-grammar';
import {
  pushSavedGrammar,
  deleteSavedGrammar,
  type CloudSavedGrammar,
} from '@/lib/sync/cloud-sync';

export interface SavedGrammar extends GrammarNote {
  id: string;
  bookId?: string;
  savedAt: string;
}

interface SavedGrammarStore {
  savedItems: SavedGrammar[];
  syncUserId: string | null;
  saveGrammar: (item: Omit<SavedGrammar, 'savedAt'>) => void;
  removeGrammar: (id: string) => void;
  isSaved: (id: string) => boolean;
  /** Merge cloud rows with local ones (union by id), then push anything cloud is missing. */
  mergeFromCloud: (items: CloudSavedGrammar[], userId: string) => void;
  clearGrammar: () => void;
}

function toCloud(item: SavedGrammar): CloudSavedGrammar {
  return {
    id: item.id,
    bookId: item.bookId,
    savedAt: item.savedAt,
    pattern: item.pattern,
    meaning: item.meaning,
    example: item.example,
    jlpt: item.jlpt,
    tip: item.tip,
  };
}

export const useSavedGrammarStore = create<SavedGrammarStore>()(
  persist(
    (set, get) => ({
      savedItems: [],
      syncUserId: null,
      saveGrammar: (item) => {
        if (get().isSaved(item.id)) return;
        const entry: SavedGrammar = { ...item, savedAt: new Date().toISOString() };
        set((state) => ({ savedItems: [...state.savedItems, entry] }));
        const uid = get().syncUserId;
        if (uid) pushSavedGrammar(uid, toCloud(entry)).catch(() => {});
      },
      removeGrammar: (id) => {
        set((state) => ({
          savedItems: state.savedItems.filter((i) => i.id !== id),
        }));
        const uid = get().syncUserId;
        if (uid) deleteSavedGrammar(uid, id).catch(() => {});
      },
      isSaved: (id) => get().savedItems.some((i) => i.id === id),
      mergeFromCloud: (items, userId) => {
        const local = get().savedItems;
        const byId = new Map<string, SavedGrammar>();
        for (const c of items) {
          byId.set(c.id, {
            id: c.id,
            bookId: c.bookId,
            savedAt: c.savedAt,
            pattern: c.pattern,
            meaning: c.meaning,
            example: c.example,
            jlpt: c.jlpt,
            tip: c.tip,
          });
        }
        const missingOnCloud: SavedGrammar[] = [];
        for (const l of local) {
          if (!byId.has(l.id)) {
            byId.set(l.id, l);
            missingOnCloud.push(l);
          }
        }
        const merged = [...byId.values()].sort(
          (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
        );
        set({ savedItems: merged, syncUserId: userId });
        for (const m of missingOnCloud) {
          pushSavedGrammar(userId, toCloud(m)).catch(() => {});
        }
      },
      clearGrammar: () => set({ savedItems: [], syncUserId: null }),
    }),
    {
      name: 'tsundoku-saved-grammar',
      partialize: (state) => ({ savedItems: state.savedItems }),
    }
  )
);
