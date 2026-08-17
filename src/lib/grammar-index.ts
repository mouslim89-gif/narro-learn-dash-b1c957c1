import { bookGrammar, type GrammarNote } from './data/book-grammar';
import { slugifyPattern } from './lib/grammar';

export interface IndexedGrammarNote extends GrammarNote {
  id: string;
}

let memo: IndexedGrammarNote[] | null = null;

/**
 * Returns a deduplicated, A-Z sorted list of all grammar patterns in the app.
 * Memoized at the module level.
 */
export function getAllGrammarPoints(): IndexedGrammarNote[] {
  if (memo) return memo;

  const seen = new Set<string>();
  const all: IndexedGrammarNote[] = [];

  // Iterate all books and difficulties to collect unique patterns
  Object.values(bookGrammar).forEach((difficulties) => {
    Object.values(difficulties).forEach((parts) => {
      // Handle both GrammarNote[] (legacy) and GrammarNote[][] (parts)
      const flat = Array.isArray(parts[0]) 
        ? (parts as unknown as GrammarNote[][]).flat()
        : (parts as unknown as GrammarNote[]);

      flat.forEach((note) => {
        const id = slugifyPattern(note.pattern);
        if (!seen.has(id)) {
          seen.add(id);
          all.push({ ...note, id });
        }
      });
    });
  });

  // Sort A-Z by pattern
  memo = all.sort((a, b) => a.pattern.localeCompare(b.pattern, 'ja'));
  return memo;
}
