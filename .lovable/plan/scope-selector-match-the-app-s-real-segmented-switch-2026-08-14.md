# Scope selector: match the app's real segmented switch

The app's canonical segmented control (Settings → Font size, S / M / L) uses a Framer Motion sliding pill, not a color swap. The scope selector on the Cards page was styled with a static active background instead, so the pill doesn't glide.

## Reference pattern (Settings.tsx, font size)

```text
container: flex gap-1 rounded-full bg-muted p-1
item:      relative rounded-full text-sm font-semibold smooth-colors
           active   -> text-foreground
           inactive -> text-muted-foreground
active pill: motion.div layoutId="seg-<name>"
             absolute inset-0 rounded-full bg-card relief-raised ring-1 ring-border/40
             transition spring stiffness 500, damping 38, mass 0.8
label:      <span className="relative z-10">
```

## Change

In `src/pages/Flashcards.tsx`, rebuild the All / Words / Grammar scope pill with that exact pattern:

- container `flex gap-1 rounded-full bg-muted p-1`
- each item `relative flex-1 rounded-full py-2 text-[13px] font-semibold smooth-colors`, text token swap only
- sliding `motion.div` with `layoutId="seg-review-scope"` behind the active item
- label wrapped in `<span className="relative z-10">`
- import `motion` from `framer-motion`

Apply the same treatment to the Words / Grammar list switch lower on the page (`layoutId="seg-cards-tab"`) so both selectors on the page behave identically.

The global "Disable animations" kill-switch already forces `reducedMotion`, so the pill snaps instead of gliding when that admin toggle is on.

## Documentation fix

The project context lists no convention for segmented controls, which is why the wrong styling was used. Add the sliding-pill pattern above to the "Recurring Tailwind patterns" section of the project memory (`mem://design/visual-system`) so future segmented controls match.

## Technical notes

- Files: `src/pages/Flashcards.tsx`, memory file `mem://design/visual-system`.
- No logic, store or behaviour change; only presentation.
