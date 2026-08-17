# Grammar index in the Dictionary

Add a browsable, searchable list of every grammar point in the app, as a second tab on the Dictionary page.

## What the user gets

- Dictionary page gains a segmented switch at the top: **Words** / **Grammar** (the same sliding-pill control used on the Cards page).
- **Words** keeps the current behaviour exactly as it is today.
- **Grammar** shows every unique grammar pattern found across all books, sorted A-Z by pattern.
- The existing search pill stays in place and filters the active tab (placeholder becomes "Search grammar..." on the Grammar tab). It matches the pattern text, the Japanese, and the English meaning.
- A JLPT chip row (All, N5, N4, N3, N2, N1) filters the list, using the existing per-level colour tokens.
- Each row is a compact card: pattern (Japanese sans), JLPT badge, meaning on one line, chevron. Tapping it opens the existing `/grammar/:id` detail page with the note passed through router state, so the detail page renders instantly from cache with no extra request.
- A small count line ("N grammar points") and an empty state consistent with the Words tab.

## Cost and performance

- The list is built entirely from `src/data/book-grammar.ts`, already bundled in the app. No network call, no AI, no database read to display or search the list.
- Deduplication by the existing pattern slug, so the same pattern appearing in several books/difficulties shows once. The first occurrence supplies the meaning, example and tip.
- The deduped array is computed once (module-level memo) and reused; filtering is plain in-memory string matching.

## Technical notes

- New `src/lib/grammar-index.ts`: `getAllGrammarPoints()` iterating `bookGrammar` across books and difficulties, deduping with `slugifyPattern` from `src/lib/grammar.ts`, returning `{ id, ...GrammarNote }[]` sorted by pattern. Memoized in a module-scope variable.
- `src/pages/Dictionary.tsx`: add a `mode` state (`'words' | 'grammar'`), the Framer Motion `layoutId` sliding-pill switch, the JLPT chip row (grammar mode only), and the grammar result list. The Jisho search effect stays gated to `mode === 'words'` so switching tabs never fires a lookup.
- Rows navigate via `useDelayedNav` to `/grammar/${id}` with `state: { note }`, matching how `GrammarDetail` already reads `location.state.note`.
- Saved state is not shown in the list (saving stays on the detail page), keeping the row light.
- No changes to grammar generation, caching, or the `grammar_examples` table.
