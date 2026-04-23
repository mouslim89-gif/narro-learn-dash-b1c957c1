import { supabase } from '@/integrations/supabase/client';
import type { SavedWord } from '@/stores/flashcards';
import type { ReadingProgress } from '@/stores/reading-progress';
import type { Difficulty } from '@/data/books';
import { useSyncStatus } from './sync-status';

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
      reading: word.reading ?? '',
      meanings: word.meanings ?? [],
      jlpt: word.jlpt ?? [],
      parts_of_speech: word.partsOfSpeech ?? [],
      context_sentence: word.contextSentence ?? null,
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
    reading: row.reading ?? '',
    meanings: Array.isArray(row.meanings) ? row.meanings : [],
    jlpt: Array.isArray(row.jlpt) ? row.jlpt : [],
    partsOfSpeech: Array.isArray(row.parts_of_speech) ? row.parts_of_speech : [],
    contextSentence: row.context_sentence ?? undefined,
    mastery: row.mastery ?? 0,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    nextReviewAt: row.next_review_at ?? undefined,
  };
}

// ============ READING PROGRESS ============

export interface ProgressRow {
  bookId: string;
  difficulty: Difficulty;
  progressPercent: number;
  lastReadAt: string;
}

export async function pullProgress(userId: string): Promise<Record<string, ReadingProgress>> {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const out: Record<string, ReadingProgress> = {};
  for (const row of data ?? []) {
    out[row.book_id] = {
      difficulty: row.difficulty as Difficulty,
      progressPercent: row.progress_percent ?? 0,
      lastReadAt: row.last_read_at ?? new Date().toISOString(),
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
      difficulty: progress.difficulty,
      progress_percent: progress.progressPercent,
      last_read_at: progress.lastReadAt,
    });
    if (error) throw error;
    useSyncStatus.getState().endSync(true);
  } catch (e) {
    console.error('pushProgress error', e);
    useSyncStatus.getState().endSync(false);
    throw e;
  }
}

// ============ REALTIME ============

type RealtimeHandlers = {
  onFlashcardChange: () => void;
  onProgressChange: () => void;
};

export function subscribeRealtime(userId: string, handlers: RealtimeHandlers) {
  const channel = supabase
    .channel(`user-sync-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'flashcards', filter: `user_id=eq.${userId}` },
      () => handlers.onFlashcardChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reading_progress', filter: `user_id=eq.${userId}` },
      () => handlers.onProgressChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
