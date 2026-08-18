# Standalone Optimization & Performance Plan

Improve app performance and grid layout to better fit the mobile-first "Tsundoku" aesthetic, and optimize dictionary loading for better responsiveness.

## User Changes

### My Books (Profile)
- **Activity Graph**: Change the activity history from ~6 months (24 weeks) to strictly the last 30 days.
- **Grid Layout**: Improve the visual density and spacing of the status tiles and book shelf cards to feel more "premium".

### Dictionary
- **Performance**: Implement windowed/paginated loading for dictionary results (Jisho results and Grammar index) to avoid UI stutters when searching for common terms that return many results.
- **Loading Strategy**: Load items 10 by 10 as requested.

## Technical Details

### `src/components/my-books/ContributionGraph.tsx`
- Change `daysToShow` from `24 * 7` to `30`.
- Adjust grid columns: instead of vertical weeks, show a simpler 6x5 or 10x3 horizontal grid, or just a single row of 30 days if appropriate. *Correction: A 7-day week grid for 30 days looks like 4-5 rows. I will make it a more compact horizontal scrollable container or a fixed grid that fits mobile widths better.*

### `src/pages/MyBooks.tsx`
- Update "Activity" section header label from "Last 6 months" to "Last 30 days".
- Refine `STAT_TILES` grid spacing/padding.

### `src/pages/Dictionary.tsx`
- Introduce a `visibleCount` state variable initialized to 10.
- Use `useIntersectionObserver` or a simple "Load More" button (or scroll-based auto-load) to increment `visibleCount` by 10.
- Slice `jishoResults` and `grammarPoints` using `visibleCount` before mapping.
- Ensure clearing search resets `visibleCount` to 10.

### `src/components/BookShelfRow.tsx` (or similar)
- Refine shadow/border to match the `card-refined` style defined in `index.css`.
