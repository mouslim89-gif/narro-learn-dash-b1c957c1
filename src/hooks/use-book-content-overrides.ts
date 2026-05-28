import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BookToken } from '@/data/book-tokens';
import type { Difficulty } from '@/data/books';

export interface BookContentOverride {
  book_id: string;
  difficulty: Difficulty;
  part_index: number | null;
  text: string;
  tokens: BookToken[] | null;
  updated_at: string;
}

/** Key: `${difficulty}::${partIndex ?? 'all'}` */
export type OverrideMap = Record<string, BookContentOverride>;

function keyOf(difficulty: Difficulty, partIndex: number | null): string {
  return `${difficulty}::${partIndex ?? 'all'}`;
}

const LS_PREFIX = 'book-content-overrides:';

/** Fetch all overrides for one book id (cached in localStorage for instant boot). */
export function useBookContentOverrides(bookId: string | undefined) {
  const [map, setMap] = useState<OverrideMap>(() => {
    if (!bookId) return {};
    try {
      const raw = localStorage.getItem(LS_PREFIX + bookId);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!bookId) { setMap({}); setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('book_content_overrides')
        .select('book_id, difficulty, part_index, text, tokens, updated_at')
        .eq('book_id', bookId);
      if (cancelled) return;
      if (error || !data) { setLoaded(true); return; }
      const next: OverrideMap = {};
      for (const row of data) {
        next[keyOf(row.difficulty as Difficulty, row.part_index)] = row as BookContentOverride;
      }
      setMap(next);
      try { localStorage.setItem(LS_PREFIX + bookId, JSON.stringify(next)); } catch {}
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [bookId]);

  const get = useCallback(
    (difficulty: Difficulty, partIndex: number | null): BookContentOverride | undefined =>
      map[keyOf(difficulty, partIndex)],
    [map],
  );

  return { map, get, loaded };
}

/** Admin: upsert one override row. */
export async function saveBookContentOverride(input: {
  bookId: string;
  difficulty: Difficulty;
  partIndex: number | null;
  text: string;
  tokens: BookToken[] | null;
}) {
  const { bookId, difficulty, partIndex, text, tokens } = input;
  const { data: userData } = await supabase.auth.getUser();
  const updated_by = userData.user?.id ?? null;
  // Delete + insert to avoid relying on a unique-constraint-aware upsert
  // (the unique index uses COALESCE so on_conflict isn't trivial).
  await supabase
    .from('book_content_overrides')
    .delete()
    .eq('book_id', bookId)
    .eq('difficulty', difficulty)
    .is('part_index', partIndex === null ? null : (undefined as any))
    .eq('part_index', partIndex ?? -999999);
  // Simpler: clear then insert
  if (partIndex === null) {
    await supabase.from('book_content_overrides').delete()
      .eq('book_id', bookId).eq('difficulty', difficulty).is('part_index', null);
  } else {
    await supabase.from('book_content_overrides').delete()
      .eq('book_id', bookId).eq('difficulty', difficulty).eq('part_index', partIndex);
  }
  const { error } = await supabase.from('book_content_overrides').insert({
    book_id: bookId, difficulty, part_index: partIndex,
    text, tokens: tokens as any, updated_by,
  });
  if (error) throw error;
  // Bust localStorage so next mount refetches.
  try { localStorage.removeItem(LS_PREFIX + bookId); } catch {}
}

export async function deleteBookContentOverride(input: {
  bookId: string;
  difficulty: Difficulty;
  partIndex: number | null;
}) {
  const { bookId, difficulty, partIndex } = input;
  const q = supabase.from('book_content_overrides').delete()
    .eq('book_id', bookId).eq('difficulty', difficulty);
  const { error } = partIndex === null
    ? await q.is('part_index', null)
    : await q.eq('part_index', partIndex);
  if (error) throw error;
  try { localStorage.removeItem(LS_PREFIX + bookId); } catch {}
}
