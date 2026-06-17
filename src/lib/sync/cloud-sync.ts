import { supabase } from'@/integrations/supabase/client';
import type { SavedWord } from'@/stores/flashcards';
import type { ReadingProgress } from'@/stores/reading-progress';
import { type Difficulty, DEFAULT_CHAPTER_ID, chapterKey } from'@/data/books';
import { useSyncStatus } from'./sync-status';

// ============ FLASHCARDS ============

export async function pullFlashcards(userId: string): Promise<SavedWord[]> {
 const { data, error } = await supabase
 .from('flashcards')
 .select('*')
 .eq('user_id', userId);
 if (error) throw error;
 return (data ?? []).map(rowToSavedWord);
}

export async function pushFlashcard(userId: string, word: SavedWord): Promise<void> {
 useSyncStatus.getState().startSync();
 try {
 const { error } = await supabase.from('flashcards').upsert({
 id: word.id,
 user_id: userId,
 word: word.word,
 reading: word.reading ??'',
 meanings: word.meanings ?? [],
 jlpt: word.jlpt ?? [],
 parts_of_speech: word.partsOfSpeech ?? [],
 context_sentence: word.contextSentence ?? null,
 context_tokens: word.contextTokens ?? null,
 mastery: word.mastery ?? 0,
 last_reviewed_at: word.lastReviewedAt ?? null,
 next_review_at: word.nextReviewAt ?? null,
 });
 if (error) throw error;
 useSyncStatus.getState().endSync(true);
 } catch (e) {
 console.error('pushFlashcard error', e);
 useSyncStatus.getState().endSync(false);
 throw e;
 }
}

export async function deleteFlashcard(userId: string, id: string): Promise<void> {
 useSyncStatus.getState().startSync();
 try {
 const { error } = await supabase
 .from('flashcards')
 .delete()
 .eq('user_id', userId)
 .eq('id', id);
 if (error) throw error;
 useSyncStatus.getState().endSync(true);
 } catch (e) {
 console.error('deleteFlashcard error', e);
 useSyncStatus.getState().endSync(false);
 throw e;
 }
}

function rowToSavedWord(row: any): SavedWord {
 return {
 id: row.id,
 word: row.word,
 reading: row.reading ??'',
 meanings: Array.isArray(row.meanings) ? row.meanings : [],
 jlpt: Array.isArray(row.jlpt) ? row.jlpt : [],
 partsOfSpeech: Array.isArray(row.parts_of_speech) ? row.parts_of_speech : [],
 contextSentence: row.context_sentence ?? undefined,
 contextTokens: Array.isArray(row.context_tokens) ? row.context_tokens : undefined,
 mastery: row.mastery ?? 0,
 lastReviewedAt: row.last_reviewed_at ?? undefined,
 nextReviewAt: row.next_review_at ?? undefined,
 };
}

// ============ READING PROGRESS ============

export async function pullProgress(userId: string): Promise<Record<string, ReadingProgress>> {
 const { data, error } = await supabase
 .from('reading_progress')
 .select('*')
 .eq('user_id', userId);
 if (error) throw error;
 const out: Record<string, ReadingProgress> = {};
 for (const row of data ?? []) {
 const cid = row.chapter_id ?? DEFAULT_CHAPTER_ID;
 const key = chapterKey(row.book_id, cid);
 const rawIdx = (row as any).sentence_idx;
 out[key] = {
 difficulty: row.difficulty as Difficulty,
 progressPercent: row.progress_percent ?? 0,
 lastReadAt: row.last_read_at ?? new Date().toISOString(),
 chapterId: cid,
 sentenceIdx: typeof rawIdx ==='number'? rawIdx : null,
 };
 }
 return out;
}

