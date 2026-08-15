# Grammar notes: first one free, sorted by text order

## What changes

1. **Grammar notes open for everyone.** The Grammar chip in the reader no longer sends free users straight to the paywall. The panel opens and shows the chapter's grammar points.
2. **Order follows the text.** Notes are listed in the order their example appears in the chapter, instead of the current JLPT-level sort.
3. **First note free.** The first note in that order is fully usable for free users (expand, example, tip, View details).
4. **The rest are teased, not hidden.** Every following card keeps its pattern name and JLPT badge readable, while the meaning line and the whole expanded content are blurred. A small lock sits on the card. Tapping it opens the paywall with the `grammar-notes` context instead of expanding.
5. Premium users see no change at all.

## Technical notes

- `src/pages/Reader.tsx`: the Grammar `HeaderChip` calls `setShowGrammar(true)` directly again (drop the `requirePremium('grammar-notes')` guard there). The reader settings row stays as is.
- `src/components/GrammarPanel.tsx`:
  - Replace the JLPT `sort` with a stable sort on `text.indexOf(note.example)`; notes whose example is not found in the text keep their authored order at the end.
  - Add `usePremium()`. Compute `locked = !isPremium && i > 0` on the sorted list.
  - Locked card: pattern + JLPT badge render normally; the meaning paragraph gets `blur-[3px] select-none opacity-70`, a `Lock` icon (lucide) sits at the chevron position, and the button's onClick calls `requirePremium('grammar-notes')` rather than toggling `expandedIdx`. Locked cards can never expand.
  - Translation preloading only runs for the notes that are actually readable (free note + all notes when premium), so we don't pay for translations behind the lock.
- No backend, entitlement, or paywall-copy changes; `grammar-notes` stays in `PremiumFeature`.

## Premium wording

In premium-facing copy only, "grammar notes" becomes "grammar explanations":
- `src/pages/Premium.tsx`: benefit line "Grammar explanations while you read" and the feature headline "Unlock grammar explanations".
- `src/lib/entitlements.ts`: `FEATURE_LABELS['grammar-notes']` becomes "Grammar explanations".
- `src/components/library/PremiumUpsellCard.tsx`: "Every chapter, review mode, grammar explanations, translations and audio."

The reader panel title stays "Grammar Notes", and the legal/credits pages are untouched.
