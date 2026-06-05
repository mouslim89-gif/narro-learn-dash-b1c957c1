## Goal
Two small visual polish tweaks: remove the click/active background on bottom nav buttons, and add a soft inset shadow on the Reader's white text area to match the search-bar feel from Library/Dictionary/Flashcards.

## 1. Bottom nav — no click color

File: `src/components/BottomNav.tsx`

- Remove the `motion.span` active pill (the `bg-foreground/10` background that appears under the selected tab). Active state is conveyed by `text-primary` on the icon/label only — no background.
- Replace `tap-scale-sm` (which adds an `active:bg-foreground/8` flash) with `tap-scale` on the tab links so the only feedback on tap is the subtle scale, not a color flash.

Net result: tapping or selecting a tab no longer paints any background — just color + scale.

## 2. Reader — soft inset shadow on text area

File: `src/pages/Reader.tsx` (line 1265, the `<article>` wrapper around the reading content)

Current: `mx-3 my-5 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30 …`

Change to add `shadow-inner-sm` so the top edge of the white area gets the same soft 1px inset highlight used by the search inputs in Library, Dictionary, Flashcards. Keeps the existing outer `shadow-sm` + `ring-1 ring-border/30` so the card still sits softly on the background.

New className: `… rounded-2xl bg-card shadow-sm shadow-inner-sm ring-1 ring-border/30 …`

(No CSS additions — `shadow-inner-sm` already exists in `src/index.css`.)

## Out of scope
No changes to other interactive surfaces, no token/color edits, no logic changes.