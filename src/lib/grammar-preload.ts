import { supabase } from '@/integrations/supabase/client';
import type { GrammarNote } from '@/data/book-grammar';

/** Must stay identical to the slug logic in the `grammar-examples` edge function. */
export function grammarSlug(pattern: string): string {
  return pattern
    .toLowerCase()
    .trim()
    .replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf0-9a-z]/g, '-');
}

/** Patterns already handled during this session (avoids duplicate calls across books). */
const handled = new Set<string>();

function localKey(note: GrammarNote) {
  return `grammar_cache_${note.pattern}_${note.jlpt}`;
}

/**
 * Generates + caches examples for a single grammar pattern.
 * Only call this for patterns that are NOT already cached server-side.
 */
async function generateGrammar(note: GrammarNote): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('grammar-examples', {
      body: { pattern: note.pattern, meaning: note.meaning, jlpt: note.jlpt },
    });
    if (error || !data) return;
    localStorage.setItem(
      localKey(note),
      JSON.stringify({ examples: data.examples, formations: data.formations, timestamp: Date.now() }),
    );
  } catch {
    /* silent – preloading is best effort */
  }
}

/**
 * Preloads grammar examples for a book.
 * Everything already cached in the database is skipped (no AI request at all),
 * so this only ever generates truly missing patterns, once.
 */
export async function preloadGrammarForBook(bookId: string, difficulty?: string): Promise<void> {
  const { getGrammarFlat } = await import('@/data/book-grammar');
  const difficulties = difficulty ? [difficulty] : ['simplified', 'intermediate', 'original'];

  // Unique patterns across the requested difficulties.
  const bySlug = new Map<string, GrammarNote>();
  for (const diff of difficulties) {
    for (const note of getGrammarFlat(bookId, diff)) {
      const slug = grammarSlug(note.pattern);
      if (handled.has(slug)) continue;
      if (localStorage.getItem(localKey(note))) {
        handled.add(slug);
        continue;
      }
      if (!bySlug.has(slug)) bySlug.set(slug, note);
    }
  }
  if (bySlug.size === 0) return;

  // Skip anything already cached server-side (single cheap query, no AI).
  const slugs = [...bySlug.keys()];
  const { data: cachedRows } = await supabase
    .from('grammar_examples')
    .select('pattern_slug')
    .in('pattern_slug', slugs);

  for (const row of cachedRows ?? []) {
    handled.add(row.pattern_slug);
    bySlug.delete(row.pattern_slug);
  }

  const missing = [...bySlug.entries()];
  if (missing.length === 0) return;

  // Generate the remaining ones slowly, sequentially, to stay well under rate limits.
  for (const [slug, note] of missing) {
    handled.add(slug);
    await generateGrammar(note);
    await new Promise((r) => setTimeout(r, 1200));
  }
}
