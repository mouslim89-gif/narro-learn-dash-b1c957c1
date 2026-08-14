# Furigana on "From your reading" (Grammar Details)

## Why it's missing

In Word Details, the reading extract is rendered with `FuriganaSentence` because the saved word carries `contextTokens` (surface + reading pairs), and when they're missing the page fetches them once via the `tatoeba-example` edge function in `tokenize` mode.

Grammar notes have no such data: `note.example` is a plain string, and Grammar Details renders it as raw text. Hence no furigana.

## What to build

Give the grammar extract the exact same treatment as Word Details:

1. Grammar Details resolves tokens for `note.example`:
   - reuse the local grammar cache entry (`grammar_cache_<pattern>_<jlpt>`) if it already holds `exampleTokens`;
   - otherwise one call to `tatoeba-example` with `{ mode: 'tokenize', sentence: note.example }`, then store the result back into that same cache entry.
2. Render with `<FuriganaSentence tokens={...} fallbackText={note.example} />`, no `highlight` (per your choice: no pattern highlighting).
3. Keep the current look: same card, same `font-jp-serif`, same left border. While tokens load, the plain sentence stays visible (no skeleton, no layout jump).

## Cost safety

The `tokenize` mode currently reads a cache but never writes one, so the same sentence could be re-tokenized by AI for every user. Fix that in the same pass: after tokenizing, upsert the sentence + tokens into `example_sentences` so the result is shared globally. Combined with the localStorage entry, each grammar extract costs at most one AI call ever, app-wide.

## Files touched

- `src/pages/GrammarDetail.tsx` — token resolution + `FuriganaSentence` rendering.
- `supabase/functions/tatoeba-example/index.ts` — persist tokenize-mode results (service-role upsert).
