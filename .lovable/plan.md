# My Books redesign: bookshelf first

The page becomes a real bookshelf. Books lead, numbers support. Same warm paper look, Merriweather headings, amber accents, no hover states.

## New structure

```text
  My Books                              [ gear ]
  ------------------------------------------------
  compact stats strip  (streak · words · saved · done)
  ------------------------------------------------
  CURRENTLY READING          3
   [ cover ] title / author / level / bar / 62%
   [ cover ] ...
  ------------------------------------------------
  FINISHED                   2
   [ cover ] ... Done
  ------------------------------------------------
  NOT STARTED                5
   [ cover ] ...
  ------------------------------------------------
  Reading activity  (contribution graph)
  ------------------------------------------------
  Milestones  (badge row)
```

### 1. Header
Unchanged behaviour (scroll-driven `--p`, hairline invisible at top, settings chip).

### 2. Stats strip (replaces the 4 big tiles)
The four 3xl tiles eat the whole first screen before a single book is visible. They become one horizontal card, four segments divided by hairlines: streak, words read, words saved, books done. Small icon, value in tabular numbers, tiny uppercase label. Roughly one third of the current height.

### 3. Grouped shelf (the core)
Three sections, each with a small uppercase tracked label and a count:
- **Currently reading** — progress between 1 and 99 percent, sorted by last read.
- **Finished** — 100 percent, sorted by last read.
- **Not started** — every remaining book in the catalogue, so the shelf feels complete and gives a way back into the library.

Rows keep the current horizontal layout (cover left, title, author, level, progress bar, relative date) with tightened spacing and typography, plus a small chapter line for multi chapter books ("Chapter 2 of 5"). Finished rows keep the Done pill; not started rows show reading time and JLPT level instead of a progress bar. Sections with no books are simply not rendered.

### 4. Reading activity
The existing contribution graph moves below the shelf, inside a titled card so it reads as a section rather than a floating grid.

### 5. Milestones
A horizontal row of small badge chips computed locally from data already in the stores: first story finished, 7 day streak, 30 day streak, 1000 words read, 100 words saved, first N3 book. Unlocked ones are amber tinted, locked ones muted with the target shown. No backend, no requests.

### 6. Empty state
When nothing has been opened yet, keep the current centered empty state but show the Not started shelf under it so the page is never blank.

## Technical details

- `src/pages/MyBooks.tsx` rewritten: the existing `stats` computation is kept as is, plus a grouping pass over `books` into reading / finished / notStarted.
- `src/components/my-books/StatsStrip.tsx` (new) — the four segment card.
- `src/components/my-books/ShelfSection.tsx` (new) — label, count and list wrapper, used three times.
- `src/components/my-books/BookShelfRow.tsx` — extended with a `variant` prop (`reading` | `finished` | `unread`) for the unread state; layout otherwise untouched.
- `src/components/my-books/MilestonesRow.tsx` (new) — pure local computation from `progress` and `savedWords`.
- `ContributionGraph` wrapped in a section card, component itself unchanged.
- Tokens only, `tap-scale` / `card-lift` on interactive rows, `stagger-children` on each section. No new dependencies, no network calls, no schema changes.

## Not included
Detailed reading statistics (kanji seen, JLPT coverage, minutes per day) and the vocabulary snapshot card were offered and left out. Say the word and either can be added.
