# Bake shared rules directly into the token files

Right now token corrections live in three layers applied at runtime: `baked-rules.json`, the shared rules store (DB), and user rules. You want the corrections written permanently into the pre-tokenized book files themselves.

## What will happen

1. `scripts/bake-token-rules.ts` is rewritten so it actually rewrites the token data instead of only emitting a manifest:
   - Import each `src/data/book-tokens/books/<id>.ts` module (via tsx), so the token arrays are real objects, not text to regex.
   - For every book and every difficulty array, run `applyTokenOverrides(bookId, tokens)`-compatible rule application using the rules for that book plus the `*` global rules (fetched from `shared_token_rules`, ordered by position).
   - Re-emit the file with the same header comment and the same `Record<string, Record<string, BookToken[]>>` shape, JSON-serialized like the generator does today.
   - Print a per-book diff summary (tokens before/after, rules that matched 0 times).

2. Run the script once against the database so the 11 book files under `src/data/book-tokens/books/` are updated in place.

3. Reduce the runtime layering in `src/pages/Reader.tsx`: the baked manifest layer is no longer needed, since the corrections are inside the token arrays. Shared rules (still fetched from the DB) and user rules stay, so new admin edits keep working live and future edits can be baked again by re-running the script.

## Important limitation

The Reader applies rules twice: once on the raw Kuromoji tokens and once again after `mergeConjugatedTokens` / `mergeCounterCompounds` / `gluePhrasalCompounds`. Baking can only reproduce the first pass, because the second pass depends on post-processing that happens at render time.

Consequence: a rule whose match only appears after post-processing (for example a rule matching a glued compound) cannot be baked. The script will report those rules as "0 matches" and they will be left in the shared-rules layer, which still runs at runtime. All currently baked rules (`一緒|に`, `九|時`, `仕事中でした`, `何|か`, `時頃`, `圧|え|つけていた`) match raw tokens, so they should bake cleanly.

## Files touched

- `scripts/bake-token-rules.ts` — real file rewriting instead of manifest-only
- `src/data/book-tokens/books/*.ts` — regenerated with rules applied
- `src/data/book-tokens/baked-rules.json` + `src/data/book-tokens/index.ts` — manifest export removed
- `src/pages/Reader.tsx` — drop the `bakedRules` layer

## Notes

- No DB rows are deleted: `shared_token_rules` remains the source of truth so the admin token editor and future re-bakes keep working.
- Nothing changes visually; the same corrected tokens simply come from the bundle instead of a runtime rule pass, which also makes them correct offline on first launch.
