import { supabase } from '@/integrations/supabase/client';
import type { GrammarNote } from '@/data/book-grammar';

/**
 * Preloads grammar examples and formations into the edge function's cache
 * and potentially a local cache if we implement one.
 */
export async function preloadGrammar(note: GrammarNote): Promise<void> {
  try {
    // Check if already in local cache to save bandwidth
    const cacheKey = `grammar_cache_${note.pattern}_${note.jlpt}`;
    if (localStorage.getItem(cacheKey)) return;

    const { data } = await supabase.functions.invoke('grammar-examples', {
      body: {
        pattern: note.pattern,
        meaning: note.meaning,
        jlpt: note.jlpt
      }
    });

    if (data) {
      localStorage.setItem(cacheKey, JSON.stringify({
        examples: data.examples,
        formations: data.formations,
        timestamp: Date.now()
      }));
    }
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
