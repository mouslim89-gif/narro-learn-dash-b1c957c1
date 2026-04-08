import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/data/books';

export type FontSize = 'small' | 'medium' | 'large';

export interface ReadingProgress {
  difficulty: Difficulty;
  progressPercent: number;
  lastReadAt: string;
}

interface ReadingProgressState {
  progress: Record<string, ReadingProgress>;
  fontSize: FontSize;
  readerDarkMode: boolean;
  showFurigana: boolean;
  updateProgress: (bookId: string, difficulty: Difficulty, percent: number) => void;
  getProgress: (bookId: string) => ReadingProgress | undefined;
  setFontSize: (size: FontSize) => void;
  setReaderDarkMode: (dark: boolean) => void;
  setShowFurigana: (show: boolean) => void;
}

export const fontSizeMap: Record<FontSize, string> = {
  small: 'text-lg leading-[2.2]',
  medium: 'text-xl leading-[2.4]',
  large: 'text-2xl leading-[2.6]',
};

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      fontSize: 'medium',
      readerDarkMode: false,
      showFurigana: false,
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
      setFontSize: (fontSize) => set({ fontSize }),
      setReaderDarkMode: (readerDarkMode) => set({ readerDarkMode }),
    }),
    { name: 'reading-progress' }
  )
);
