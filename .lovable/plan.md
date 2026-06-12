## Three fixes on the Reader header

### 1. Remove the tint visible in dark mode

The "teinte" comes from `box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.22)` on `.glass-subtle` — it paints a bright white hairline at the top that, combined with the bg opacity, reads as a colored film over dark mode.

- In `src/index.css`, drop the inset highlights on `.glass-subtle` (or set them to ~`0.06` so they're invisible in dark).
- Keep `background: hsl(var(--background) / 0.38)` neutral (no saturate, already done).

### 2. Chips — back to soft transparent + relief (no liquid glass)

In `src/pages/Reader.tsx`, restyle `HeaderChip`:

- Background: `bg-card/70` + `backdrop-blur-md` (soft frosted, no SVG filter).
- Relief: keep `shadow-sm` + add a subtle inner top highlight via `ring-1 ring-border/40` and an `inset 0 1px 0 hsl(0 0% 100% / 0.08)` shadow (small utility class or inline `style`).
- No `url(#liquid-glass)` reference on chips.

### 3. Distortion + detach header from the edges

**Smoother distortion** — current `feTurbulence baseFrequency="0.006 0.014"` produces visibly anisotropic waves (different X/Y frequency) which reads as "not uniform". In `index.html`:

- Use a single isotropic frequency, e.g. `baseFrequency="0.012"`, `numOctaves="1"`, `seed="3"`.
- Lower `scale` to `18` for a calmer, more even refraction.
- Keep the `feGaussianBlur stdDeviation="2"` to soften noise.

**Floating header (detached like the bottom nav)**:

- Change `<header className="sticky top-0 z-30 glass-subtle">` to a floating bar:
  - `fixed top-3 left-3 right-3 z-30 rounded-2xl glass-subtle` with `border` (not just `border-bottom`).
  - Update `.glass-subtle` so the border applies on all sides when used as a floating element (switch `border-bottom` → full `border` of `1px solid hsl(var(--border)/0.35)`, or add a sibling class `.glass-floating`).
- Add top padding to the page content so it doesn't slide under the floating header (`pt-[4.5rem]` instead of the current header-height offset). Update the scroll-to / sticky offsets that currently assume `top-0` (line 553 comment, the chapter title `sticky top-[3.25rem]` at line 1214 → `top-[4.25rem]`).

### Technical notes

- `.glass-subtle` becomes the floating-pill style: full rounded border, neutral shadow (e.g. `0 6px 20px -8px hsl(220 15% 8% / 0.18)`), backdrop blur + SVG displacement filter for the bar background only.
- Chips no longer use `glass-*` — they're a separate visual element (frosted card pill with relief).
- The SVG filter (`#liquid-glass`) only applies to the header bar; tweaking it to `baseFrequency="0.012"` / `scale="18"` / `numOctaves="1"` gives uniform, gentle refraction.

### Files touched

- `src/index.css` — `.glass-subtle` (remove white inset, full border, floating shadow)
- `src/pages/Reader.tsx` — `HeaderChip` styling; header element classes; sticky offsets
- `index.html` — `feTurbulence` + `feDisplacementMap` params

Want me to proceed, or tweak anything (e.g. corner radius of the floating bar, exact distortion intensity)?
