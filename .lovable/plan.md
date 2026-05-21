# Bottom nav: editorial floating pill

Style-only refresh of `src/components/BottomNav.tsx` to match the editorial language used on Library, My Books, Book Detail, and Flashcards (rounded-full pills, `ring-1 ring-border/40`, warm shadows, serif accents). No data, routing, store, or sync logic changes.

## Scope

- **Modify**: `src/components/BottomNav.tsx` only.
- **Verify**: `rg -n 'pb-(8|12|16)\b' src/pages` and bump only the offending pages to `pb-24`. Skip pages already at `pb-20`/`pb-24`+.
- **Untouched**: tabs array, `useFlashcardStore`, `useSyncStatus`, routing, every other component.

## Changes

### 1. Floating pill container
Replace the full-bleed `border-t bg-card/95` strip with a centered floating pill:
- `fixed left-1/2 -translate-x-1/2 z-50`, anchored via `bottom: max(0.75rem, env(safe-area-inset-bottom))`.
- `max-w-md`, `rounded-full bg-background/85 backdrop-blur-xl`, `ring-1 ring-border/40`.
- Soft adaptive shadow: `0 10px 30px -10px hsl(var(--foreground) / 0.25)`.

### 2. Active tab pill (replaces dot indicator)
- Drop the 1×1 dot + its `layoutId="bottom-nav-indicator"` span.
- Wrap the active tab's icon+label with a `motion.span` using the same `layoutId`, rendered as a tinted `bg-primary/10` rounded-full backdrop sliding between tabs.
- Inactive tabs: icon only (stroke 1.8, muted). Active tab: icon (stroke 2.2, primary) + inline serif label (`font-serif text-[12px]`).
- Remove the icon `scale: 1.08` framer animation — the pill backdrop is now the affordance.
- Tab container becomes horizontal `flex items-center gap-1.5` instead of `flex-col`.
- Keep `tap-scale-sm`, `smooth-colors`, `cn` from `@/lib/utils` (add import).

### 3. Cards badge — warm, not red
Switch the `dueCount` badge from `bg-destructive` to the warm flame orange (`hsl(36 80% 55%)`) used by the Flashcards "Due today" hero. Inline style is fine for this single use.

### 4. Sync indicator — pill above the bar
Move the absolute corner dot to a centered text+dot pill sitting just above the nav:
- `absolute -top-7 left-1/2 -translate-x-1/2`, `rounded-full bg-background/90 ring-1 ring-border/40`, `text-[10px]`, with a 1.5×1.5 colored dot.
- Renders only when `status !== 'idle'`. "Syncing" uses `bg-primary animate-soft-pulse`; error uses `bg-destructive`.

### 5. Theming + a11y
- All colors via semantic tokens (`background`, `foreground`, `primary`, `border`, `muted-foreground`).
- Shadow keyed off `--foreground` adapts to light/dark.
- `z-50` preserved (study modal at `z-[60]` still covers it).
- `prefers-reduced-motion` handled natively by Framer Motion's `layoutId` cross-fade fallback.

## Technical notes

- Single import addition: `cn` from `@/lib/utils`.
- No new tokens added to `index.css` (flame color inlined).
- `getDueCount` and `useSyncStatus` selectors used verbatim.
- The floating pill footprint (~56px + 12px gap) is within current `pb-20`/`pb-24` page paddings; only pages found with `pb-8`/`pb-12`/`pb-16` get bumped.
