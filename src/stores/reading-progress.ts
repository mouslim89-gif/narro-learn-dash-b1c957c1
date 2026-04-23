import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/data/books';
import { pushProgress, deleteFlashcard as cloudDeleteFlashcard } from '@/lib/sync/cloud-sync';

// ============================================================
// PREFERENCES (local-only, per device)
// ============================================================

export type FontSize = 'small' | 'medium' | 'large';
export type DisplayMode = 'normal' | 'grammar';
export type JapaneseFont = 'sans' | 'serif' | 'handwriting';

export const japaneseFontClassMap: Record<JapaneseFont, string> = {
  sans: 'font-jp-sans',
  serif: 'font-jp-serif',
  handwriting: 'font-jp-hand',
};

export const fontSizeMap: Record<FontSize, string> = {
  small: 'text-lg leading-[2.2]',
  medium: 'text-xl leading-[2.4]',
  large: 'text-2xl leading-[2.6]',
};

// ============================================================
// READING PROGRESS (synced to cloud)
// ============================================================

export interface ReadingProgress {
  difficulty: Difficulty;
  progressPercent: number;
  lastReadAt: string;
}

interface ReadingProgressState {
  // Synced data
  progress: Record<string, ReadingProgress>;
  // UI preferences (local-only)
  fontSize: FontSize;
  readerDarkMode: boolean;
  darkMode: boolean;
  showFurigana: boolean;
  displayMode: DisplayMode;
  japaneseFont: JapaneseFont;
  hasSeenLongPressHint: boolean;
  // Auth-synced user
  syncUserId: string | null;
  // Actions
  updateProgress: (bookId: string, difficulty: Difficulty, percent: number) => void;
  getProgress: (bookId: string) => ReadingProgress | undefined;
  setFontSize: (size: FontSize) => void;
  setReaderDarkMode: (dark: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setJapaneseFont: (font: JapaneseFont) => void;
  setHasSeenLongPressHint: (seen: boolean) => void;
  // Sync helpers
  hydrateProgress: (progress: Record<string, ReadingProgress>, userId: string) => void;
  clearProgress: () => void;
}

// Debounce per book
const pushTimers = new Map<string, number>();
function schedulePush(userId: string, bookId: string, progress: ReadingProgress) {
  const existing = pushTimers.get(bookId);
  if (existing) clearTimeout(existing);
  const t = window.setTimeout(() => {
    pushProgress(userId, bookId, progress).catch(() => {});
    pushTimers.delete(bookId);
  }, 1500);
  pushTimers.set(bookId, t);
}

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
      syncUserId: null,
      updateProgress: (bookId, difficulty, percent) => {
        const next: ReadingProgress = {
          difficulty,
          progressPercent: Math.round(percent),
          lastReadAt: new Date().toISOString(),
        };
        set((state) => ({
          progress: { ...state.progress, [bookId]: next },
        }));
        const userId = get().syncUserId;
        if (userId) schedulePush(userId, bookId, next);
      },
      getProgress: (bookId) => get().progress[bookId],
      setFontSize: (fontSize) => set({ fontSize }),
      setReaderDarkMode: (readerDarkMode) => set({ readerDarkMode }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setShowFurigana: (showFurigana) => set({ showFurigana }),
      setDisplayMode: (displayMode) => set({ displayMode }),
      setJapaneseFont: (japaneseFont) => set({ japaneseFont }),
      setHasSeenLongPressHint: (hasSeenLongPressHint) => set({ hasSeenLongPressHint }),
      hydrateProgress: (progress, userId) => set({ progress, syncUserId: userId }),
      clearProgress: () => {
        pushTimers.forEach((t) => clearTimeout(t));
        pushTimers.clear();
        set({ progress: {}, syncUserId: null });
      },
    }),
    {
      name: 'reading-progress',
      // Persist everything (preferences AND progress) — progress acts as offline cache
    }
  )
);
