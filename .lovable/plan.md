# My Books: cleanup and design alignment

Remove the activity graph and restyle the page so it reads like the rest of Tsundoku (Library / Book Detail language): quiet cards, hairline separators, serif section headings, no colored gradient tiles.

## What changes

**1. Remove the activity graph**
- Delete the graph section from the page and delete its component file.
- Drop the now-unused date-set computation from the page's stats.
- Nothing replaces it.

**2. Stats become one compact strip**
- Replace the four tinted gradient tiles with a single rounded card: 4 columns separated by vertical hairlines, muted icon above a tabular number, small uppercase tracked label below.
- Same surface treatment as other cards in the app (`rounded-2xl bg-card ring-1 ring-border/30 shadow-sm`), no colored gradients, no `card-lift` (it is not tappable).
- Numbers use the serif face for weight consistency with other stat displays; labels use the standard section-label style.

**3. Shelf list**
- Stays one flat list sorted by last read.
- Add a standard section heading row above it ("Your shelf" + book count on the right) matching the Library rail heading pattern.
- `BookShelfRow` keeps its structure but is aligned to the shared card recipe: same ring/border/radius as other cards, tighter meta row, progress bar and percentage kept.

**4. Spacing and rhythm**
- Consistent `px-6` gutters, section spacing matched to Library, `pb-20` for the bottom nav.
- Empty state unchanged.

## Technical notes

- `src/pages/MyBooks.tsx`: remove `ContributionGraph` import/usage and `readDateStrings`; replace the `STAT_TILES` grid with the compact strip; add the shelf section heading.
- `src/components/my-books/ContributionGraph.tsx`: deleted.
- `src/components/my-books/BookShelfRow.tsx`: styling only, no behavior change.
- Header, scroll-driven `--p` behavior, streak/stat calculations and stores are untouched.
