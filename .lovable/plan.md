# Per-part navigation for Lemon

Each narrative part becomes a real page, the same way multi-chapter books like Konbini already work.

## Routing

- New URL shape: `/reader/:bookId/:difficulty/part-:idx` (1-indexed, e.g. `part-1`, `part-2`, `part-3`).
- BookDetail's "Chapters" list links each anchor to its own part URL.
- "Start / Continue Reading" CTA also targets the right part (saved progress's `chapterId` or `part-1` by default).
- Existing `/reader/:id/:diff` URL (no part) keeps working for books without `parts` — unchanged.

## Data plumbing (no regeneration needed)

- `books.ts`:
  - `hasParts(book)` helper — true when `book.parts && book.anchors`.
  - `getPartContent(book, partIdx, difficulty)` — returns `book.parts[difficulty][partIdx-1]`.
  - Extend `getChapterContent` so a `chapterId` matching `/^part-(\d+)$/` on a parts-book returns that part's text.
  - Extend `chapterKey` similarly so token cache lookups stay coherent (`lemon__part-1`, etc.).
- `book-tokens`: tokens are still a single flat array per difficulty (kept as decided). The Reader slices that array by cumulative `.t` char count to match `parts[diff][0..idx-1].join("\n\n").length`. Separator is `\n\n` (verified). The slice runs once per `(book, difficulty, partIdx)` via `useMemo`.
- `book-grammar`: already `GrammarNote[][]` per part. `GrammarPanel` switches from `getGrammarFlat` to `getGrammarForPart(bookId, difficulty, partIdx)` when on a parts-book; falls back to flat otherwise.
- `book-dictionary` / hydration: unchanged. `hydrateDictionaryForBook(id, chapterId)` is called with the part id so it can later be specialized; for now it just hydrates the book as it does today.

## Reader changes (`src/pages/Reader.tsx`)

- Parse `chapterParam`: if it matches `part-N` and the book has parts, set `partIdx`.
- `bookText` and `tokens` memos: when `partIdx` is set, slice the flat tokens array to the part's char window and feed only that slice to the existing sentence/paragraph pipeline. All downstream logic (sentence refs, popups, audio scrolling, scroll progress) stays untouched because it operates on the already-sliced `tokens`.
- Header chip: show `Part {idx} / {total} — {anchor title}` for parts-books (mirrors the existing chapter chip).
- Bottom "Prev part / Next part" buttons — same component used by chapter books, just driven by part indices. Hidden on first/last.
- Progress: `updateProgress(id, "part-N", difficulty, pct)` — gives a real per-part progress bar in BookDetail's list (like chapters already do).

## BookDetail changes (`src/pages/BookDetail.tsx`)

- When `hasParts(book)`:
  - Treat `anchors` like a chapters list: read `getChapterProgress(id)` keyed by `part-N`, show per-part progress + checkmark when 100 %.
  - "Continue" CTA → `/reader/:id/:diff/part-{bookProgress?.chapterId or 'part-1'}`.
- Remove the temporary "all parts link to the same place" code added in the previous step.

## GrammarPanel

- Accept an optional `partIdx`. When provided + grammar is per-part, render only that part's notes. Otherwise keep `getGrammarFlat` behavior.

## Out of scope

- Audio per part (user said: skip for now).
- Resplitting any other book.
- Continuous "Read all parts" scroll mode.

## Technical notes

```text
URL                            chapterId stored in progress
/reader/lemon/simplified/part-1   "part-1"
/reader/lemon/simplified/part-2   "part-2"
/reader/lemon/simplified/part-3   "part-3"
/reader/kumo-no-ito/simplified    "main"   (unchanged)
/reader/konbini-ningen/.../ch-2   "ch-2"   (unchanged)
```

Token slice boundaries (computed once per render):

```text
sep   = "\n\n"           // 2 chars
end[i]   = sum(parts[diff][0..i].length) + i * sep.length
start[i] = i === 0 ? 0 : end[i-1] + sep.length
```

Walk tokens cumulatively: include tokens whose char window falls inside `[start, end)`. The `\n\n` separator lives as either a newline token or an embedded `\n` inside a token — both already handled by the existing sentence splitter, so a token straddling the boundary is rare; if it happens we keep it with the earlier part (deterministic, no visual artifact).

## Files touched

- `src/data/books.ts` (helpers: `hasParts`, `getPartContent`, extend `getChapterContent` + `chapterKey`)
- `src/pages/BookDetail.tsx` (parts-aware chapter list + CTA)
- `src/pages/Reader.tsx` (part param parsing, token slicing, header chip, Prev/Next)
- `src/components/GrammarPanel.tsx` (per-part filtering when applicable)
