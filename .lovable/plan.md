

## Fix: Eliminate API calls by adding base-form keys to dictionary

### Root cause
The pre-baked dictionary (`book-dictionary.ts`) is keyed only by **surface forms** (e.g. `住んで`, `作って`, `大き`). But the WordPopup looks up words by both the **surface text** of the merged token (e.g. `住んでいました`) and the **base form** from Kuromoji (e.g. `住む`).

Neither matches:
- The merged surface `住んでいました` doesn't exist as a key (only `住んで` does)
- The base form `住む` doesn't exist as a key either

So every click triggers an API call, causing the loading spinner.

### Fix

**1. `scripts/generate-tokens.ts`** — When generating the dictionary, add entries for **both** the surface form AND the base form of every token. For merged tokens, also add the merged surface as a key.

Specifically, for each token:
- Keep the existing surface-form key (e.g. `住んで`)
- Add the base form as a key too (e.g. `住む`) — looked up via Jisho at build time
- Add the merged token surface as a key (e.g. `住んでいました`) pointing to the same entry

**2. Regenerate `src/data/book-dictionary.ts`** with the expanded keys.

### Result
`getCached(word)` or `getCached(kuromojiBase)` will always hit, so WordPopup renders instantly with no loading state and zero API calls during reading.

### Files to modify
1. `scripts/generate-tokens.ts` — Add base-form and merged-surface dictionary keys
2. `src/data/book-dictionary.ts` — Regenerated output

