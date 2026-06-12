## Goal
Make the header title scale animation feel 60fps during scroll, while keeping the no-shimmer-at-rest behavior.

## Change
Single file: `src/hooks/use-scroll-progress.ts`

Replace the quantization factor from `100` to `200`:
- `Math.round(p * 100) / 100` → `Math.round(p * 200) / 200`
- `q.toFixed(2)` → `q.toFixed(3)`

## Why
- Current: 100 paliers on a ~56-64px scroll range → step every ~0.6px scrolled, scale jumps of ~0.0025 (~0.08px font-size at 32px). Visible stepping.
- New: 200 paliers → step every ~0.3px scrolled, ~0.04px font-size jumps — below visual threshold, still discrete enough to prevent GPU sub-pixel shimmer at rest.

## Out of scope
No changes to pages, AnimatedTitle, CSS variables, easing, or padding/blur interpolation. Just the resolution bump.
