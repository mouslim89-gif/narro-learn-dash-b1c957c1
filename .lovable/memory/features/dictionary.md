---
name: Dictionary integration
description: DB-backed dictionary (Supabase `dictionary` table) with IndexedDB cache, Jisho fallback via edge function, client tokenizer
type: feature
---

## Storage
- **Source of truth**: Supabase `dictionary` table (public read, service-role write).
- **Client cache**: `src/lib/dictionary-db.ts` — IndexedDB shards hydrated from DB on first lookup.
- **Static shards** (legacy bootstrap): `public/dict/manifest.json` + shards.
- `src/data/book-dictionary.ts` is a deprecated empty stub. Do NOT add entries there — run `npx tsx scripts/sync-dictionary-to-db.ts` instead.

## Lookup flow
1. Client checks IndexedDB.
2. Miss → query Supabase `dictionary` table.
3. Miss → edge function `jisho-lookup` (proxies Jisho.org), result is upserted back into DB.

## Types & components
- `SavedWord` (flashcard): `id, word, reading, meanings[], jlpt?, partsOfSpeech?, contextSentence?, contextTokens?, mastery, lastReviewedAt?, nextReviewAt?`
- `src/lib/jisho.ts` — client helper, Map memo cache.
- `src/lib/tokenizer.ts` — character-type grouping (kanji+okurigana, hiragana, katakana).
- `WordPopup` (full drawer) and `WordMiniPopup` (inline) consume the same lookup helper.
- Dictionary page has debounced live search.

## Adding new books
The `add-book` skill runs `sync-dictionary-to-db.ts` automatically (step 9) so every token of a new book is preloaded — first WordPopup tap is instant.
