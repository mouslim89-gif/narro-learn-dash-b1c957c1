

## Improve Reader text presentation and fix furigana errors

### 1. Text presentation improvements

**Problem:** The entire story renders as a single block of text with no visual breaks, making it hard to read.

**Changes to `src/pages/Reader.tsx`:**
- Group sentences into visual paragraphs (every 3-4 sentences, or split on dialogue markers like 「」)
- Add `mb-6` spacing between paragraph groups
- Add first-line indent (`text-indent: 1em`) for Japanese typographic convention
- Improve line height: use `leading-[2.8]` with furigana instead of `leading-[3.2]` (less wasted space)
- Add subtle `text-justify` for even character distribution
- Wrap the article in a warmer background card on mobile for a book-like feel

**Changes to `src/components/FuriganaWord.tsx`:**
- Reduce furigana font size from `text-[0.5em]` to `text-[0.45em]` for less visual noise
- Adjust `rt` positioning to sit closer to the base text

### 2. Fix incorrect furigana readings

**Changes to `scripts/generate-tokens.ts`:**
- Add a reading override map for known Kuromoji mistakes:
  - `二人` → `ふたり` (when used as a standalone word, not counter)
  - `或る` → `ある`
  - `翁` → `おきな`
  - `処` (when POS is noun and context suggests `ところ`) → `ところ`
- Fix `きび団子` tokenization: add merge rule for `き` + `び` when followed by `団子`, producing a single `きび団子` token

**Regenerate `src/data/book-tokens.ts`** with corrected readings.

### 3. Paragraph splitting logic

In `Reader.tsx`, the sentence array will be grouped into paragraphs using these rules:
- Start a new paragraph after a closing `」` (end of dialogue)
- Start a new paragraph before an opening `「` (start of dialogue)
- Otherwise, group every 3-4 sentences

This produces natural paragraph breaks without modifying the underlying book data.

### Files to modify
1. `src/pages/Reader.tsx` — Paragraph grouping, spacing, typography
2. `src/components/FuriganaWord.tsx` — Furigana sizing
3. `scripts/generate-tokens.ts` — Reading overrides and きび merge rule
4. `src/data/book-tokens.ts` — Regenerated with fixes

