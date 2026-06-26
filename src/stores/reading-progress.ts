import { create } from'zustand';
import { persist } from'zustand/middleware';
import { type Difficulty, DEFAULT_CHAPTER_ID, chapterKey } from'@/data/books';
import { pushProgress, pushPreferences, deleteFlashcard as cloudDeleteFlashcard, type UserPreferences } from'@/lib/sync/cloud-sync';

// ============================================================
// PREFERENCES (local-only, per device)
// ============================================================

export type FontSize ='small'|'medium'|'large';
export type DisplayMode ='normal'|'grammar';
export type JapaneseFont ='sans'|'serif'|'handwriting';

export const japaneseFontClassMap: Record<JapaneseFont, string> = {
 sans:'font-jp-sans',
 serif:'font-jp-serif',
 handwriting:'font-jp-hand',
};

export const fontSizeMap: Record<FontSize, string> = {
 small:'text-lg leading-[2.2]',
 medium:'text-xl leading-[2.4]',
 large:'text-2xl leading-[2.6]',
};

// ============================================================
// READING PROGRESS (synced to cloud)
// ============================================================

export interface ReadingProgress {
 difficulty: Difficulty;
 progressPercent: number;
 lastReadAt: string;
 /** Chapter id; defaults to'main'for single-chapter books. */
 chapterId?: string;
 /** Exact sentence index where the reader stopped (within the current chapter/part). */
 sentenceIdx?: number | null;
}

interface ReadingProgressState {
 /**
 * Synced data. Key = chapterKey(bookId, chapterId).
 * - Single-chapter book: key = bookId (chapterId='main')
 * - Multi-chapter book: key =`${bookId}__${chapterId}`*/
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
  // Goals & Activity
  readingGoal: number;
  readToday: { date: string; count: number };
  readingHistory: { date: string; count: number }[];
  // Actions
  updateProgress: (
    bookId: string,
    chapterId: string | undefined,
    difficulty: Difficulty,
    percent: number,
    sentenceIdx?: number | null,
    wordsRead?: number
  ) => void;
  /** Force-flush any debounced cloud pushes immediately (best-effort, fire-and-forget). */
  flushPendingProgressPushes: () => void;
  /** Get progress for a specific chapter (defaults to 'main'). */
  getProgress: (bookId: string, chapterId?: string) => ReadingProgress | undefined;
  /** Get the most recently read progress entry for a book (across chapters). */
  getBookProgress: (bookId: string) => ReadingProgress | undefined;
  /** Get all per-chapter progress for a book. Returns map keyed by chapterId. */
  getChapterProgress: (bookId: string) => Record<string, ReadingProgress>;
  
  setReadingGoal: (v: number) => void;
  getReadTodayCount: () => number;

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
 fontSize:'medium',
 readerDarkMode: false,
 darkMode: false,
 showFurigana: false,
 showTranslations: false,
 displayMode:'normal',

 japaneseFont:'sans',
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
 fontSize:'medium',
 readerDarkMode: false,
 darkMode: false,
 showFurigana: false,
 showTranslations: false,
 displayMode:'normal'as DisplayMode,

 japaneseFont:'sans'as JapaneseFont,
 hasSeenLongPressHint: false,
 showKnownHighlights: true,
 highlightNew: true,
 highlightLearning: true,
 highlightKnown: false,
    syncUserId: null,
    readingGoal: 500,
    readToday: { date: new Date().toISOString().split('T')[0], count: 0 },
    readingHistory: [],
    updateProgress: (bookId, chapterId, difficulty, percent, sentenceIdx, wordsRead) => {
      const cid = chapterId || DEFAULT_CHAPTER_ID;
      const key = chapterKey(bookId, cid);
      const prev = get().progress[key];
      const roundedPct = Math.max(0, Math.min(100, Math.round(percent)));
      // Once a chapter is marked complete, drop the sentence anchor so the next
      // visit starts at the top.
      const nextSentence = roundedPct >= 100 ? null : (sentenceIdx ?? prev?.sentenceIdx ?? null);

      const today = new Date().toISOString().split('T')[0];
      const currentRead = get().readToday;
      let newReadToday = { ...currentRead };
      let newHistory = [...get().readingHistory];

      if (wordsRead && wordsRead > 0) {
        const newCount = currentRead.date === today ? currentRead.count + wordsRead : wordsRead;
        newReadToday = { date: today, count: newCount };

        const histIdx = newHistory.findIndex(h => h.date === today);
        if (histIdx >= 0) {
          newHistory[histIdx] = { date: today, count: newCount };
        } else {
          newHistory.push({ date: today, count: newCount });
          if (newHistory.length > 90) newHistory.shift();
        }
      }

      // Skip no-op writes (same pct AND same sentence anchor) to avoid spamming cloud.
      if (
        prev &&
        prev.progressPercent === roundedPct &&
        (prev.sentenceIdx ?? null) === nextSentence &&
        prev.difficulty === difficulty &&
        (!wordsRead || wordsRead <= 0)
      ) {
        return;
      }
      const next: ReadingProgress = {
        difficulty,
        progressPercent: roundedPct,
        lastReadAt: new Date().toISOString(),
        chapterId: cid,
        sentenceIdx: nextSentence,
      };
      set((state) => ({
        progress: { ...state.progress, [key]: next },
        readToday: newReadToday,
        readingHistory: newHistory,
      }));
      const userId = get().syncUserId;
      if (userId) schedulePush(userId, bookId, next);
    },
 flushPendingProgressPushes: () => {
 flushAllProgressPushes();
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
  setReadingGoal: (readingGoal) => set({ readingGoal }),
  getReadTodayCount: () => {
    const today = new Date().toISOString().split('T')[0];
    const read = get().readToday;
    return read.date === today ? read.count : 0;
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
 hydrateProgress: (incoming, userId) => {
 // Merge instead of replace: keep whichever side is newer per chapter so
 // a slow cloud pull can't clobber a fresh local write (or vice-versa).
 const current = get().progress;
 const merged: Record<string, ReadingProgress> = { ...current };
 for (const [key, remote] of Object.entries(incoming)) {
 const local = current[key];
 if (!local) {
 merged[key] = remote;
 continue;
 }
 const localTs = new Date(local.lastReadAt).getTime();
 const remoteTs = new Date(remote.lastReadAt).getTime();
 // Local is strictly newer — keep it. Pending push (if any) will sync.
 if (localTs > remoteTs) continue;
 // Remote is newer or equal — accept it, but never let it pull a
 // chapter's progress backwards if local somehow has a higher %.
 if (remoteTs === localTs && local.progressPercent >= remote.progressPercent) continue;
 if (remote.progressPercent < local.progressPercent && remoteTs - localTs < 60_000) {
 continue;
 }
 merged[key] = remote;
 }
 set({ progress: merged, syncUserId: userId });
 },
 clearProgress: () => {
 pushTimers.forEach((entry) => clearTimeout(entry.timer));
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
    name:'reading-progress',
    partialize: (state) => ({
      progress: state.progress,
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
      readingGoal: state.readingGoal,
      readToday: state.readToday,
      readingHistory: state.readingHistory,
    }),
    // Persist everything (preferences AND progress) — progress acts as offline cache
  }
 )
);
