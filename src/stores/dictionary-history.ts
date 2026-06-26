import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HistoryItem {
  query: string;
  ts: number;
}

interface DictionaryHistoryState {
  recent: HistoryItem[];
  push: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

export const useDictionaryHistoryStore = create<DictionaryHistoryState>()(
  persist(
    (set) => ({
      recent: [],
      push: (query) => {
        const q = query.trim();
        if (!q) return;

        set((state) => {
          // Remove if already exists (case-insensitive) to move it to top
          const filtered = state.recent.filter(
            (item) => item.query.toLowerCase() !== q.toLowerCase()
          );
          
          const newItem = { query: q, ts: Date.now() };
          const updated = [newItem, ...filtered].slice(0, 12);
          
          return { recent: updated };
        });
      },
      remove: (query) => {
        set((state) => ({
          recent: state.recent.filter(
            (item) => item.query.toLowerCase() !== query.toLowerCase()
          ),
        }));
      },
      clear: () => set({ recent: [] }),
    }),
    {
      name: 'dictionary-history',
    }
  )
);
