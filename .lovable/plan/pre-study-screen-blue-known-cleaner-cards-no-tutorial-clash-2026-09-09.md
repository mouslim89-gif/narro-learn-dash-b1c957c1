# Pre-study screen: blue "Known", cleaner cards, no tutorial clash

Four fixes on the "Before you read" full-screen step.

## What changes for you

- **"Known" is blue, not green** — a word you mark as already known now uses the app's own blue/primary tone (golden in dark mode) instead of the green that clashed with the palette. Same behaviour: the card stays visible, marked, and the word is never proposed again.
- **The reading tutorial waits** — the interactive reader walkthrough no longer starts behind the pre-study screen. It begins only once you tap "Start reading".
- **No "Word removed" undo message** when you simply deselect a card in pre-study. Removing a word from the Cards page still shows the undo as before.
- **Cleaner cards** — the JLPT level pill and the "common / very common" frequency chip are gone. Each card keeps the word, its reading, the meaning, the "appears N times" line and the Known button.

## Technical notes

- `src/components/PreStudyModal.tsx`
  - Replace all `emerald-*` classes on the tile, badge and Known button with primary tokens: `bg-primary/10`, `ring-2 ring-primary/50`, badge `bg-primary text-primary-foreground`, Known button `bg-primary/15 text-primary ring-1 ring-primary/40`. No new tokens invented.
  - Remove the JLPT pill and `frequencyLabel` chip block (and the now-unused `frequencyLabel` helper); keep `appears N times`.
  - Deselect calls `removeWord(base, { silent: true })`.
- `src/stores/flashcards.ts`: `removeWord(id, opts?: { silent?: boolean })` — when `silent`, skip the sonner toast only; the delayed cloud delete and pending-delete bookkeeping stay identical. All existing callers unchanged.
- Tutorial ordering: `src/pages/Reader.tsx` holds the pre-study open state in `ReaderPreStudy`; lift a `preStudyActive` boolean into the reader (or a small local state passed down) and render `<ReaderTutorial />` only when it is false, so the tutorial's 1.2 s visibility timer starts after the pre-study closes.
