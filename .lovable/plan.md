## Goal

Transform the Reader's sticky header into a **floating glass slab** (v3 prototype): a rounded rectangle that hovers inside its own padding above the text, with crisp specular edges, inset top highlight, drop shadow, and individual glass chip buttons.

## Scope

ONLY the Reader header (`<header>` in `src/pages/Reader.tsx`) and the chip styling. No icon, layout, or behavior changes. Light + dark modes both supported.

## Changes

### 1. `src/index.css` — rewrite `.glass-subtle` + `.glass-chip-subtle`

Replace the current flat-bar treatment with a "slab" treatment:

- `.glass-subtle` becomes a **wrapper helper** (no background itself — just the sticky container with safe-area padding). We add a new inner class `.glass-slab` carrying the actual glass material:
  - `border-radius: 20px`
  - `background: hsl(var(--background) / 0.18)` (very transparent)
  - `backdrop-filter: blur(20px) saturate(180%)`
  - `border: 1px solid hsl(var(--foreground) / 0.10)`
  - `box-shadow:` inset 0 1px 0 hsl(255 255 255 / 0.18) (top specular), inset 0 -1px 0 hsl(0 0 0 / 0.08), 0 10px 30px -8px hsl(0 0 0 / 0.35) (lift)
  - bottom hairline gradient pseudo-element for the refraction edge
- `.glass-chip-subtle` gets a glossier finish:
  - `background: hsl(var(--background) / 0.14)`
  - `backdrop-filter: blur(16px) saturate(180%)`
  - `border: 1px solid hsl(var(--foreground) / 0.12)`
  - `box-shadow: inset 0 1px 1px hsl(255 255 255 / 0.22), 0 2px 8px hsl(0 0 0 / 0.18)`

Keep `transform: translateZ(0)`, `will-change`, `isolation: isolate` to keep the no-shimmer fix.

### 2. `src/pages/Reader.tsx` — wrap header content in a slab

Change:
```tsx
<header className="sticky top-0 z-30 glass-subtle">
  <div className="..."> {/* current row */}
```
to:
```tsx
<header className="sticky top-0 z-30 px-3 pt-3 pb-2">
  <div className="glass-slab flex items-center justify-between gap-2 px-2 h-14 rounded-[20px]">
    {/* current row content */}
```

Adjust inner horizontal padding so the chips don't touch the slab edge. The progress bar (if currently inside header) stays directly under the slab — sits in the header's bottom padding area.

### 3. Progress bar placement

Verify where the slim `.reader-progress-track` lives. If it's a child of `<header>` and currently sits at the bottom edge, move it just below the slab (still inside `<header>`) with a small `mt-2` so the slab floats cleanly. If it's outside the header, leave untouched.

## Visual reference

```
┌─────────────────────────────────────────┐   ← page edge
│  ┌─────────────────────────────────┐   │   ← slab padding (12px)
│  │ ← │  浦島太郎       │ ◎ A ⚙ ⋯ │   │   ← floating glass slab
│  └─────────────────────────────────┘   │
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│   ← progress bar (still sticky)
│                                          │
│   しかし、村は全然違っていました…       │   ← article scrolls behind
```

## Risks / notes

- Backdrop-filter on a rounded rectangle still triggers GPU layer; with the existing scroll-progress quantization (toFixed(2), pixel-snap) shimmer should stay gone.
- The slab needs `overflow: hidden` only if we add a pseudo-element gradient — otherwise leave it off so chip shadows aren't clipped.
- Light mode: top inset highlight uses pure white at low alpha, works on both light and dark backgrounds.

## Validation

Preview at 390px in both light + dark, scroll the article, confirm:
1. Slab visibly floats (text shows through left/right of it on first scroll).
2. Chips read as individual glass pills, not flat icons.
3. No frame-to-frame shimmer during scroll.
