# Fix the pull-to-stretch effect

Two problems reported: the first row of cards never moves, and the effect only shows on the Pre-study screen.

## 1. The first row should move too

Right now only the space *between* cards grows. The very first row has nothing above it inside the list, so it stays glued to the top.

Fix: while pulling, also grow the space above the first row by the same amount (a stretched top padding on the list), so the whole list breathes downward instead of only its inner rows.

## 2. Make it work on the other pages

Diagnosis is not yet confirmed, so the first step is to verify, not to guess.

Difference between the screens: Pre-study scrolls inside its own box, while Library, Book detail, Cards, My books and Dictionary scroll with the whole page. The current detection reads the scroll position of the list element itself, which is not the scroller on those pages, and the touch listeners are attached to the list rather than to the page — so the pull is likely never registered there.

Steps:
1. Reproduce on a page-scrolled screen (Book detail chapter list) with a touch-enabled mobile preview and confirm the stretch value stays at zero.
2. Change the detection so it picks the real scroller: the nearest scrollable ancestor if there is one, otherwise the page itself, and listen on that.
3. Only engage when that scroller is actually at the very top, and disengage as soon as it isn't, so normal scrolling is untouched.
4. Re-check every listed screen: Library (home + search results), Book detail chapters, Cards (words and grammar), My books shelves, Dictionary results, Pre-study grid.

## Technical notes

- `src/hooks/use-overscroll-stretch.ts`: resolve the scroll target by walking up from the element and checking computed `overflow-y` plus `scrollHeight > clientHeight`; fall back to `window`/`document.scrollingElement`. Attach `touchstart`/`touchmove`/`touchend` to that target (or `window` for page scroll). Keep the linear 0→1 mapping over 220px and the reset on release.
- `src/components/StretchyCards.tsx`: in addition to `rowGap`, apply `paddingTop: calc(baseGap * stretch)` (same easing/transition rules), so the first row shifts by the same delta as the inter-row gaps.
- Keep reduced-motion and the global "Disable app animation" kill switch respected; no native rubber-band re-enabled.
- Verify with typecheck + build, and a touch-enabled preview pass on at least one page-scrolled screen and Pre-study.
