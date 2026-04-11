

## Fix: Consistent Instant Dictionary Lookups

### Root cause
The pre-baked dictionary covers tokens from a previous tokenization pass. When the runtime tokenizer produces different tokens (e.g. `洗濯をしている` as one chunk instead of `洗濯` + `を` + `している`), the lookup misses the cache and falls back to a slow API call.

### Plan

**1. Improve the tokenizer** (`src/lib/tokenizer.ts`)
- Split particles (を, が, は, に, で, etc.) more aggressively from adjacent words
- Handle ている/ていた/ています as separate suffix tokens after the verb stem
- Ensure compound expressions get broken into meaningful lookup-able units

**2. Regenerate pre-baked dictionary** (`src/data/book-dictionary.ts`)
- Run the improved tokenizer against all book texts
- Call the edge function for every unique token
- Write results back to the static data file
- This ensures 100% coverage of all tokens the runtime will produce

**3. Add fallback indicator** (`src/components/WordPopup.tsx`)
- For the rare case where a word still needs an API call, show a subtle skeleton/shimmer instead of the current spinner to make it feel faster

### Files to modify
1. `src/lib/tokenizer.ts` — Better particle and suffix splitting
2. `src/data/book-dictionary.ts` — Regenerated with improved tokenizer
3. `src/components/WordPopup.tsx` — Skeleton loading state

