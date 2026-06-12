## Goal
Make the page-title scroll-scaling animation as smooth as the other header interpolations (opacity, blur, background) by removing the per-frame layout reflow it causes.

## Root cause
`AnimatedTitle` scales via `transform: scale(calc(1 - var(--p)*0.x))`, but each page also passes a `marginBottom: calc(var(--p) * -Npx)` to visually pull siblings up. `margin` is a **layout** property → every `--p` step reflows the header and its neighbors. Combined with the lack of `will-change` on the scaled span, glyphs also get re-rasterized on each step. Result: visible stepping on the title only, while opacity/blur (compositor-only) stay smooth.

## Change

### 1. `src/components/AnimatedTitle.tsx`
- Stop reading/forwarding `marginBottom` from `style` (it's no longer needed).
- Accept an optional `translateY` (string, e.g. `'calc(var(--p, 0) * -10px)'`) passed through `style` as a CSS variable `--title-ty`.
- On the inner scaled `<span>`:
  - `transform: scale(var(--title-scale, 1)) translateY(var(--title-ty, 0))` (single composite transform).
  - Add `will-change: transform` and `transform-origin: left top`.
  - Keep `display: inline-block` so transform applies cleanly.

### 2. The four pages using the scroll-scaling title
`src/pages/Library.tsx`, `src/pages/Flashcards.tsx`, `src/pages/MyBooks.tsx`, `src/pages/Dictionary.tsx`

For each `<AnimatedTitle … style={{ ... }} />`:
- Remove `marginBottom: 'calc(var(--p, 0) * -Npx)'`.
- Add `'--title-ty': 'calc(var(--p, 0) * -Npx)'` with the same N currently used in marginBottom (Library: 18, others: 10) so the visual compensation is identical, but driven by `transform` instead of layout.

Everything else (the page's own `paddingTop`/`paddingBottom` interpolation on the header, font-size scale factor, blur, background) stays untouched.

### 3. Quick verify
- Scroll Library/MyBooks/Dictionary/Flashcards on mobile viewport → title should glide, no stepping.
- Header collapse spacing should look identical at `--p = 0` and `--p = 1` (same N value, just on a different property).

## Why this works
- `transform` is composited on the GPU; combined with `will-change: transform`, the scaled span gets its own layer → no glyph re-raster on each step, no sibling reflow.
- Matches the behavior of the already-smooth opacity/blur/background interpolations on the same headers.

## Out of scope
- No changes to `use-scroll-progress.ts` (200-step quantization stays).
- No changes to the title-char entrance animation, easing, or any other page.
- No new shared component.