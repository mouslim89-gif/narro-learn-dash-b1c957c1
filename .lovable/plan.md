

## Preload All Definitions on Book Open

### Approach
Storing the entire JMDict dictionary locally (~3.5M entries, ~500MB+) is not practical. Instead, we'll **preload definitions for every unique word in the current text** when the reader opens. This way the popup is instant.

### How It Works

1. **Extract unique words** from the tokenized text (deduplicate)
2. **Batch-fetch all definitions** in parallel when the Reader mounts (with a concurrency limit of ~5 to avoid overloading)
3. **Store results in the existing `jisho.ts` cache** — the same `Map<string, JishoResult[]>` already used
4. **Show a loading indicator** on the Reader page while preloading ("Loading dictionary…" with a progress bar)
5. **WordPopup reads from cache** — since all words are already fetched, lookups are synchronous/instant

### Technical Details

**`src/lib/jisho.ts`** — Add a `preloadWords(words: string[])` function:
- Accepts an array of unique words
- Filters out already-cached words
- Fetches remaining words in parallel batches (5 concurrent requests)
- Reports progress via a callback
- Populates the existing cache

**`src/pages/Reader.tsx`** — Add preloading on mount:
- After tokenizing, extract unique Japanese token texts
- Call `preloadWords()` with a progress callback
- Show a thin progress bar or skeleton while loading
- Once complete, render the text as normal (popups will be instant)

**`src/components/WordPopup.tsx`** — Simplify:
- Try cache first (synchronous) — if found, show immediately with no loading state
- Fall back to fetch only if somehow not preloaded (edge case)

### Files to Modify
1. `src/lib/jisho.ts` — Add `preloadWords()` with batched parallel fetching and progress callback
2. `src/pages/Reader.tsx` — Preload on mount, show loading state during preload
3. `src/components/WordPopup.tsx` — Prefer synchronous cache read, remove loading delay for preloaded words

