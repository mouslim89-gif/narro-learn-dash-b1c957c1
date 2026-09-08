# Pre-study: 2-column grid synced with flashcards

Replace the one-word-at-a-time swipe flow with a scannable 2-column grid of the ~15 key words, where each tile is a live toggle bound to the saved flashcards.

## What changes for the user

- Before reading a book for the first time, the "Before you read" screen shows all key words at once in a 2-column grid.
- Each tile shows the word, its reading, a short meaning, its JLPT level and how often it appears in the book.
- Tapping a tile saves that word to the flashcards immediately; tapping again removes it. Selected tiles are visually marked (amber ring + check badge).
- Words already in the flashcards appear pre-selected when the screen opens, and stay in sync if they were added elsewhere.
- A "Select all" / "Clear" shortcut at the top, a live count ("4 of 15 saved"), and a single "Start reading" button at the bottom. "Skip" stays available.
- The final "You're ready" step is removed — saving happens live, so the screen closes straight into the book.

## Technical notes

- `src/components/PreStudyModal.tsx` only. Keep `pickKeyWords` (local tokens + cache-only dictionary reads, no network/AI) unchanged.
- Drop `index` / `learning` / `done` state. Derive selection from the store: subscribe to `savedWords` from `useFlashcardStore` and compute `saved = new Set(savedWords.map(w => w.id))`.
- Tile tap calls `addWord({ id: base, word: base, reading, meanings, jlpt, partsOfSpeech })` or `removeWord(base)` — this keeps the existing undo toast and cloud sync behavior intact.
- Grid: `grid grid-cols-2 gap-2.5`, tiles `rounded-2xl bg-card p-3 ring-1 ring-border/30 tap-scale`, selected state `ring-2 ring-accent/60 bg-accent/5`. Scroll area capped at ~60vh with `no-scrollbar`.
- Keep existing typography tokens (`font-jp-serif` word, `font-japanese` reading, muted uppercase micro-labels) and the amber JLPT pill. No hover styles.
- `onClose` behavior unchanged (marks book+difficulty as seen).
