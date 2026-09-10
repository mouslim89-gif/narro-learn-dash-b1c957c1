# Pull-to-stretch on every block, everywhere

## What you asked
Right now the stretch only affects a few card lists (pre-study, search results). You want it on **every block of every page**: stat tiles, hero, rails, section cards, chapter rows, settings rows, list items — anything that stacks vertically.

## New approach: one global driver instead of per-list wrappers

Today each list attaches its own touch listeners and animates its own gap. That is why coverage is patchy. Replace it with a single app-level driver:

1. A `StretchProvider` mounted once in the app tracks the downward pull at the top of the page (window scroll or the active inner scroller, as today) and writes a value `0 → 1` into a CSS variable `--stretch` on the `<html>` element.
2. A global CSS rule spreads that value across the page automatically, so no page needs individual wiring.

```text
finger pulls down at top
        ↓
--stretch: 0 → 1 on <html>
        ↓
every stacked block on the page gains vertical breathing room
```

## Where the spacing is added

A global rule targets the vertical children of the scrolling page content:

- The first block gets extra space above it, so the very top of the page also moves (fixes the "first two cards don't stretch" feeling).
- Every following sibling block gets an added top offset that grows with the pull.
- Applies at the page level (header, hero, each section) **and** inside vertical stacks (chapter rows, saved word rows, dictionary results, bookshelf rows, stat tiles, settings rows, pre-study grid rows).
- Horizontal rails (library genre rows) keep their horizontal spacing untouched; only vertical spacing reacts.
- Reader text, the reader chrome, the flashcard review screen and fixed overlays (bottom nav, floating actions, popups) are excluded.

Amount: at full pull each vertical gap roughly doubles, linear with pull distance, and eases back on release with the app's standard soft easing.

## Cleanup

- `StretchyCards` is retired; the pages that use it go back to their normal Tailwind spacing classes, since the global rule now handles the effect.
- The existing `useOverscrollStretch` hook is reused by the provider (single listener for the whole app instead of one per list).
- Respects the global "Disable app animation" setting and reduced-motion: the variable stays at 0 and nothing moves.

## Technical details

- `--stretch` is written with a direct style mutation on `document.documentElement` (no React re-render per touch move), and a `--stretch-ease` toggle controls the transition on release.
- Global CSS in `index.css`:
  - `[data-stretch-root] > * + * { margin-top: calc(var(--stretch, 0) * var(--stretch-step)) }`
  - `[data-stretch-root] { padding-top: calc(var(--stretch, 0) * var(--stretch-step)) }`
  - `--stretch-step` defaults to a value proportional to the element's own gap, set per container (e.g. `0.5rem` for tight lists, `1rem` for page sections).
- Page roots get `data-stretch-root` via the shared route wrapper in `App.tsx`, plus opt-in on inner scrollers (pre-study) and on vertical lists that need a smaller step.
- Excluded via `data-no-stretch` on reader article, review deck and fixed overlays.
- Uses `margin-top`, not `gap`, so it works for `space-y-*`, grids and plain stacks alike without touching each page's classes.
