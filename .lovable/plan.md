# Reader gesture & navigation polish

Make the core reading experience feel more like a native e-reader: move between chapters and positions with fewer taps and no buried menus.

## 1. Swipe between chapters / parts

Add horizontal swipe gestures to the reader article to jump to the next or previous chapter (or part). Only the article area responds, so vertical scrolling is unaffected.

- Swipe left → next chapter/part (if one exists).
- Swipe right → previous chapter/part (if one exists).
- Use a small threshold and a short haptic-style visual nudge at the edge when there is no next/previous chapter.
- Keep the existing bottom part-navigation buttons for discoverability; the swipe is an additional shortcut.

## 2. Tap/drag the progress bar to jump

The thin top progress bar currently only displays scroll position. Make it interactive:

- Tap anywhere on the bar to jump to that percentage of the article.
- Drag to scrub; the current percentage updates live under the finger and the page scrolls on release.
- Add a small touch target (at least 24px high) so it is easy to hit on mobile.

## 3. Bottom chapter dots for multi-chapter books

For books with more than one chapter or part, show a compact row of dots above the article (or just below it) so users can see where they are and jump quickly.

- Each dot represents one chapter/part.
- The active dot is filled with the book cover color.
- Tapping a dot jumps to that chapter/part.
- Hide on single-chapter books so the UI stays clean.

## 4. Safer mini-popup positioning

The word mini popup is positioned relative to the sentence rect. On small screens or near edges it can be clipped. Improve the layout calculation so it always flips above/below and nudges left/right to stay fully inside the viewport, including the safe-area insets.

## Technical notes

- Files touched: `src/pages/Reader.tsx`, `src/components/WordMiniPopup.tsx`, `src/index.css` (only if a new swipe indicator style is needed).
- Use native touch events on the article wrapper for swipe detection; do not add a gesture library.
- Keep the existing `goTo` delayed navigation helper for chapter transitions.
- Progress scrubbing uses the article's `scrollHeight` and `scrollTop`; suppress auto-save while scrubbing so the saved progress does not flicker.
- No backend or schema changes; this is a pure frontend UX improvement.
