# Cards badge cleanup (bottom nav)

Three small fixes to the badge on the Cards tab in the bottom navigation.

## Changes

1. Remove the glow: drop the `shadow-[0_0_8px_hsl(var(--destructive)/0.4)]` ring around the badge, keeping the flat destructive pill.
2. Cap at 99 instead of 9: show the exact count up to 99, then `99+`. Widen the pill slightly so three characters fit without clipping (min width grows, horizontal padding stays tight, `tabular-nums`).
3. Correct the meaning: the badge counts reviews due, not new cards. The value already comes from `getDueCount()`, so this is a labelling fix. Add an accessible label such as "N reviews due" so screen readers state what the number is.

## Technical

Single file: `src/components/BottomNav.tsx`, badge span inside the Cards tab.
No store or business-logic change; `dueCount` stays the source.
