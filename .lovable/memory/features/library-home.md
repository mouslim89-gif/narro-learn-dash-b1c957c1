---
name: Library home
description: Structure of the library/home page — continue hero, curated collections, genre rails
type: feature
---

# Library (home page, route `/`)

## Structure
1. **Header** — wordmark + kanji watermark, scroll-driven hairline via `--p` (invisible at top).
2. **`ContinueHero`** (`src/components/library/ContinueHero.tsx`) — large card for the most recently read book: cover (`rounded-2xl`, `book-paper` texture), progress, and a "Resume Reading" CTA using the shared `.btn-tsundoku-premium` style.
3. **"Also Reading" rail** — other in-progress books.
4. **Curated rails** from `src/data/collections.ts` — `Collection { id, title, subtitle?, match(book) }`. Current: Start Here (N4/N3), Short Reads (≤10 min), Dazai Osamu.
5. **Genre rails** — one per `Genre`: `folk-tales`, `psychological`, `surreal`, `gothic`, `slice-of-life`, `historical`, `sci-fi`.

## Rules
- No `DailyGoalProgress` on the library — daily goals live in My Books (`DailyGoalCard` with two `HalfGauge` arcs: reviews and new cards).
- Covers are `rounded-2xl` everywhere (BookCard, ContinueHero, BookDetail).
- Never add vertical amber accent bars before section labels.
- Rails scroll horizontally with `.no-scrollbar`; cards use `card-lift` + `tap-scale`, no hover styling.
