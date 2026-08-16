# Keep the highlight sub-rows visible when the master toggle is off

## Problem

In the reader settings, turning off "Highlight saved words" removes the three sub-rows (New words / Learning / Known) from the panel, which makes the panel jump and hides the user's per-level choices.

## Change

Always render the three sub-rows. When the master toggle is off, they stay in place but are disabled:

- Sub-row switches become non-interactive (`disabled`) and visually dimmed (reduced opacity on the row, muted text and dot).
- Their stored values are untouched, so re-enabling the master toggle restores the exact previous configuration.
- No layout shift: the card keeps the same height in both states.

## Technical detail

Single file: `src/pages/Reader.tsx`, "Highlights" section.
Replace the `{showKnownHighlights && (...)}` conditional with an always-rendered block, adding `disabled={!showKnownHighlights}` on the three `Switch` components and a `cn(...)` class applying `opacity-45 pointer-events-none` (opacity transition via `smooth-colors`) to each sub-row when the master toggle is off. No store or logic changes.
