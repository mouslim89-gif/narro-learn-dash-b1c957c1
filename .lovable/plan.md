# Grammar examples: cache them once, stop paying per view

## Current state (verified)

- `grammar_examples` table contains **1 row**. So virtually every grammar point still triggers an AI generation the first time anyone opens it.
- `supabase/functions/grammar-examples/index.ts` does cache correctly now (service-role read/write, unique index on `pattern_slug` confirmed) — the cache is just empty.
- `src/pages/GrammarDetail.tsx` reads its localStorage cache but then **calls the edge function anyway** on every visit (the early `return` is commented out). Harmless in credits when the DB row exists, but it's a needless round-trip and a guaranteed AI call when the row is missing.
- `src/lib/grammar-preload.ts` only runs when a book is opened, generates sequentially with a 1.2 s gap, and silently gives up on any failure — which is why the table never filled.
- `scripts/preload-grammar-examples.ts` exists but is hard-capped at the **first 50** patterns and fires 5 in parallel (that is what hit the rate limit before).

## Plan

1. **One-off full backfill (admin script, run once by me).**
   Rewrite `scripts/preload-grammar-examples.ts` to:
   - collect every unique pattern across all books/difficulties (no `LIMIT`);
   - first query `grammar_examples` for existing slugs and skip them (resumable — re-running costs nothing);
   - process **sequentially**, 1 request at a time, with a ~1 s delay and exponential backoff + retry on 429/500;
   - log progress and a final summary (generated / skipped / failed).
   Cost: one AI call per missing pattern, once, ever. At ~600 patterns and the observed ~0.0004 credits per call, this is roughly 0.25 credits total.

2. **Make `GrammarDetail` cache-first.**
   If the localStorage entry exists and is valid, render it and **return** — no edge-function call at all. Only fetch when there's nothing cached locally.

3. **Drop the runtime per-book preloader.**
   Once the table is fully backfilled, `preloadGrammarForBook` has nothing left to generate. Keep it but make it *fetch-only*: it hydrates localStorage from the `grammar_examples` table in one bulk query and never calls the AI generator. Any pattern still missing is generated lazily when the user actually opens that page.

Net result: after the one-time backfill, opening any grammar point is instant and costs **zero** AI credits.

## Technical notes
- Files: `scripts/preload-grammar-examples.ts` (rewrite), `src/pages/GrammarDetail.tsx` (early return on cache hit), `src/lib/grammar-preload.ts` (fetch-only, bulk select).
- No schema change, no edge-function change.
