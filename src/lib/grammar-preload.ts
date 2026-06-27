import { supabase } from '@/integrations/supabase/client';
import type { GrammarNote } from '@/data/book-grammar';

/**
 * Preloads grammar examples and formations into the edge function's cache
 * and potentially a local cache if we implement one.
 */
export async function preloadGrammar(note: GrammarNote): Promise<void> {
  try {
    // The edge function itself handles caching (likely via Supabase or internal cache)
    // By calling it now, we ensure the data is ready when the user visits the page.
    await supabase.functions.invoke('grammar-examples', {
      body: {
        pattern: note.pattern,
        meaning: note.meaning,
        jlpt: note.jlpt
      }
    });
  } catch (err) {
    console.warn(`[grammar-preload] Failed for ${note.pattern}`, err);
  }
}

/**
 * Preloads all grammar notes for a given book and difficulty.
 */
export async function preloadGrammarForBook(bookId: string, difficulty: string): Promise<void> {
  const { getGrammarFlat } = await import('@/data/book-grammar');
  const notes = getGrammarFlat(bookId, difficulty);
  
  // Don't overwhelm the functions, process in small batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < notes.length; i += BATCH_SIZE) {
    const batch = notes.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(note => preloadGrammar(note)));
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
