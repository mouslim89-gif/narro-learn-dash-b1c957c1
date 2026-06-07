## Split 魚服記 (gyofukuki) into 4 parts

The original text is already divided by Dazai into four numbered sections (一・二・三・四). Those sections are natural narrative ruptures, so I'll use them as the spine and align the simplified + intermediate versions to those same boundaries. The `一`/`二`/`三`/`四` section headers (and their surrounding blank lines) will be **stripped from the original text** since the anchors below already serve as chapter titles in the UI — keeping them would duplicate the title above each part.

### Proposed anchors (chapter titles, no spoilers)

1. **Mato Mountain Falls** — opens with the mountain setting and the visiting student
2. **The Charcoal Hut** — opens with autumn smoke and Suwa's life with her father
3. **First Snow** — opens with the harsh winter closing in
4. **Beneath the Water** — opens after the plunge into the falls

### Boundaries (where each part ends)

| Part | Closing line / event |
|---|---|
| 1 | the student is dragged under: 「それきりまたぐっと水底へ引きずりこまれたのである。」 |
| 2 | Suwa shouts at her father on the path: 「『阿呆、阿呆』と呶鳴った。」 |
| 3 | Suwa leaps into the falls: 「『おど！』とひくく言って飛び込んだ。」 |
| 4 | the fish is pulled into the falls: 「たちまち、くるくると木の葉のように吸いこまれた。」 |

### Alignment across the three versions

**Simplified** (16 paragraphs) maps to the same 4 boundaries:
- Part 1: paragraphs 1–5 (mountain → student falls in)
- Part 2: paragraphs 6–7 (legend + autumn/mushrooms)
- Part 3: paragraphs 8–12 (winter → jump into falls)
- Part 4: paragraphs 13–16 (underwater → becomes fish)

**Intermediate** (16 paragraphs) maps identically by narrative event:
- Part 1: paragraphs 1–5
- Part 2: paragraphs 6–7
- Part 3: paragraphs 8–12
- Part 4: paragraphs 13–16

**Original**: split at the existing `一`/`二`/`三`/`四` boundaries; each header line and its trailing blank line are removed so each part starts directly on the first content paragraph of its section.

All splits land on `。` / `！` / `」`. No sentence is cut.

### Byte-identity self-check (adjusted for removed headers)

- `gyofukukiSimplifiedParts.join('\n\n') === gyofukukiSimplified` (unchanged).
- `gyofukukiIntermediateParts.join('\n\n') === gyofukukiIntermediate` (unchanged).
- For the original: `gyofukukiOriginalParts.join('\n\n')` equals the original blob **with the four `一`/`二`/`三`/`四` header lines + their blank-line separators removed**. The `gyofukukiOriginal` back-compat alias is redefined as `gyofukukiOriginalParts.join('\n\n')` so it matches the new canonical form. This is the only wording change to the original — nothing else is touched.

### Files to change

1. **`src/data/books/gyofukuki.ts`** — replace the 3 flat exports with `…Parts: string[]` arrays + `gyofukukiAnchors`; back-compat aliases (`gyofukukiSimplified`, etc.) defined as `…Parts.join('\n\n')`. The new `gyofukukiOriginalParts` array omits the `一`/`二`/`三`/`四` headers.
2. **`src/data/books.ts`** — extend the gyofukuki import to include the new `…Parts` + `…Anchors` exports; add `parts: { … }` and `anchors: gyofukukiAnchors` to the catalog entry (keep `content`).
3. **`scripts/generate-grammar-for-gyofukuki.ts`** — already exists but uses the old flat-string shape; rewrite it from `generate-grammar-for-lemon.ts` so it iterates per part and writes the `GrammarNote[][]` shape into `book-grammar.ts`.

### Commands to run after the data changes

```bash
npx tsx scripts/generate-grammar-for-gyofukuki.ts   # 4 parts × 3 difficulties = 12 edge-function calls
npx tsx scripts/generate-tokens.ts                  # regenerate flat tokens for gyofukuki (now without 一/二/三/四)
```

No dictionary-shard regeneration needed (no new vocabulary — we only remove the four kanji headers, which already exist in other shards).

### What I will NOT touch

`Reader.tsx`, `BookDetail.tsx`, `GrammarPanel.tsx`, and the helpers in `books.ts` (`hasParts`, `parsePartId`, `partChapterId`, `getChapterContent`) — they already handle `part-N` ids generically.

### Verification

- Searching the rendered text for `一`, `二`, `三`, `四` as standalone section headers returns nothing (the kanji can still appear inside sentences, e.g. 「二人」, 「四五人」 — those are untouched).
- `/reader/gyofukuki/simplified/part-1` … `part-4` render the correct slices, with no leftover section numeral at the top of any part.
- BookDetail shows 4 chapter rows linking to each `part-N`.
- Grammar panel on part-2 shows only part-2 notes.
- The 3 byte-identity checks above hold.

Used the split-book-into-parts skill.