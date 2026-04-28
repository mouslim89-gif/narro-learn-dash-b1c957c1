## Replace Lemon (檸檬) — simplified & intermediate versions

The two uploaded files (`lemon_beg-2.json`, `lemon_inter-2.json`) replace the current beginner and intermediate texts of 梶井基次郎『檸檬』. The **original** version (Aozora) stays unchanged. Audio is out of scope (none provided).

### What changes
- The new texts are noticeably longer and richer than the current ones (the intermediate now has ~12 paragraphs, the beginner ~9), with more concrete scenes (八百卯, 寺町通り, 京極, 蓄音機, 南京玉, びいどろ, 画集棚, etc.).
- They contain inline glosses in parentheses: `八百卯（やおう）`, `紡錘形（ぼうすいけい）`. Per the project convention (`.lovable/plan.md`), these must be **stripped from the displayed text** and the readings re-added via `book-reading-overrides.ts` so furigana still works.

### Steps

1. **Update `src/data/books/lemon.ts`**
   - Replace `lemonSimplified` with the `beginner.content` from `lemon_beg-2.json`, with all `（…）` and `(…)` removed.
   - Replace `lemonIntermediate` with the `intermediate.content` from `lemon_inter-2.json`, same stripping.
   - `lemonOriginal` stays as-is.
   - Verify zero `（`, `(`, `※`, `｜` remain.

2. **Extend `src/data/book-reading-overrides.ts`** (`'lemon'` block)
   Add the new terms appearing in the new texts:
   - `八百卯 やおう` (proper noun, fruit shop)
   - `御池 おいけ` (street name, intermediate)
   - `紡錘形 ぼうすいけい` (intermediate)
   - `南京玉 なんきんだま`, `南京虫 なんきんむし` (intermediate)
   - `琥珀色 こはくいろ` (intermediate)
   - `肺結核 はいけっかく` (intermediate)
   - `二日酔い ふつかよい` (the existing override is `二日酔`; add the variant)
   - Keep all existing overrides.

3. **Regenerate `src/data/book-tokens.ts`**
   `bunx tsx scripts/generate-tokens.ts` (re-tokenizes all books; only lemon entries effectively change).

4. **Regenerate grammar for lemon only**
   `bunx tsx scripts/generate-grammar-for-lemon.ts` — the existing script already imports the three lemon strings from `src/data/books/lemon.ts`, so it picks up the new texts automatically. It merges into `src/data/book-grammar.ts` without touching other books.

5. **Sync new vocabulary**
   `bunx tsx scripts/sync-dictionary-to-db.ts` to fetch readings/definitions for any new words introduced (蓄音機, 紡錘形, 南京玉, 八百卯, 京極, 琥珀色, 痛快, 木っ端微塵, etc., to the extent they're not already cached) into `src/data/book-dictionary.ts`.

6. **QA on `/reader/lemon/{simplified,intermediate}`**
   - No parentheses or Aozora markers visible.
   - Furigana toggle shows correct readings on `八百卯`, `紡錘形`, `蓄音機`, `木っ端微塵`, `京極`, `琥珀色`.
   - Reading-time estimate (12 min) is still reasonable; if the intermediate is now significantly longer I may bump it to ~15 min in `src/data/books.ts` — I'll check character count first and only bump if it crosses ~6000 chars.

### Files
- edit `src/data/books/lemon.ts`
- edit `src/data/book-reading-overrides.ts`
- edit (auto-regenerated) `src/data/book-tokens.ts`, `src/data/book-grammar.ts`, `src/data/book-dictionary.ts`
- possibly edit `src/data/books.ts` (only if reading-time bump is needed)
- edit `.lovable/plan.md` (note the replacement)

### Out of scope
- Audio (no MP3 provided).
- Original version (unchanged).
