---
name: split-book-into-parts
description: Split an existing single-blob book in Tsundoku into N narrative parts/chapters with per-part navigation, grammar, and progress. Use when the user asks to "split <book> into parts/chapters", "add chapter navigation to <book>", or "rework <book> with parts" — for any book that currently has only `content` and no `parts`/`anchors`/`chapters`.
---

# Split a book into narrative parts

The app already supports per-part navigation generically (Reader, BookDetail, GrammarPanel). To add it to a new book, you only mutate **data files** and run scripts. The reference implementation is **`lemon`** — read `src/data/books/lemon.ts` and `scripts/generate-grammar-for-lemon.ts` before starting and mirror their shape.

## Pre-flight

1. Confirm the book id (e.g. `kumo-no-ito`). Reject if the book already has `chapters` (different model — see `konbini-ningen`) or already has `parts`.
2. Ask the user **how many parts** and **what narrative anchors** (1-line English titles). If they don't say, propose 3 and infer anchors from the synopsis — then confirm before running grammar generation (it costs API calls).
3. Verify all three difficulty versions exist in `src/data/books/<id>.ts`.

## Step 1 — Rewrite `src/data/books/<id>.ts`

Replace the three flat string exports with `…Parts: string[]` arrays + an anchors array + back-compat aliases. **Each part must cover the same narrative span across all 3 difficulties** so token offsets align.

```ts
export const <id>SimplifiedParts: string[] = [`…part 1…`, `…part 2…`, `…part 3…`];
export const <id>IntermediateParts: string[] = [`…`, `…`, `…`];
export const <id>OriginalParts: string[] = [`…`, `…`, `…`];

export const <id>Anchors: string[] = [
  'Anchor 1 in English',
  'Anchor 2 in English',
  'Anchor 3 in English',
];

// Back-compat aliases — Reader still reads `content` for non-parts code paths
export const <id>Simplified = <id>SimplifiedParts.join('\n\n');
export const <id>Intermediate = <id>IntermediateParts.join('\n\n');
export const <id>Original = <id>OriginalParts.join('\n\n');
```

**CRITICAL**: separator is exactly `'\n\n'` (2 chars). The Reader slices flat tokens by char offset using this separator — any other value desyncs tokens from parts.

Splitting rules:
- Use the existing text verbatim — never paraphrase to make parts even.
- Split on natural scene/paragraph breaks. A part can be uneven in length.
- Same number of parts across all 3 difficulties, in the same narrative order.

## Step 2 — Register parts in `src/data/books.ts`

Add `parts` + `anchors` to the book entry (next to `content`, don't remove `content`):

```ts
{
  id: '<id>',
  …,
  content: { simplified: <id>Simplified, intermediate: <id>Intermediate, original: <id>Original },
  parts: { simplified: <id>SimplifiedParts, intermediate: <id>IntermediateParts, original: <id>OriginalParts },
  anchors: <id>Anchors,
},
```

Add the new exports to the import line at the top of `books.ts`.

## Step 3 — Per-part grammar

Copy `scripts/generate-grammar-for-lemon.ts` → `scripts/generate-grammar-for-<id>.ts` and replace every `lemon` reference (imports, `partsByDiff`, `allGrammar['lemon'] = result`). Do NOT change anything else — the shape `GrammarNote[][]` per (book, difficulty) is what the GrammarPanel expects.

Run it:

```bash
npx tsx scripts/generate-grammar-for-<id>.ts
```

This calls the `grammar-notes` edge function once per (difficulty × part) = usually 9 calls. Verify the resulting `src/data/book-grammar.ts` has `bookGrammar['<id>']['simplified'].length === N`.

## Step 4 — Regenerate tokens

Tokens stay flat per difficulty (the Reader slices them at render time). Just regenerate so the new text is tokenized:

```bash
npx tsx scripts/generate-tokens.ts
```

This writes `src/data/book-tokens/books/<id>.ts`.

## Step 5 — Refresh the dictionary shard

If new words were introduced (rare when only re-splitting, common when text was edited):

```bash
npx tsx scripts/generate-dictionary-shards.ts
npx tsx scripts/sync-dictionary-to-db.ts
```

## What you do NOT need to touch

- `src/pages/Reader.tsx` — already parses `part-N` chapter ids and slices tokens.
- `src/pages/BookDetail.tsx` — already renders the anchors list with per-part progress when `hasParts(book)` is true.
- `src/components/GrammarPanel.tsx` — already calls `getGrammarForPart` when `partIdx` is provided.
- `src/data/books.ts` helpers (`hasParts`, `parsePartId`, `partChapterId`, `getChapterContent`) — already handle `part-N` ids.

If any of these don't work for the new book, the bug is in the data (uneven part count across difficulties, wrong separator, missing `anchors`), not the generic code.

## Verification checklist

- [ ] `/reader/<id>/simplified/part-1` renders only part 1 text.
- [ ] Prev/Next chapter pills appear at the bottom and navigate correctly (hidden on first/last).
- [ ] `BookDetail` lists N rows, one per anchor, each linking to its own `part-N` URL.
- [ ] Grammar panel on `part-2` shows only part-2 notes (not concatenated).
- [ ] Progress saved on `part-1` shows up next to that row in BookDetail.

## Out of scope (don't do unless asked)

- Per-part audio (current pipeline is whole-book).
- Re-splitting books that use the `chapters` model (`konbini-ningen`).
- Adding a "Read all parts continuously" mode.
