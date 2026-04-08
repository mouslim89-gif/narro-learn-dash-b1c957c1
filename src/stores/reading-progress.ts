import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/data/books';

export interface ReadingProgress {
  difficulty: Difficulty;
  progressPercent: number;
  lastReadAt: string;
}

interface ReadingProgressState {
  progress: Record<string, ReadingProgress>;
  updateProgress: (bookId: string, difficulty: Difficulty, percent: number) => void;
  getProgress: (bookId: string) => ReadingProgress | undefined;
}

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      updateProgress: (bookId, difficulty, percent) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [bookId]: {
              difficulty,
              progressPercent: Math.round(percent),
              lastReadAt: new Date().toISOString(),
            },
          },
        })),
      getProgress: (bookId) => get().progress[bookId],
    }),
    { name: 'reading-progress' }
  )
);
