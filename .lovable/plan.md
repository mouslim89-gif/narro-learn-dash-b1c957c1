## Changes

### 1. Book title block — add author above Japanese title
In `src/pages/Reader.tsx` (the title block around lines 897-906), prepend the author name above the Japanese title, in small caps style matching the existing decorative theme.

New structure:
```
[author name — small, muted, tracked uppercase]
[大きい 日本語 タイトル]
— English Title —  (existing italic serif with side rules)
```

The author comes from `book.author` (already exists on every book in `src/data/books.ts`, e.g. "Kajii Motojirō", "Dazai Osamu").

### 2. Kinsoku — prevent mid-token breaks
In `src/index.css`, update `.reader-text`:
- Replace `word-break: normal` with `word-break: keep-all` so the browser only breaks at whitespace/punctuation boundaries, never inside a CJK token.
- Keep `line-break: strict` for proper kinsoku punctuation rules (no 。、！？ at line start, no opening brackets at line end).
- Keep `overflow-wrap: break-word` as a safety fallback for unusually long latin strings.

This combination is the standard CSS pattern for Japanese typography and respects kinsoku properly.

## Files
- `src/pages/Reader.tsx` — add author line in book title block
- `src/index.css` — switch `.reader-text` to `word-break: keep-all`