# Dictionary infinite scroll, over-scroll fix, compact Activity strip

## 1. Dictionary loads more by itself

Replace the "Load more" button in `src/pages/Dictionary.tsx` with automatic loading:

- Add a sentinel `<div ref={sentinelRef} />` at the end of the list.
- An `IntersectionObserver` (rootMargin `400px`) bumps `visibleCount` by 10 as soon as the sentinel approaches the viewport, so the next batch is ready before the user reaches the bottom.
- While more items remain, show a small centered spinner chip (same style as the existing "Searching…" chip) instead of a button.
- Reset `visibleCount` to 10 when the query, the mode (Words/Grammar) or the JLPT filter changes, so a new list never starts pre-expanded.

## 2. Over-scroll / rubber-band squish in the native app

In the packaged app the WebView adds a bounce and an extra scroll area past the content. Fixes:

- `overscroll-behavior: none` on `html, body` in `src/index.css` (kills the pull-down/pull-up rubber band and any scroll chaining).
- iOS: set `ios.scrollEnabled` bounce off by switching `contentInset` to `never` and disabling WebView bounce in `capacitor.config.ts`; Android: `android.webContentsDebuggingEnabled` untouched, overscroll handled by the CSS rule plus `overscroll-behavior` on the app root.
- Ensure the page bottom padding uses the safe-area inset once (`padding-bottom: calc(5rem + env(safe-area-inset-bottom))` on scroll containers) instead of a plain `pb-20` stacked on other spacers, which creates the large empty area under the last card on Dictionary and My Books.
- Remove the extra bottom margin the old "Load more" block added.

## 2b. App content below the status bar

- Keep the native status bar as a normal (non-overlay) bar: in `src/lib/native.ts` call `StatusBar.setOverlaysWebView({ overlay: false })` and keep the background colour synced with the theme (`#F7F4EF` light / `#111827` dark).
- As a safety net for notched devices, page headers get `padding-top: calc(<current value> + env(safe-area-inset-top))` so the title never sits under the clock/battery. Applies to the sticky headers of Library, My Books, Dictionary, Cards and Settings.


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
