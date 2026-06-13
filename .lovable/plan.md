## Goal

Make the soft, slightly-diffuse relief currently used on the active bottom-nav pill the **standard relief language** of the app. Expose it as a single reusable utility class so any future raised element can opt in with one class.

## Changes (only `src/index.css`)

### 1. New utility `.relief-raised`

Holds the box-shadow recipe that's currently in `.nav-pill-active`, with light + dark mode variants. No background-color — callers keep their own `bg-*` (e.g. header chips stay on `bg-card`).

Light mode:
```
box-shadow:
  0 1px 0 hsl(210 22% 15% / 0.15),
  0 2px 4px -1px hsl(210 22% 15% / 0.18),
  inset 0 1px 0 hsl(0 0% 100% / 0.75),
  inset 0 -1px 0 hsl(210 22% 15% / 0.10);
```

Dark mode (`.dark .relief-raised`):
```
box-shadow:
  0 1px 2px hsl(0 0% 0% / 0.35),
  0 2px 6px -1px hsl(0 0% 0% / 0.40),
  inset 0 1px 0 hsl(0 0% 100% / 0.08),
  inset 0 -1px 0 hsl(0 0% 0% / 0.30);
```

Also add a `:active` state that softens the relief slightly (for tappable surfaces like header chips):
```
.relief-raised:active {
  box-shadow:
    0 1px 2px hsl(210 22% 15% / 0.10),
    inset 0 1px 2px hsl(210 22% 15% / 0.10);
}
```

### 2. Refactor `.header-chip`

Replace its current crisp/hard-edged shadows (the ones I just gave it in the previous turn) with the same recipe as `.relief-raised`. Background stays `bg-card` (handled by the consumer, not the class). Drop its custom `:active` block since `.relief-raised:active` covers it.

### 3. Refactor `.nav-pill-active`

Keep only the background-color (`hsl(var(--foreground) / 0.08)` light, `/0.10` dark) — delegate the shadow to `.relief-raised`. In `BottomNav.tsx` this means the active pill `motion.span` gets both classes: `nav-pill-active relief-raised`.

### 4. Keep `.nav-dock` as-is

The dock keeps its crisp layered relief — different role (container, not raised chip). Not in scope per your earlier feedback flow.

## Files touched

- `src/index.css` — add `.relief-raised`, simplify `.header-chip` and `.nav-pill-active`
- `src/components/BottomNav.tsx` — add `relief-raised` to the active pill `motion.span`

## Result

- Single source of truth for "raised element" relief
- Header chips and active nav pill share identical shadows (your standard)
- Future raised surfaces just need `className="... relief-raised"`
- Visually: header chips become softer/more elevated, matching the active tab — exactly the effect you liked
