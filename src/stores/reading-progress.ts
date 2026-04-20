import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/data/books';

export type FontSize = 'small' | 'medium' | 'large';
export type DisplayMode = 'normal' | 'grammar';
export type JapaneseFont = 'sans' | 'serif' | 'handwriting';

export const japaneseFontClassMap: Record<JapaneseFont, string> = {
  sans: 'font-jp-sans',
  serif: 'font-jp-serif',
  handwriting: 'font-jp-hand',
};

export interface ReadingProgress {
  difficulty: Difficulty;
  progressPercent: number;
  lastReadAt: string;
}

interface ReadingProgressState {
  progress: Record<string, ReadingProgress>;
  fontSize: FontSize;
  readerDarkMode: boolean;
  darkMode: boolean;
  showFurigana: boolean;
  displayMode: DisplayMode;
  japaneseFont: JapaneseFont;
  hasSeenLongPressHint: boolean;
  updateProgress: (bookId: string, difficulty: Difficulty, percent: number) => void;
  getProgress: (bookId: string) => ReadingProgress | undefined;
  setFontSize: (size: FontSize) => void;
  setReaderDarkMode: (dark: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setJapaneseFont: (font: JapaneseFont) => void;
  setHasSeenLongPressHint: (seen: boolean) => void;
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
      darkMode: false,
      showFurigana: false,
      displayMode: 'normal' as DisplayMode,
      japaneseFont: 'sans' as JapaneseFont,
      hasSeenLongPressHint: false,
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
      setDarkMode: (darkMode) => set({ darkMode }),
      setShowFurigana: (showFurigana) => set({ showFurigana }),
      setDisplayMode: (displayMode) => set({ displayMode }),
      setJapaneseFont: (japaneseFont) => set({ japaneseFont }),
      setHasSeenLongPressHint: (hasSeenLongPressHint) => set({ hasSeenLongPressHint }),
    }),
    { name: 'reading-progress' }
  )
);
