---
name: Grammar system
description: Grammar notes per book, grammar detail page, structures/examples generation and the `grammar_examples` DB cache
type: feature
---

# Grammar

## Data
- **Notes per book**: `src/data/book-grammar.ts`, generated offline by `scripts/generate-grammar-for-<id>.ts` (per-part array for split books, flat array otherwise). Committed to the repo — no runtime AI.
- **Structures + examples per pattern**: `grammar_examples` table, key = `pattern_slug` (unique index). Slug logic is duplicated in `src/lib/grammar-preload.ts` and the edge function — keep them identical.
- **Saved grammar**: `src/stores/saved-grammar.ts`, localStorage key `tsundoku-saved-grammar`.

## Runtime flow (cost-sensitive)
1. `GrammarDetail` (`/grammar/:id`) is **cache-first**: valid localStorage entry (`grammar_cache_<pattern>_<jlpt>`) renders instantly, no network call at all.
2. Miss → `grammar-examples` edge function. It reads `grammar_examples` with the service-role key and returns the cached row; it only calls the AI gateway (`google/gemini-3-flash-preview`) when the row is missing, then upserts it.
3. `src/lib/grammar-preload.ts` is **fetch-only**: on opening a book it does one bulk `select` on `grammar_examples` to hydrate localStorage. It must never trigger a generation.
4. `scripts/preload-grammar-examples.ts` backfills every unique pattern (622 total, ~516 cached) sequentially, 1 req/s, exponential backoff on 429/5xx, resumable and free for cached patterns. Run it after adding a book.

Historical bug to avoid: the edge function used the anon key, RLS silently denied the cache write, and every view re-generated with AI.

## UI
- Hero shows the pattern **structures** as chips: parts separated by a bold `+`, multiple formations separated by an "OR" divider, amber tint (never the primary/save colour), `text-xs` for mobile.
- The section is called "Examples" — never "AI-generated examples".
- Same visual language as Word Detail.
