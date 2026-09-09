# Pre-study popup: clarity, relief, and a "Known" shortcut

Fixes the clipped selection outline, explains what the screen is for, shows readable frequency, and lets you dismiss words you already know.

## What changes for you

- **Outline no longer cut off** — the selected card's amber ring is fully visible, including on the first row and the edges.
- **Clear intro** — a real title in the app's heading font: "Before you read" becomes a proper header with a one-line explanation ("The 20 most frequent words in this book — tap to add them to your flashcards").
- **20 words instead of 15**, and words already in your flashcards (any level) are never shown. The list always fills up to 20 by going further down the frequency ranking.
- **Readable frequency** — "appears 37 times" instead of "×37", with the descriptive label kept ("very common", etc.).
- **New "Known" action per card** — a small check-off button marks the word as already known: it disappears from the list and will never be proposed in a pre-study screen again. No flashcard is created.
- **Cards get the app's standard raised relief**, same rule as every other raised surface in the app (`relief-raised`), not a new invented style.

## Technical notes

- `src/components/PreStudyModal.tsx`
  - Header: `font-serif text-lg font-semibold` title + `text-[11px] text-muted-foreground` subtitle, replacing the current uppercase micro-label as the main heading.
  - Clipping fix: add `p-1 -m-1` (or equivalent padding) on the scroll container so the `ring-2` isn't cut by `overflow-y-auto`; keep `no-scrollbar`.
  - Tiles: `rounded-2xl bg-card p-2.5 ring-1 ring-border/30 relief-raised tap-scale`, selected = `bg-accent/5 ring-2 ring-accent/60`. No hover styles.
  - Two actions per tile: main tap area toggles the flashcard (existing behaviour), plus a small secondary "Known" button (check icon, muted, `tap-scale-sm`) that calls `markWordKnown(base)`.
  - `TARGET_COUNT` 15 → 20; `pickKeyWords` receives the exclusion set (saved flashcard ids + known ids) and slices to 20 *after* filtering, so the list is always full.
  - Frequency string: `${count} times` alongside `frequencyLabel(count)`.
- `src/stores/reading-progress.ts`: add persisted local-only `knownWords: string[]` + `markWordKnown(id)` (idempotent), next to `preStudySeen`. Local only, no cloud sync, no schema change.
- No network/AI calls added — `pickKeyWords` stays local tokens + cache-only dictionary reads.
