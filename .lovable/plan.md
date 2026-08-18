# Dictionary infinite scroll, over-scroll fix, compact Activity strip

## 1. Dictionary loads more by itself

Replace the "Load more" button in `src/pages/Dictionary.tsx` with automatic loading:

- Add a sentinel `<div ref={sentinelRef} />` at the end of the list.
- An `IntersectionObserver` (rootMargin `400px`) bumps `visibleCount` by 10 as soon as the sentinel approaches the viewport, so the next batch is ready before the user reaches the bottom.
- While more items remain, show a small centered spinner chip (same style as the existing "Searching…" chip) instead of a button.
- Reset `visibleCount` to 10 when the query, the mode (Words/Grammar) or the JLPT filter changes, so a new list never starts pre-expanded.

## 2. Over-scroll past the end of the page (native app)

In the packaged app the WebView keeps a rubber-band/extra scroll area below the content. Fixes:

- Add `overscroll-behavior-y: none` on `html, body` in `src/index.css` to kill the bounce/extra drag in the WebView.
- Ensure the page bottom padding uses the safe-area inset once (`padding-bottom: calc(5rem + env(safe-area-inset-bottom))` on scroll containers) instead of a plain `pb-20` stacked on top of other spacers, which is what creates the large empty area under the last card on Dictionary and My Books.
- Remove the extra bottom margin the old "Load more" block added.

## 3. Activity section made much smaller (no grid)

Rework `src/components/my-books/ContributionGraph.tsx` into a single thin horizontal strip:

- One row of 30 small squares (~7px, `rounded-[2px]`, `gap-[3px]`) that flexes to the container width, no grid, no tooltips.
- Compact card: `rounded-xl`, `p-3`, one line header on the left ("Activity", small uppercase tracked muted label) and "Last 30 days" on the right, strip underneath.
- Drop the Less/More legend and the per-square entrance animation (single fade-in on the strip).
- In `src/pages/MyBooks.tsx`, reduce the wrapper spacing (`mt-4` instead of the current `mt-6` + inner `mt-8`).

## Technical notes

- Files touched: `src/pages/Dictionary.tsx`, `src/components/my-books/ContributionGraph.tsx`, `src/pages/MyBooks.tsx`, `src/index.css`.
- No data, store or backend change; presentation only.
- Colors stay on design tokens (`bg-primary` for read days, `bg-muted/40` otherwise).
