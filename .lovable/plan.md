# Consistent Page Entrance Animations

Apply the existing `.animate-fade-in-up` and `.stagger-children` CSS utilities across all main pages for a uniform Apple-like subtle fade-up effect. Zero JS, zero new dependencies.

## Scope

Pages: Library, MyBooks, Flashcards, Dictionary, WordDetail, BookDetail, Settings.
Excluded: Reader (no entrance anim during reading), Auth/ResetPassword (already minimal).

## Pattern

For each page:
1. **Header block** (title, subtitle, search) → wrap in `<div className="animate-fade-in-up">` or rely on parent stagger.
2. **Main content sections** (lists, grids, cards) → parent gets `stagger-children` so children fade-up sequentially (40-50ms apart, already defined in `index.css`).
3. Keep existing `stagger-children` already in place on Library shelves — verify they still feel coherent with newly animated headers.

## Per-page changes

- **Library.tsx** — Add `animate-fade-in-up` to the `<header>`. Confirm existing `stagger-children` on shelf rows.
- **MyBooks.tsx** — `animate-fade-in-up` on header; `stagger-children` on shelf list / empty state.
- **Flashcards.tsx** — `animate-fade-in-up` on header + stats; `stagger-children` on the action cards / deck list.
- **Dictionary.tsx** — `animate-fade-in-up` on header + search; `stagger-children` on results list container.
- **WordDetail.tsx** — `animate-fade-in-up` on back/header; `stagger-children` on the vertical stack of sections (definitions, kanji, examples, grammar).
- **BookDetail.tsx** — `animate-fade-in-up` on hero/cover block; `stagger-children` on chapters list and CTA section.
- **Settings.tsx** — `animate-fade-in-up` on header; `stagger-children` on the grouped settings cards.

## Notes

- Uses only existing utilities from `src/index.css` (lines 489-511). No new keyframes.
- Animations are `both` fill-mode, so initial state is hidden — no flash.
- Works cleanly with the existing Framer Motion page-level fade in `App.tsx` (opacity-only, no transform conflict).
- No changes to Reader, BottomNav, or shared components.
