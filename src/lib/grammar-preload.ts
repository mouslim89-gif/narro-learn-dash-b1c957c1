import { supabase } from '@/integrations/supabase/client';
import type { GrammarNote } from '@/data/book-grammar';
import { slugifyPattern } from '@/lib/grammar';

/** Alias for compatibility. */
export const grammarSlug = slugifyPattern;

/** Patterns already handled during this session (avoids duplicate work across books). */
const handled = new Set<string>();

function localKey(note: GrammarNote) {
  return `grammar_cache_${note.pattern}_${note.jlpt}`;
}

function normalizeCached(raw: any): { examples: any[]; formations: any[] } | null {
  if (!raw) return null;
  const examples = Array.isArray(raw) ? raw : raw.items;
  if (!Array.isArray(examples) || examples.length === 0) return null;
  const formations = Array.isArray(raw)
    ? []
    : raw.formations || (raw.structure ? [{ parts: [raw.structure] }] : []);
  return { examples, formations };
}

/**
 * Hydrates the local grammar cache for a book from the `grammar_examples` table.
 *
 * Fetch-only: this NEVER triggers an AI generation. Patterns missing from the
 * table are generated lazily (once) when the user actually opens their page.
 */
export async function preloadGrammarForBook(bookId: string, difficulty?: string): Promise<void> {
  const { getGrammarFlat } = await import('@/data/book-grammar');
  const difficulties = difficulty ? [difficulty] : ['simplified', 'intermediate', 'original'];

  // Unique patterns across the requested difficulties, minus what's already local.
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

  // Single cheap read — no AI, no edge function.
  const { data: rows } = await supabase
    .from('grammar_examples')
    .select('pattern_slug, examples')
    .in('pattern_slug', [...bySlug.keys()]);

  for (const row of rows ?? []) {
    const note = bySlug.get(row.pattern_slug);
    if (!note) continue;
    handled.add(row.pattern_slug);
    const normalized = normalizeCached(row.examples);
    if (!normalized) continue;
    try {
      localStorage.setItem(
        localKey(note),
        JSON.stringify({ ...normalized, timestamp: Date.now() }),
      );
    } catch {
      /* quota: ignore */
    }
  }
}
