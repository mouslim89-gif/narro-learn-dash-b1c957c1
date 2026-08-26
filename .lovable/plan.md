# Reader transitions polish

Two things feel abrupt today, both caused by the same thing: every reader navigation is a full route change, so the whole page (header included) cross-fades.

- Opening the reader from a book: the article appears in one flat fade, while tokens are still loading, so there is a blank beat before the text lands.
- Changing chapter or part: the route key in `App.tsx` is `location.pathname`, so the sticky header, the progress bar and the chrome all fade out and back in along with the text, even though only the text actually changed.

## 1. Chapter/part transition: only the text moves

Keep the reader chrome (header, progress bar, audio player) mounted and animate just the article.

- Wrap the article in `AnimatePresence mode="wait"` keyed on `${chapterId}-${difficulty}` so the outgoing chapter slides out and the incoming one slides in.
- Direction-aware: going forward the old text leaves to the left and the new one enters from the right; going back, the reverse. Direction comes from comparing the chapter index before and after.
- Short and calm: ~260ms with the app's `--ease-out-soft` curve, a small x-offset (16-20px) plus opacity, no scale.
- Scroll resets to the top of the article as the new chapter enters, not after, so there is no visible jump.
- Make the reader routes exempt from the global page fade in `App.tsx` by keying those routes on the book id instead of the full pathname, so a chapter change no longer remounts the page wrapper.

## 2. Opening the reader: a settled entrance instead of a blank beat

- While `tokensLoading` is true, show a paper-toned skeleton inside the article frame (a few text lines at the reading font size and line height) rather than an empty card, so the layout does not shift when the text arrives.
- When the tokens are ready, the title block and the first paragraphs fade up in a light stagger using the existing `.animate-fade-in-up` timing, and the rest of the text appears without animation so long chapters stay fast.
- The header chrome renders immediately at full opacity — it does not wait on tokens.
- On resume, the saved-position restore stays instant (no animated scroll), and the entrance animation is skipped when restoring deep into a chapter so the reader does not appear to jump.
- Everything is disabled when the global `no-anim` motion kill-switch is on.

## 3. Safer mini-popup positioning

The word mini popup is positioned from the sentence rect and can be clipped on small screens or near the edges. Improve the layout calculation so it always flips above/below based on available room and nudges horizontally to stay fully inside the viewport, including safe-area insets.

## Technical notes

- Files: `src/pages/Reader.tsx`, `src/App.tsx`, `src/components/WordMiniPopup.tsx`, plus a skeleton block (inline in `Reader.tsx`).
- Uses Framer Motion, already a dependency; direction is tracked in a ref so the exit animation knows which way to go.
- No backend, store or data change; progress saving, token merging and audio sync logic are untouched.
