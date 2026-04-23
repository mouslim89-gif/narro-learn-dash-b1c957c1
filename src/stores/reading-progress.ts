import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Difficulty, DEFAULT_CHAPTER_ID, chapterKey } from '@/data/books';
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
  /** Chapter id; defaults to 'main' for single-chapter books. */
  chapterId?: string;
}

interface ReadingProgressState {
  /**
   * Synced data. Key = chapterKey(bookId, chapterId).
   *  - Single-chapter book: key = bookId (chapterId='main')
   *  - Multi-chapter book:  key = `${bookId}__${chapterId}`
   */
  progress: Record<string, ReadingProgress>;
  // UI preferences (local-only)
  fontSize: FontSize;
  readerDarkMode: boolean;
  darkMode: boolean;
  showFurigana: boolean;
  displayMode: DisplayMode;
  japaneseFont: JapaneseFont;
  hasSeenLongPressHint: boolean;
  // Known-word highlights (local-only)
  showKnownHighlights: boolean;
  highlightNew: boolean;
  highlightLearning: boolean;
  highlightKnown: boolean;
  // Auth-synced user
  syncUserId: string | null;
  // Actions
  updateProgress: (bookId: string, chapterId: string | undefined, difficulty: Difficulty, percent: number) => void;
  /** Get progress for a specific chapter (defaults to 'main'). */
  getProgress: (bookId: string, chapterId?: string) => ReadingProgress | undefined;
  /** Get the most recently read progress entry for a book (across chapters). */
  getBookProgress: (bookId: string) => ReadingProgress | undefined;
  /** Get all per-chapter progress for a book. Returns map keyed by chapterId. */
  getChapterProgress: (bookId: string) => Record<string, ReadingProgress>;
  setFontSize: (size: FontSize) => void;
  setReaderDarkMode: (dark: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setJapaneseFont: (font: JapaneseFont) => void;
  setHasSeenLongPressHint: (seen: boolean) => void;
  setShowKnownHighlights: (show: boolean) => void;
  setHighlightNew: (v: boolean) => void;
  setHighlightLearning: (v: boolean) => void;
  setHighlightKnown: (v: boolean) => void;
  // Sync helpers
  hydrateProgress: (progress: Record<string, ReadingProgress>, userId: string) => void;
  clearProgress: () => void;
}

// Debounce per (book, chapter)
const pushTimers = new Map<string, number>();
function schedulePush(userId: string, bookId: string, progress: ReadingProgress) {
  const key = chapterKey(bookId, progress.chapterId);
  const existing = pushTimers.get(key);
  if (existing) clearTimeout(existing);
  const t = window.setTimeout(() => {
    pushProgress(userId, bookId, progress).catch(() => {});
    pushTimers.delete(key);
  }, 1500);
  pushTimers.set(key, t);
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
      showKnownHighlights: true,
      highlightNew: true,
      highlightLearning: true,
      highlightKnown: false,
      syncUserId: null,
      updateProgress: (bookId, chapterId, difficulty, percent) => {
        const cid = chapterId || DEFAULT_CHAPTER_ID;
        const next: ReadingProgress = {
          difficulty,
          progressPercent: Math.round(percent),
          lastReadAt: new Date().toISOString(),
          chapterId: cid,
        };
        const key = chapterKey(bookId, cid);
        set((state) => ({
          progress: { ...state.progress, [key]: next },
        }));
        const userId = get().syncUserId;
        if (userId) schedulePush(userId, bookId, next);
      },
      getProgress: (bookId, chapterId) => {
        const key = chapterKey(bookId, chapterId);
        return get().progress[key];
      },
      getBookProgress: (bookId) => {
        const all = get().progress;
        let best: ReadingProgress | undefined;
        for (const [key, p] of Object.entries(all)) {
          if (key === bookId || key.startsWith(`${bookId}__`)) {
            if (!best || new Date(p.lastReadAt).getTime() > new Date(best.lastReadAt).getTime()) {
              best = p;
            }
          }
        }
        return best;
      },
      getChapterProgress: (bookId) => {
        const all = get().progress;
        const out: Record<string, ReadingProgress> = {};
        for (const [key, p] of Object.entries(all)) {
          if (key === bookId) {
            out[DEFAULT_CHAPTER_ID] = p;
          } else if (key.startsWith(`${bookId}__`)) {
            const cid = key.slice(bookId.length + 2);
            out[cid] = p;
          }
        }
        return out;
      },
      setFontSize: (fontSize) => set({ fontSize }),
      setReaderDarkMode: (readerDarkMode) => set({ readerDarkMode }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setShowFurigana: (showFurigana) => set({ showFurigana }),
      setDisplayMode: (displayMode) => set({ displayMode }),
      setJapaneseFont: (japaneseFont) => set({ japaneseFont }),
      setHasSeenLongPressHint: (hasSeenLongPressHint) => set({ hasSeenLongPressHint }),
      setShowKnownHighlights: (showKnownHighlights) => set({ showKnownHighlights }),
      setHighlightNew: (highlightNew) => set({ highlightNew }),
      setHighlightLearning: (highlightLearning) => set({ highlightLearning }),
      setHighlightKnown: (highlightKnown) => set({ highlightKnown }),
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
