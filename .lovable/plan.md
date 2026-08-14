# Make the review scope selector a real segmented switch

The scope pill on the Cards page still uses a static "active = background + shadow" style. The reader's Reading level / Font size switches use a different pattern: a `bg-muted` track with a sliding Framer Motion thumb (`layoutId`, spring transition) and `relief-raised` elevation.

## Change

In `src/pages/Flashcards.tsx`, rebuild the All / Words / Grammar pill to match the reader switches exactly:

- Track: `flex gap-1 rounded-full bg-muted p-1`
- Item: `relative flex-1 h-7 rounded-full text-xs font-semibold smooth-colors flex items-center justify-center`, active text `text-foreground`, inactive `text-muted-foreground`
- Active thumb: `motion.div` with `layoutId="seg-review-scope"`, `absolute inset-0 rounded-full bg-background/90 relief-raised ring-1 ring-border/40`, transition `{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }`
- Label wrapped in `<span className="relative z-10">`

Keeps the same placement inside the review card and the same `mt-4` spacing. No behaviour change.

## Also (same page, for consistency)

The Words / Grammar list switch lower on the page uses the old style too. Apply the identical treatment with `layoutId="seg-cards-list"` so both switches on the page look and animate the same.

## Technical notes

- Single file: `src/pages/Flashcards.tsx`; add `motion` import from `framer-motion`.
- No hover states (mobile app). Motion respects the global "Disable animations" kill-switch already in place.
