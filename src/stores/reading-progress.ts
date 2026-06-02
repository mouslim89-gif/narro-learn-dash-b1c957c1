import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Difficulty, DEFAULT_CHAPTER_ID, chapterKey } from '@/data/books';
import { pushProgress, pushPreferences, deleteFlashcard as cloudDeleteFlashcard, type UserPreferences } from '@/lib/sync/cloud-sync';

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
  /** Exact sentence index where the reader stopped (within the current chapter/part). */
  sentenceIdx?: number | null;
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
  showTranslations: boolean;
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
  updateProgress: (
    bookId: string,
    chapterId: string | undefined,
    difficulty: Difficulty,
    percent: number,
    sentenceIdx?: number | null,
  ) => void;
  /** Force-flush any debounced cloud pushes immediately (best-effort, fire-and-forget). */
  flushPendingProgressPushes: () => void;
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
  setShowTranslations: (show: boolean) => void;
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
  hydratePreferences: (prefs: UserPreferences, userId: string) => void;
  clearPreferences: () => void;
}

const DEFAULT_PREFS: UserPreferences = {
  fontSize: 'medium',
  readerDarkMode: false,
  darkMode: false,
  showFurigana: false,
  showTranslations: false,
  displayMode: 'normal',

  japaneseFont: 'sans',
  hasSeenLongPressHint: false,
  showKnownHighlights: true,
  highlightNew: true,
  highlightLearning: true,
  highlightKnown: false,
};

export function currentPrefs(state: ReadingProgressState): UserPreferences {
  return {
    fontSize: state.fontSize,
    readerDarkMode: state.readerDarkMode,
    darkMode: state.darkMode,
    showFurigana: state.showFurigana,
    showTranslations: state.showTranslations,
    displayMode: state.displayMode,

    japaneseFont: state.japaneseFont,
    hasSeenLongPressHint: state.hasSeenLongPressHint,
    showKnownHighlights: state.showKnownHighlights,
    highlightNew: state.highlightNew,
    highlightLearning: state.highlightLearning,
    highlightKnown: state.highlightKnown,
  };
}

let prefsTimer: number | null = null;
function schedulePrefsPush(userId: string, prefs: UserPreferences) {
  if (prefsTimer) clearTimeout(prefsTimer);
  prefsTimer = window.setTimeout(() => {
    pushPreferences(userId, prefs).catch(() => {});
    prefsTimer = null;
  }, 1500);
}

// Debounce per (book, chapter). We store the latest progress alongside the
// timer so flushPendingProgressPushes can fire it immediately on page hide.
const pushTimers = new Map<string, { timer: number; userId: string; bookId: string; progress: ReadingProgress }>();

function flushKey(key: string) {
  const entry = pushTimers.get(key);
  if (!entry) return;
  clearTimeout(entry.timer);
  pushTimers.delete(key);
  pushProgress(entry.userId, entry.bookId, entry.progress).catch(() => {});
}

function schedulePush(userId: string, bookId: string, progress: ReadingProgress) {
  const key = chapterKey(bookId, progress.chapterId);
  const existing = pushTimers.get(key);
  if (existing) clearTimeout(existing.timer);
  const timer = window.setTimeout(() => {
    const entry = pushTimers.get(key);
    pushTimers.delete(key);
    if (entry) pushProgress(entry.userId, entry.bookId, entry.progress).catch(() => {});
  }, 1500);
  pushTimers.set(key, { timer, userId, bookId, progress });
}

export function flushAllProgressPushes() {
  for (const key of Array.from(pushTimers.keys())) flushKey(key);
}

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      fontSize: 'medium',
      readerDarkMode: false,
      darkMode: false,
      showFurigana: false,
      showTranslations: false,
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
      setFontSize: (fontSize) => { set({ fontSize }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setReaderDarkMode: (readerDarkMode) => { set({ readerDarkMode }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setDarkMode: (darkMode) => { set({ darkMode }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setShowFurigana: (showFurigana) => { set({ showFurigana }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setShowTranslations: (showTranslations) => { set({ showTranslations }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },

      setDisplayMode: (displayMode) => { set({ displayMode }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setJapaneseFont: (japaneseFont) => { set({ japaneseFont }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setHasSeenLongPressHint: (hasSeenLongPressHint) => { set({ hasSeenLongPressHint }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setShowKnownHighlights: (showKnownHighlights) => { set({ showKnownHighlights }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setHighlightNew: (highlightNew) => { set({ highlightNew }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setHighlightLearning: (highlightLearning) => { set({ highlightLearning }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      setHighlightKnown: (highlightKnown) => { set({ highlightKnown }); const s = get(); if (s.syncUserId) schedulePrefsPush(s.syncUserId, currentPrefs(s)); },
      hydrateProgress: (progress, userId) => set({ progress, syncUserId: userId }),
      clearProgress: () => {
        pushTimers.forEach((t) => clearTimeout(t));
        pushTimers.clear();
        set({ progress: {}, syncUserId: null });
      },
      hydratePreferences: (prefs, userId) => set({ ...prefs, syncUserId: userId }),
      clearPreferences: () => {
        if (prefsTimer) { clearTimeout(prefsTimer); prefsTimer = null; }
        set({ ...DEFAULT_PREFS });
      },
    }),
    {
      name: 'reading-progress',
      // Persist everything (preferences AND progress) — progress acts as offline cache
    }
  )
);
