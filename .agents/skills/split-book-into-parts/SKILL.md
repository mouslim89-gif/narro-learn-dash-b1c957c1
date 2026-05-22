---
name: split-book-into-parts
description: Split an existing single-blob book in Tsundoku into N narrative parts/chapters synchronized across the simplified/intermediate/original difficulties, with per-part navigation, grammar, and progress. Use when the user asks to "split <book> into parts/chapters", "add chapter navigation to <book>", or "rework <book> with parts" — for any book that currently has only `content` and no `parts`/`anchors`/`chapters`.
---

# Split a book into synchronized narrative parts

The app already supports per-part navigation generically (Reader, BookDetail, GrammarPanel). Your job is to (a) decide the part boundaries using the method below, (b) mutate data files, (c) run scripts. Reference implementation: **`lemon`** — read `src/data/books/lemon.ts` and `scripts/generate-grammar-for-lemon.ts` before starting and mirror their shape.

## Pre-flight

- Confirm the book id (e.g. `kumo-no-ito`).
- Refuse if the book already has `chapters` (different model — see `konbini-ningen`) or already has `parts`.
- Verify all three difficulty versions exist in `src/data/books/<id>.ts`.
- Do NOT ask the user how many parts; derive it from the original via the splitting method below. Confirm the proposed anchors with the user **before** running grammar generation (it costs API calls).

## Splitting method (do this FIRST, before touching any file)

Synchronized split: "part N" must cover the same narrative passage across all three difficulties. The three versions tell the same story but at different lengths — align by **narrative event**, not by character count.

### Step A — Define boundaries on the ORIGINAL

Read the `original` version end-to-end. Identify narrative ruptures: scene change, start/end of a dialogue exchange, action pivot, time jump. Cut the original into segments of roughly **1300–1700 characters**, cutting **only** at these ruptures. Prefer 3–5 parts total for a short story; never force evenness.

### Step B — Name each boundary (anchor)

For every cut, write a short anchor describing the event that opens that part. You need both:

- **English** (used in `<id>Anchors` — what the UI displays): e.g. `"The servant climbs the stairs"`.
- **Japanese** (working note, used only to align the two other versions): e.g. `「下人が梯子を登る」`.

The anchors are the spine shared by all three levels.

### Step C — Align intermediate + simplified to those anchors

Split `intermediate` and `simplified` so each part begins and ends on the same narrative event as the corresponding part in `original`. A part can be much shorter in `simplified` than in `original` — that's expected, do not pad.

### Hard splitting rules (apply to all three versions)

1. **Never** cut mid-sentence. A part must end on `。`, `！`, `？`, or a closing quote `」`.
2. **Never** separate a kanji from its furigana `《》` (also true for any inline ruby).
3. **Never** modify, summarize, or rephrase a single word. The concatenation of a version's parts (joined by `\n\n`) must be byte-identical to that version's original blob.
4. All three versions must have the **same number of parts** and the **same anchor order**.
5. Keep paragraph breaks (`\n\n` already present inside the text) — split on them, don't strip them.

### Self-check before writing files

- `<id>SimplifiedParts.join('\n\n') === <id>Simplified` (original blob) — same for intermediate and original.
- `<id>SimplifiedParts.length === <id>IntermediateParts.length === <id>OriginalParts.length === <id>Anchors.length`.
- Each part of each version ends on `。｜！｜？｜」`.

If any check fails, fix the split before proceeding.

## Step 1 — Rewrite `src/data/books/<id>.ts`

Replace the three flat string exports with `…Parts: string[]` arrays + an anchors array + back-compat aliases. **Separator is exactly `'\n\n'` (2 chars)** — the Reader slices flat tokens by char offset using this separator. Any other value desyncs tokens from parts.

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

## Step 2 — Register parts in `src/data/books.ts`

Add `parts` + `anchors` to the book entry (next to `content`; do NOT remove `content`):

```ts
{
  id: '<id>',
  …,
  content: { simplified: <id>Simplified, intermediate: <id>Intermediate, original: <id>Original },
  parts:   { simplified: <id>SimplifiedParts, intermediate: <id>IntermediateParts, original: <id>OriginalParts },
  anchors: <id>Anchors,
},
```

Also add the new `…Parts` and `…Anchors` exports to the import line at the top of `books.ts`.

## Step 3 — Per-part grammar

Copy `scripts/generate-grammar-for-lemon.ts` → `scripts/generate-grammar-for-<id>.ts` and replace every `lemon` reference (imports, `partsByDiff`, `allGrammar['lemon'] = result`). Do NOT change anything else — the shape `GrammarNote[][]` per (book, difficulty) is what the GrammarPanel expects.

```bash
npx tsx scripts/generate-grammar-for-<id>.ts
```

Calls the `grammar-notes` edge function once per (difficulty × part) — usually 9 calls. Verify `bookGrammar['<id>']['simplified'].length === N` in `src/data/book-grammar.ts`.

## Step 4 — Regenerate tokens

Tokens stay flat per difficulty (the Reader slices them at render time). Just regenerate so the new text is tokenized:

```bash
npx tsx scripts/generate-tokens.ts
```

This writes `src/data/book-tokens/books/<id>.ts`.

## Step 5 — Refresh dictionary shard (only if text was edited)

Re-splitting alone doesn't add new words. Only run if any wording was corrected:

```bash
npx tsx scripts/generate-dictionary-shards.ts
npx tsx scripts/sync-dictionary-to-db.ts
```

## What you do NOT need to touch

- `src/pages/Reader.tsx` — already parses `part-N` chapter ids and slices tokens.
- `src/pages/BookDetail.tsx` — already renders the anchors list with per-part progress when `hasParts(book)` is true.
- `src/components/GrammarPanel.tsx` — already calls `getGrammarForPart` when `partIdx` is provided.
- `src/data/books.ts` helpers (`hasParts`, `parsePartId`, `partChapterId`, `getChapterContent`) — already handle `part-N` ids.

If any of these don't work for the new book, the bug is in the data (uneven part counts, wrong separator, missing `anchors`), not in the generic code.

## Verification checklist

- [ ] `/reader/<id>/simplified/part-1` renders only part 1 text; `part-N` works for every N.
- [ ] Prev/Next chapter pills appear at the bottom and navigate correctly (hidden on first/last).
- [ ] `BookDetail` lists N rows, one per anchor, each linking to its own `part-N` URL.
- [ ] Grammar panel on `part-2` shows only part-2 notes (not concatenated).
- [ ] Progress saved on `part-1` shows up next to that row in BookDetail.
- [ ] Concat self-check from "Self-check before writing files" still holds after the edit.

## Out of scope (don't do unless asked)

- Per-part audio (current pipeline is whole-book).
- Re-splitting books that use the `chapters` model (`konbini-ningen`).
- Adding a "Read all parts continuously" mode.
