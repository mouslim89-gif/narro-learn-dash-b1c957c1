---
name: Dictionary integration
description: DB-backed dictionary (Supabase `dictionary` table) with IndexedDB cache, example sentences, preloading path
type: feature
---

## Storage
- **Source of truth**: Supabase `dictionary` table (public read, service-role write).
- **Client cache**: `src/lib/dictionary-db.ts` — memory Map → IndexedDB shards → static shards in `public/dict/` (`manifest.json`) → DB.
- `src/data/book-dictionary.ts` is a deprecated empty stub. Do NOT add entries there — run `npx tsx scripts/sync-dictionary-to-db.ts` instead.

## Preloading (why lookups are instant)
- `DictionaryPreloader` (mounted in `App.tsx`) hydrates shards + token chunks for every book at startup, and re-hydrates the specific book on `/book/:id` and `/reader/:id`.
- Split books map to their root shard id.
- `WordMiniPopup` has a short grace period so a cache hit never flashes "Looking up".

## Lookup flow
1. Memory / IndexedDB.
2. Miss → `dictionary` table.
3. Miss → edge function `jisho-lookup` (proxies Jisho.org), result upserted back into the table.

## Word identity
- Canonical id = dictionary (base) form; "usually kana" words use the kana form so `とても` and `迚も` are the same entry.
- Variant-aware matching is shared by `WordDetail`, `WordPopup` and `Dictionary` so an inflected saved word (e.g. 解いた for 解く) resolves correctly.

## Example sentences
- Edge function `tatoeba-example`, cached in `example_sentences` (`sentences` + `tokens` jsonb). Upserts **merge** with existing rows so a small request never shrinks the stored set.
- Strict kanji-boundary filtering (林 must not match 林檎), lenient inflection matching for conjugated forms.
- Full-sentence furigana tokens are generated server-side and rendered by `FuriganaSentence`.
- Examples render in sans (`font-japanese`); "From your reading" extracts render in serif.
- "Show more examples" button on Word Detail; `backfill-example-tokens` (admin) adds tokens to legacy rows.

## Types & components
- `SavedWord`: `id, word, reading, meanings[], jlpt?, partsOfSpeech?, contextSentence?, contextTokens?, mastery, lastReviewedAt?, nextReviewAt?` — the reading context survives an unsave/re-save cycle.
- `src/lib/jisho.ts` — client helper with synchronous cache check.
- `src/lib/tokenizer.ts` — character-type grouping (kanji+okurigana, hiragana, katakana).

## Adding new books
The `add-book` skill runs `sync-dictionary-to-db.ts` (step 9), `preload-translations.ts` (step 10) and the grammar backfill so every token of a new book is preloaded.