export async function pushProgress(
 userId: string,
 bookId: string,
 progress: ReadingProgress,
): Promise<void> {
 useSyncStatus.getState().startSync();
 try {
 const { error } = await supabase.from('reading_progress').upsert({
 user_id: userId,
 book_id: bookId,
 chapter_id: progress.chapterId ?? DEFAULT_CHAPTER_ID,
 difficulty: progress.difficulty,
 progress_percent: progress.progressPercent,
 last_read_at: progress.lastReadAt,
 sentence_idx: progress.sentenceIdx ?? null,
 } as any);
 if (error) throw error;
 useSyncStatus.getState().endSync(true);
 } catch (e) {
 console.error('pushProgress error', e);
 useSyncStatus.getState().endSync(false);
 throw e;
 }
}

// ============ USER PREFERENCES ============

export interface UserPreferences {
 fontSize:'small'|'medium'|'large';
 readerDarkMode: boolean;
 darkMode: boolean;
 showFurigana: boolean;
 showTranslations: boolean;
 displayMode:'normal'|'grammar';
 japaneseFont:'sans'|'serif'|'handwriting';
 hasSeenLongPressHint: boolean;
 showKnownHighlights: boolean;
 highlightNew: boolean;
 highlightLearning: boolean;
 highlightKnown: boolean;
}

export async function pullPreferences(userId: string): Promise<UserPreferences | null> {
 const { data, error } = await supabase
 .from('user_preferences')
 .select('*')
 .eq('user_id', userId)
 .maybeSingle();
 if (error) throw error;
 if (!data) return null;
 return {
 fontSize: data.font_size as UserPreferences['fontSize'],
 readerDarkMode: data.reader_dark_mode,
 darkMode: data.dark_mode,
 showFurigana: data.show_furigana,
 showTranslations: (data as any).show_translations ?? false,
 displayMode: data.display_mode as UserPreferences['displayMode'],
 japaneseFont: data.japanese_font as UserPreferences['japaneseFont'],
 hasSeenLongPressHint: data.has_seen_long_press_hint,
 showKnownHighlights: data.show_known_highlights,
 highlightNew: data.highlight_new,
 highlightLearning: data.highlight_learning,
 highlightKnown: data.highlight_known,
 };
}

export async function pushPreferences(userId: string, prefs: UserPreferences): Promise<void> {
 useSyncStatus.getState().startSync();
 try {
 const { error } = await supabase.from('user_preferences').upsert({
 user_id: userId,
 font_size: prefs.fontSize,
 reader_dark_mode: prefs.readerDarkMode,
 dark_mode: prefs.darkMode,
 show_furigana: prefs.showFurigana,
 show_translations: prefs.showTranslations,
 display_mode: prefs.displayMode,
 japanese_font: prefs.japaneseFont,
 has_seen_long_press_hint: prefs.hasSeenLongPressHint,
 show_known_highlights: prefs.showKnownHighlights,
 highlight_new: prefs.highlightNew,
 highlight_learning: prefs.highlightLearning,
 highlight_known: prefs.highlightKnown,
 updated_at: new Date().toISOString(),
 });

 if (error) throw error;
 useSyncStatus.getState().endSync(true);
 } catch (e) {
 console.error('pushPreferences error', e);
 useSyncStatus.getState().endSync(false);
 throw e;
 }
}

// ============ REALTIME ============

type RealtimeHandlers = {
 onFlashcardChange: () => void;
 onProgressChange: () => void;
 onPreferencesChange: () => void;
};

export function subscribeRealtime(userId: string, handlers: RealtimeHandlers) {
 const channel = supabase
 .channel(`user-sync-${userId}`)
 .on('postgres_changes',
 { event:'*', schema:'public', table:'flashcards', filter:`user_id=eq.${userId}`},
 () => handlers.onFlashcardChange(),
 )
 .on('postgres_changes',
 { event:'*', schema:'public', table:'reading_progress', filter:`user_id=eq.${userId}`},
 () => handlers.onProgressChange(),
 )
 .on('postgres_changes',
 { event:'*', schema:'public', table:'user_preferences', filter:`user_id=eq.${userId}`},
 () => handlers.onPreferencesChange(),
 )
 .subscribe();
 return () => {
 supabase.removeChannel(channel);
 };
}
