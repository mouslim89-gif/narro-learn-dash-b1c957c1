

## Fix: Pre-baked Dictionary Not Loading (+ Full Pre-loading)

### Root cause
The dictionary file exports a **flat** `Record<string, CacheEntry>` (word → entry), but `Reader.tsx` line 67 reads it as `bookDictionary[bookId]?.[difficulty]` — a two-level nested lookup that always returns `undefined`. The cache is never seeded, so every word falls back to an API call.

### Plan

**1. Fix the cache seeding in Reader.tsx** (`src/pages/Reader.tsx`)
- Change line 67-69 from `bookDictionary[id]?.[difficulty]` to just `bookDictionary`
- Seed the entire flat dictionary into the Jisho cache on mount (it's only 1.4 MB, fine for mobile)
- This instantly fixes all word lookups — no API calls needed

**2. Grammar data is already pre-baked** (`src/data/book-grammar.ts`)
- The grammar panel already checks `bookGrammar[bookId]?.[difficulty]` and this data exists correctly (nested by book and difficulty)
- No changes needed for grammar

**3. Remove the preload progress state** (`src/pages/Reader.tsx`)
- Since everything is instant from static data, remove the `preloaded` state and any loading indicators tied to dictionary fetching
- The reader should render content immediately

### Files to modify
1. `src/pages/Reader.tsx` — Fix `seedCache` call to use the flat dictionary, remove unnecessary loading state

### Result
All dictionary lookups become instant (served from the 1.4 MB static bundle). Grammar notes are already pre-baked. Zero API calls during reading.

