# Review card: remove press feedback, restyle scope selector

## 1. No press feedback on the review card

The "Due today" card carries `card-lift`, whose `:active` rule scales the whole card down. Since the card itself is not tappable (only the Review button and the scope pills are), any press inside it shrinks the card.

Remove `card-lift` from the card container in `src/pages/Flashcards.tsx`. The Review button and the scope buttons keep their own press feedback.

## 2. Scope selector matches the app's other segmented selectors

Align the All / Words / Grammar pill with the Words / Grammar list switch used lower on the same page:

- Same container: `rounded-full bg-muted/60 p-1 shadow-inner-sm`
- Same item sizing and motion: `py-2 text-[13px] font-semibold`, `smooth-colors tap-scale-sm`
- Active state: `bg-background text-foreground shadow-sm ring-1 ring-border/40`

## 3. Drop the "Review scope" label

Remove the small uppercase label above the pill; the pill sits directly under the Review row (keeps its `mt-4` spacing).

## Technical notes

- Single file: `src/pages/Flashcards.tsx` (the `scopePill` block and the due-card container class).
- No store, logic or behaviour changes; scope selection works exactly as today.
