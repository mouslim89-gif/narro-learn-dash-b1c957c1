# Reader tutorial — fix spotlight + simplify overlay

## The bug

The spotlight hole is always stuck in the top-left corner. Cause: the SVG mask uses `motion.rect` animated on `x` / `y` / `width` / `height` / `rx`. Framer Motion treats `x` and `y` as CSS transforms, not SVG attributes, so the mask rect never moves to the target — it stays at coordinate 0,0 (top-left) with an animated transform that the mask ignores.

## What changes

**1. Remove the mask/blur entirely**
- Back to a plain darkening: one `bg-black/50` overlay, no `backdrop-blur`, no SVG mask, nothing hidden.
- The target is made to stand out by a highlight box drawn on top of the overlay (transparent inside, subtle amber ring + soft glow), positioned exactly on the target — no more cut-out geometry to get wrong.

**2. Correct positioning**
- The highlight box and the tooltip are positioned with plain inline `top` / `left` / `width` / `height` styles from `getBoundingClientRect()`, with a CSS transition for smoothness — so no transform/attribute mismatch is possible.
- The tooltip arrow is aligned on the real center of the target, clamped inside the card.

**3. Remove "Tap anywhere to continue"**
- Hint text removed, and tapping the overlay no longer advances. Navigation stays: Continue button, back chevron, X to skip (plus the interactive first step, which still advances when a word is tapped).

**4. Cleanup**
- Remove the 100 ms `setInterval` reposition loop; reposition on resize/scroll and on step change only.

## Technical notes

- File touched: `src/components/onboarding/ReaderTutorial.tsx` only.
- Highlight element: absolutely positioned `div` with `rounded-xl ring-2 ring-accent/70 shadow-[0_0_0_9999px_transparent]`, `pointer-events-none`, animated via `transition-all duration-300 var(--ease-out-soft)`.
- Overlay stays `pointer-events-auto` to block accidental reader taps, except on the interactive step where the target area stays tappable.

## Variations available (say which you prefer, default is A)

- **A — Darkening + amber ring** (default): simple dim, target ringed.
- **B — Darkening only**: no ring at all, only the tooltip arrow points at the target.
- **C — Darkening + soft glow**: dim plus a diffuse light halo behind the target instead of a hard ring.
