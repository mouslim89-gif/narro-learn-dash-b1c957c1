# Reader onboarding — real cut-out + interactive first step

## What changes

**1. No amber ring on normal steps**
The static amber ring is removed. Instead, the target zone stays fully bright: the dimming is drawn *around* it, using the exact same rounded rectangle shape as today's ring. Everything else on screen keeps the current `black/50` darkening.

**2. Interactive first step ("Tap a word")**
- The word under the spotlight is really tappable — taps pass through the cut-out to the reader.
- The rest of the screen stays blocked so nothing else can be triggered.
- No "Continue" button on this step: the only way forward is tapping the word (the tutorial already detects the mini popup opening and advances). The "Skip" fallback still appears after 6 s, and the X / progress dots stay.
- On this step only, an **animated amber ring** sits on the target: a slow pulsing halo (ring scales + fades outward, ~1.6 s loop) to clearly signal "tap here".

**3. Other steps unchanged**
Continue / back chevron / X, tooltip card and arrow positioning all stay exactly as they are.

## Technical notes

Single file: `src/components/onboarding/ReaderTutorial.tsx`.

- Cut-out: one absolutely positioned `div` at the highlight box, `rounded-xl`, `pointer-events-none`, with `boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'` — replaces the current full-screen `bg-black/50` layer. Same geometry/transition as the current ring, so positioning logic is untouched.
- Click blocking: a full-screen transparent `pointer-events-auto` layer *under* the cut-out for non-interactive steps. For the interactive step, that layer is replaced by four transparent blocker rects (top / bottom / left / right of the highlight), leaving the hole itself clickable.
- Pulse: an extra `pointer-events-none` div on the highlight box with `ring-2 ring-accent` plus a keyframed `tutorial-pulse` animation (scale 1 → 1.06, opacity 0.9 → 0), rendered only when `currentStep.isInteractive`. Keyframes added to `src/index.css` (`--ease-out-soft` timing).
- `handleNext` button is hidden when `currentStep.isInteractive`.

## Variations (default is A)

- **A — Pulsing ring halo** (default): amber ring that breathes outward.
- **B — Ripple + finger dot**: a small tap indicator dot animating on the word instead of a ring.
- **C — Glow only**: no ring, the un-dimmed zone gently brightens/dims in a loop.
