## 1. Restore Anki-style SRS buttons

Rewrite `src/components/SrsButtons.tsx` to the classic Anki layout:

- 4 equal-width rectangular buttons in a row, no rounded-full pills, no gradient tints
- Each button shows the interval (e.g. "<10m", "1d") on top in small muted text and the label ("Again", "Hard", "Good", "Easy") below in bold
- Solid colored bottom border / background-tint per quality:
  - Again → red
  - Hard → orange/amber
  - Good → green
  - Easy → blue
- Use semantic tokens (no raw hex). Keep the `previewIntervalDays` / `formatInterval` calls and the `SrsQualityLabel` API unchanged so `FlashcardReview.tsx` doesn't need to change.

## 2. Fix the back-card scroll

In `src/components/FlashcardReview.tsx`, the back-face body is currently:

```tsx
className={`flex-1 min-h-0 px-5 py-4 ${showAllMeanings ? 'overflow-y-auto' : 'overflow-hidden'}`}
```

That hides overflow whenever meanings aren't expanded, so a long Tatoeba example sentence becomes unreachable. Change it to always scroll:

```tsx
className="flex-1 min-h-0 px-5 py-4 overflow-y-auto overscroll-contain"
```

Also stop click events inside the scroll body from flipping the card (already partly done via `data-no-flip` + `stopPropagation`), and add `touch-action: pan-y` so vertical scrolling on mobile isn't intercepted by the card flip handler.

No other files change. Layout (`flex-1 min-h-0` parent) already reserves the right amount of space; the bug is purely the conditional `overflow-hidden`.

## Files touched

- `src/components/SrsButtons.tsx` — full rewrite to Anki style
- `src/components/FlashcardReview.tsx` — one-line scroll fix + `touch-action` on body
