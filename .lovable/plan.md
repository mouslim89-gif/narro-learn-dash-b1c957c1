# Clean up non-standard grammar patterns

51 of the 615 unique grammar points in the index don't follow the standard `Slot + Japanese` format. Where they come from:

| Group | Count | Books |
|---|---|---|
| Legacy `～` patterns (`～のに`, `～らしい`, `～ておく`…) | 35 | a-aki (most), rashomon |
| Adverb / honorific prefixed (`まるで + Noun + のように`, `なかなか + Plain negative`, `お + Masu-stem + になる`) | 12 | lemon, urashima, sakura, hana, hashire-merosu, kumo-no-ito, gyofukuki, matsu |
| Lexical entries with Japanese labels (`お目にかける`, `まいりました (Humble verb)`, `次第に`, `時とすると / 時とすれば`, `（疑問詞）～か`) | 4 | urashima, rashomon, lemon |

Root cause: the label normalizer (`scripts/normalize-grammar-labels.ts`) only had a full mapping table for `rashomon`; **a-aki was never normalized**, and the generic rules don't touch adverb-led or lexical patterns.

## What gets fixed

1. **Legacy `～` patterns → slot format.** Each is rewritten with its real formation, e.g.
   - `～のに` → `Dictionary form + のに`
   - `～ておく (～て置く)` → `Te-form + おく`
   - `～はず (～筈)` → `Dictionary form + はず`
   - `～と (Conditional form)` → `Dictionary form + と`
   Parenthetical kanji variants are dropped; the variant stays in the meaning/tip if useful.

2. **Adverb / honorific patterns → slot-only.** The leading lexical word is removed:
   - `まるで + Noun + のように / まるで + Dictionary form + かのように` → `Noun + のように`
   - `なかなか + Plain negative`, `全く + Plain negative`, `さらに + Plain negative` → `Plain negative` variants folded into the correct slot form; where removing the adverb leaves nothing meaningful, the note is merged into the existing equivalent pattern instead of creating an empty one.
   - `お + Masu-stem + になる` → `Masu-stem + になる`, `お + Masu-stem + する/したい` → `Masu-stem + する`, etc.
   Where the rewrite collides with an already existing pattern, the two notes are deduplicated (the index already dedupes by slug, so the book-level note keeps its own meaning text).

3. **Lexical entries: kept, labels cleaned.**
   - `（疑問詞）～か` → `Question word + か`
   - `まいりました (Humble verb)` → `まいる (humble verb)`
   - `お目にかける`, `次第に`, `時とすると / 時とすれば` keep their Japanese head word, with English-only descriptive labels and no stray Japanese metadata.

4. **Cache key migration.** Renaming a pattern changes its slug, which is the key for:
   - `grammar_examples.pattern_slug` (cached AI examples)
   - `saved_grammar.item_id` (user bookmarks)
   A migration maps every old slug to its new slug in both tables, so no examples are regenerated (no AI cost) and no user loses a saved point. Rows that would collide with an existing new slug are dropped rather than duplicated.

5. **Normalizer hardening.** `scripts/normalize-grammar-labels.ts` gains the full a-aki mapping plus the adverb-stripping and lexical-label rules, so a re-run is idempotent and future books can't reintroduce these shapes.

## Verification

- Re-run the audit script: expect 0 patterns outside the standard format (aside from the 4 intentional lexical entries).
- Confirm `grammar_examples` row count is unchanged and every new slug resolves to a cached row.
- Spot-check the Dictionary → Grammar list and a few detail pages (a-aki and rashomon entries) for correct structure rendering.

## Technical notes

- Data edit is done by a one-off transform over `src/data/book-grammar.ts` (parsed as JSON, rewritten in place), same approach as the existing normalize script.
- Slug generation stays `slugifyPattern` from `src/lib/grammar.ts`; the migration is generated from the old → new pattern pairs so keys stay in sync.
- No UI changes.
