## Hero card — more color, cleaner header

Single file: `src/components/library/ContinueHero.tsx`.

### 1. Remove the label
Delete the small uppercase "Continue Reading" line above the title, so the Japanese title becomes the first element of the info block.

### 2. Subtle tint boost (color from `book.coverColor`)
- Background gradient goes from `${coverColor}18 → card` to a richer two-stop wash: `${coverColor}3D 0%, ${coverColor}14 45%, hsl(var(--card)) 100%` (135°), still readable in light and dark mode.
- Add a soft colored halo behind the cover: an absolutely positioned blurred radial blob using the cover color at low opacity, `pointer-events-none`, clipped by the card's `overflow-hidden`.
- Border/ring picks up the color: `border-border/30` → colored ring via inline `boxShadow: 0 0 0 1px ${coverColor}33` plus the existing soft shadow.
- Progress bar fill tinted with the cover color (inline style on the indicator wrapper) instead of plain primary.

### 3. Untouched
Layout, cover size, CTA (`btn-tsundoku-premium`), navigation behaviour, and typography stay exactly as they are.
