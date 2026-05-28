# Split `asa` and `hashire-merosu` into synchronized parts

Following the `split-book-into-parts` skill. Both books are currently single blobs with no `parts`. I derived boundaries from the **original** version (longest one) and will mirror them in `intermediate` and `simplified`.

## Sizes (current)


| Book           | simplified | intermediate | original |
| -------------- | ---------- | ------------ | -------- |
| asa            | 1 729      | 3 139        | 3 142    |
| hashire-merosu | 2 518      | 6 508        | 9 936    |


## Proposed splits

### `asa` → 2 parts (~1 500 chars each in original)


| #   | Anchor (English)                                              | Original ends on       |
| --- | ------------------------------------------------------------- | ---------------------- |
| 1   | The narrator sets up his secret workroom in Kiku-chan's place | …「あっさり結婚する気でいるようであった。」 |
| 2   | A drunken night in Kiku-chan's room until dawn                | …「私は起きて、帰る身支度をした。」     |


Boundary is the clean scene break right before `先夜、私は大酒を飲んだ。` — backstory ends, the long night begins.

### `hashire-merosu` → 6 parts (~1 100–2 100 chars each in original)


| #   | Anchor (English)                                             | Original ends on             |
| --- | ------------------------------------------------------------ | ---------------------------- |
| 1   | Melos arrives in Syracuse and learns of the king's killings  | …「呆れた王だ。生かして置けぬ。」            |
| 2   | Melos confronts the king and pledges Selinuntius as hostage  | …「ものも言いたくなくなった。」             |
| 3   | Melos returns home for his sister's wedding and falls asleep | …「死んだように深く眠った。」              |
| 4   | Melos sets out, swims the flooded river, fights the bandits  | …「さっさと走って峠を下った。」             |
| 5   | Exhaustion, the spring, and the resolve to run again         | …「走れ！メロス。」 (the famous line) |
| 6   | The final sprint, the embrace, and the king joins them       | …「勇者は、ひどく赤面した。」              |


Part 5 is the longest (~2 100 chars) because the despair monologue → spring → resolve is one indivisible narrative beat — splitting it would break the climax.

## Implementation steps (per book)

1. **Rewrite `src/data/books/<id>.ts**`: replace each flat export with `<id>SimplifiedParts: string[]`, `<id>IntermediateParts: string[]`, `<id>OriginalParts: string[]`, add `<id>Anchors: string[]`, keep back-compat `<id>Simplified/Intermediate/Original = …Parts.join('\n\n')`.
2. **Register parts in `src/data/books.ts**`: add `parts` + `anchors` fields and update the import line; keep existing `content`.
3. **Per-part grammar**: copy `scripts/generate-grammar-for-lemon.ts` → `scripts/generate-grammar-for-asa.ts` (replacing the existing single-version script) and create `scripts/generate-grammar-for-merosu.ts`. Run each one — ~6 calls for asa (2 parts × 3 difficulties) and ~18 calls for merosu (6 × 3).
4. **Regenerate tokens**: `npx tsx scripts/generate-tokens.ts` so the new text is tokenized (tokens stay flat per difficulty; the Reader slices them at render time by char offset using `\n\n`).

## Self-check (will run before writing files)

- `…Parts.join('\n\n') === <id>Original/Intermediate/Simplified` (byte-identical, no word touched).
- All three versions have the same part count and same anchor order.
- Each part ends on `。`, `！`, `？`, or `」`.
- No mid-sentence and no kanji/furigana split.

## What I won't touch

- `Reader.tsx`, `BookDetail.tsx`, `GrammarPanel.tsx`, the `books.ts` helpers — they already handle `part-N` ids generically.
- Audio sync (whole-book pipeline, out of scope per skill).
- Dictionary shard (no wording change, so no new words).

## Cost note

The grammar regeneration calls the `grammar-notes` edge function ~24 times total. Cheap, but not free — that's why I'm asking you to confirm the anchors first.

**Confirm the anchors above and I'll proceed.** If you want fewer/more parts for either book (e.g. merge merosu parts 4+5, or split asa into 3), tell me and I'll revise before any API call.