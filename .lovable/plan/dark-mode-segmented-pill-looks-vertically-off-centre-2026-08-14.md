# Dark mode: segmented pill looks vertically off-centre

## What's happening

The sliding pill is `absolute inset-0` inside a `p-1` container, so geometrically it is perfectly centred. What shifts the perception is the shadow: in dark mode `.dark .relief-raised` casts a downward drop shadow (`0 1px 2px black/0.35` + `0 2px 6px -1px black/0.40`) with no upward counterpart. On a dark `bg-muted` track that shadow reads as part of the pill, so the pill appears to sit high with extra empty space above it.

Light mode has the same offsets, but the shadow is much less contrasty against the warm light track, so it isn't noticeable.

## Fix options

**Option A (recommended) — dark-mode-only balanced shadow for segmented pills**
Add a dedicated class (e.g. `.seg-pill`) used by the sliding `motion.div` in `src/pages/Flashcards.tsx` and `src/pages/Settings.tsx`. In dark mode it uses a vertically balanced shadow: same blur, `0 0 4px` ambient plus a much smaller `0 1px 2px black/0.25` and a top inset highlight — no visual downward drag. Keeps the raised feel, removes the optical offset.

**Option B — soften the dark drop shadow globally**
Change `.dark .relief-raised` to `0 1px 3px black/0.30` only (drop the `0 2px 6px -1px` layer). Simplest, but affects every raised surface in dark mode (buttons, cards, tiles).

**Option C — nudge the pill**
Give the pill `top: -0.5px` in dark mode to optically compensate. Cheapest, but a hack that breaks if shadows change.

Recommendation: Option A — scoped to segmented controls, no side effects elsewhere.

## Technical notes

- New utility in `src/index.css` next to `.relief-raised`.
- Apply to the sliding pill in `src/pages/Flashcards.tsx` (`layoutId="seg-review-scope"` and `layoutId="seg-cards-tab"`) and the font-size switch in `src/pages/Settings.tsx`, replacing `relief-raised`.
- No logic changes.
