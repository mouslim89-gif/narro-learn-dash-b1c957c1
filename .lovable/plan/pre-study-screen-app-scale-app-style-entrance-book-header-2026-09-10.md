# Pre-study screen: app scale, app-style entrance, book header

The pre-study step currently looks like a foreign screen: text and cards are smaller than everywhere else in the app, and it slides in and out sideways instead of behaving like a normal page change.

## 1. Scale it like the rest of the app

- Bring the type and spacing back to the app's normal sizes instead of the shrunken 9-11px values: title in the standard serif page-title size, intro text at the usual small body size, word cards with normal reading-size Japanese, readable meanings and a readable "appears N times" line.
- Card padding, rounding, gaps and the Known chip follow the app's standard card rules (`rounded-2xl`, `relief-raised`, `tap-scale`, ring), so a pre-study card feels the same weight as a chapter or saved-word card.
- Content is held in a centered column with the same page padding as other pages, so on a wide window it stays a phone-width screen instead of stretching.
- Keep 2 columns on phones; the grid simply gets larger, breathing cards.

## 2. Entrance and exit like a normal page change

- Replace the horizontal slide with the app's page transition: a soft fade of the whole screen using the same duration and easing as switching pages from the menu.
- Inside it, the elements arrive one after another (header, intro, counter row, then the card grid) with the app's existing staggered entrance, so it feels alive rather than snapping into place.
- Leaving works the same way in reverse: the screen fades out, and only once it has fully gone does the reader appear and the reader tutorial start (current gating is kept).
- The floating "Start reading" button stays fixed and transparent with safe-area spacing, and joins the entrance as the last staggered element.
- Reduced motion / the "disable app animation" setting removes the movement, keeping a plain instant show.

## 3. Small book header

- Add a compact header row at the top: small rounded book cover, book title, and the difficulty being read, above the "Before you read" title.
- The close/skip round button keeps its current position and style.

## Technical details

- `src/components/PreStudyModal.tsx`: swap the `x: 100% / -100%` Motion variants for the app's `pageVariants` (opacity) + `pageTransition` (`0.28s`, `[0.22, 1, 0.36, 1]`), keep `AnimatePresence onExitComplete={onClose}` so reader/tutorial gating is unchanged.
- Add `stagger-children` to the inner content column; the grid animates as one child (not 20 separate delays) to avoid a slow cascade.
- Typography bumps: title `font-serif text-[22px]`, intro `text-[13px]`, word `font-jp-serif text-xl`, reading `text-[12px]`, meanings `text-[13px]`, frequency `text-[11px]`, Known chip `text-[10px]`; card padding `p-3.5`, grid `gap-3`.
- Wrap content in `mx-auto w-full max-w-[430px]` inside the existing fixed panel; keep `data-stretch-list data-stretch-cols="2"`.
- Book header reads title/cover from `getBookById` in `src/data/books.ts` (same cover rendering used on Book Detail), no new data or network calls.
- No changes to word selection, Known logic, flashcard sync, or `preStudySeen`.
