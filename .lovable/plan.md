## Goal

Restore `src/components/FlashcardReview.tsx` to its pre-theme state (the "Anki-style" version), without touching the rest of the recent design pass.

## Scope

**Revert** — only this file:
- `src/components/FlashcardReview.tsx` → restore the previous version (plain `bg-background` overlay, Button-based header, original front/back faces with JLPT pill, uppercase "MEANINGS" / "EXAMPLE" labels, primary-tinted context card, no quote glyph, no serif numerals).

**Keep as-is** (from the theme pass):
- `src/components/SrsButtons.tsx` (rounded-full tinted pill buttons) — the user only asked about Review mode itself; SRS buttons are a separate component. If you want those reverted too, say so.
- `src/pages/Flashcards.tsx` (list page restyle).
- `src/pages/BookDetail.tsx` (detail page restyle).

## How

Rewrite `FlashcardReview.tsx` back to the snapshot we have in context:
- Overlay: `fixed inset-0 z-[60] … bg-background`.
- Header: two `Button variant="ghost" size="icon"` (back arrow + trash).
- Progress: `Progress` + centered `text-xs` count.
- Front face: `rounded-2xl border bg-card shadow-lg`, `font-japanese text-6xl`, `text-xl mt-3` reading, "Tap to flip" hint with `mt-8 text-xs uppercase tracking-wider`.
- Back face: header with word + reading + romaji + JLPT pill (`rounded-full bg-accent/15 … text-accent`) + parts-of-speech chips, body with `text-[10px] font-semibold uppercase tracking-wider` "Meanings" label, `list-decimal list-inside` meanings, primary-tinted context-sentence card with `BookOpen` icon and "From your reading" label, "Example" section.
- Footer: `SrsButtons` when flipped, `Skip →` outline button otherwise.
- Completion screen: original French strings (`Session terminée !`, `{n} cartes révisées`, `Retour`).

No data, store, or routing changes.

## Confirm

1. Restore only `FlashcardReview.tsx`, leave `SrsButtons.tsx` with the new tinted pill style — correct?
2. Keep the JLPT pill on the card back (it was there in the pre-theme version) — correct?