## Changes to `src/pages/WordDetail.tsx`

**1. Remove empty top bar gap**
Currently a separate `<header>` with only the back button sits above the header card, leaving the awkward empty space visible in the screenshot. Move the back button inside the header card (top-left, floating above the word) OR collapse the spacing so the back button sits inline. Approach: place a compact back button as a small icon at the top of the page (px-4 pt-4 pb-0), then the header card starts immediately after (mt-3 instead of pt-10 + mt-2).

**2. Unify add-to-flashcards icon to Star**
- Replace `Plus` + `Check` in the CTA button with `Star` (filled when saved, outlined when not).
- Label stays: "Add to flashcards" / "Saved to flashcards".
- Remove `Plus`, `Check` imports; keep `Star`.
- This matches `Dictionary.tsx`, `WordMiniPopup.tsx`, `WordPopup.tsx` which already use Star.

**3. Reorder sections: Kanji before Meanings**
Move the Kanji breakdown `<section>` above the Meanings `<section>`.

**4. Wrap ConjugationTable in a card**
The table currently renders bare (just a label + bordered rows), inconsistent with other sections that use `rounded-2xl bg-card p-5 ring-1 ring-border/40`. Wrap the `<ConjugationTable alwaysOpen />` inside a section card with the same styling, and give it a "Conjugation" heading using the same `font-serif text-lg font-bold mb-3` as other section headings.

To avoid double-labeling (the table already prints "Conjugation table" when `alwaysOpen`), add a new prop `hideLabel?: boolean` to `ConjugationTable` so the wrapper section provides the heading instead.

## Changes to `src/components/ConjugationTable.tsx`

Add `hideLabel?: boolean` prop. When `alwaysOpen && hideLabel`, render only `tableBody` without the inner label div.

## Out of scope
No changes to Dictionary star behavior, no changes to popups (already use Star), no backend changes.
