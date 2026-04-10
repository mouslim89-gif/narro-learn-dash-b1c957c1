

## Pre-baked Dictionary & Grammar Notes

### What it does
Eliminates all loading time in the Reader by shipping pre-generated dictionary lookups and grammar notes as static data bundled with each book. No API calls needed when reading.

### How it works

**1. Generate static data via a build script**

Create a one-time Node script (`scripts/generate-book-data.ts`) that:
- For each book x difficulty, tokenizes the text, calls the Jisho edge function for all unique tokens, and saves the results
- Calls the grammar-notes edge function for each book x difficulty text
- Writes everything to `src/data/book-dictionary.ts` and `src/data/book-grammar.ts` as exported constants

The output shape:
```typescript
// src/data/book-dictionary.ts
// Map<bookId, Map<difficulty, Map<word, CacheEntry>>>
export const bookDictionary: Record<string, Record<string, Record<string, CacheEntry>>> = { ... };

// src/data/book-grammar.ts  
export const bookGrammar: Record<string, Record<string, GrammarNote[]>> = { ... };
```

**2. Pre-seed the jisho cache on Reader mount**

In `Reader.tsx`, instead of calling `preloadWords()` (which hits the edge function), import `bookDictionary` and seed the in-memory cache directly:
```typescript
import { bookDictionary } from '@/data/book-dictionary';
// On mount: iterate bookDictionary[bookId][difficulty] and call cache.set() for each entry
```

This makes `preloaded` immediately true — no loading bar, no network requests.

**3. Inline grammar notes**

In `GrammarPanel.tsx`, check `bookGrammar[bookId][difficulty]` first. If data exists, use it directly instead of invoking the edge function. Grammar panel opens instantly.

**4. Fallback for unknown words**

Keep the existing edge function calls as fallback for words not in the pre-baked data (e.g. if the user taps a word the tokenizer split differently). The popup already handles this gracefully.

### Files to create/modify
1. **`scripts/generate-book-data.ts`** — Build script to generate static data (run once, output committed)
2. **`src/data/book-dictionary.ts`** — Generated static dictionary data for all books
3. **`src/data/book-grammar.ts`** — Generated static grammar notes for all books
4. **`src/lib/jisho.ts`** — Add `seedCache(entries)` function to bulk-load the cache
5. **`src/pages/Reader.tsx`** — Replace `preloadWords` call with cache seeding from static data; remove loading bar; pass bookId/difficulty to GrammarPanel
6. **`src/components/GrammarPanel.tsx`** — Check static data first, skip edge function if available

### Execution approach
Since I can't run the build script against the live edge functions from within the app, I'll generate the dictionary and grammar data directly by:
- Tokenizing each book text in code
- Calling the edge functions once to get all results
- Hardcoding the results into the static data files

This means the data files will be large but the app will be instant.

