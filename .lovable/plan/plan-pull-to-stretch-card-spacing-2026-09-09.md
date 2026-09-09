# Plan — Pull-to-stretch card spacing

## Goal
Add a subtle, controlled stretch effect: when the user pulls down past the top of a vertical card list, the vertical gap between cards increases linearly, up to double the normal gap at maximum pull. Apply it to every vertical card list in the app, including the PreStudy screen.

## Scope
- Book Detail: chapter lists (single- and multi-part books).
- Flashcards: words list and grammar list.
- My Books: bookshelf rows grid.
- Dictionary: words results and grammar results.
- PreStudy: key-words grid.
- Library search results (vertical stack of cards).

## Approach
1. Create a reusable hook `useOverscrollStretch(containerRef, { maxPull = 220, disabled })`.
   - Detects when the scroll container is at its top and the user is dragging down.
   - Works for both window-scroll pages (attach to `document`) and internal scrollers (PreStudy).
   - Returns a `stretch` value in `[0, 1]`, linear with pull distance.
   - On release, smoothly animates `stretch` back to `0`.
   - Respects `prefers-reduced-motion` and the app's global "Disable app animation" setting.
   - Does **not** re-enable native rubber-band bounce; it uses custom touch tracking on top of the existing `overscroll-behavior: none`.

2. Create a small wrapper component `StretchyCards`.
   - Replaces `space-y-*` / `gap-*` on the target lists.
   - Accepts a base gap in Tailwind spacing units (e.g. `2`, `2.5`, `3`).
   - Applies `gap: calc(var(--base-gap) * (1 + var(--stretch, 0)))` via inline style.
   - Preserves existing layout classes (`flex-col`, `grid`, `px-6`, etc.).

3. Wire each page's vertical card lists to `StretchyCards`.
   - Book Detail: wrap the two chapter `<ul>` elements.
   - Flashcards: wrap the words `<ul>` and grammar `<ul>`.
   - My Books: wrap the bookshelf rows grid.
   - Dictionary: wrap the words results stack and grammar results stack.
   - PreStudy: wrap the key-words grid.
   - Library search results: wrap the results stack.

4. QA on mobile viewport.
   - Verify no horizontal scroll, no layout shift on normal scroll, and the gap doubles smoothly at full pull.
   - Verify PreStudy internal scroller behaves identically.
   - Verify reduced-motion and animation-disable flags turn the effect off.

## Technical details
- Base gap mapping: Tailwind spacing unit `n` → `n * 0.25rem`.
- Max stretch factor: `1.0` (gap doubles).
- Release animation: CSS transition on the container's `gap` property, driven by a state update to `stretch = 0` with a short transition duration.
- The hook will use `touchstart` / `touchmove` / `touchend` and guard against normal scrolling by only reacting when the scroll position is at `0` and the delta is downward.
- Avoid applying the effect to horizontal rails (Library genre rows) and the Reader text, which are out of scope.
