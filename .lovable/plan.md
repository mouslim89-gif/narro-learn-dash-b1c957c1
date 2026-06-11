## Goal

Free up space in the Reader header so the book title is fully visible and doesn't overlap with the action buttons.

## Change

In `src/pages/Reader.tsx`, remove the chapter-list `HeaderChip` (the `List` icon button, ~lines 971-974) that opens the chapters sheet.

The Sheet itself (`showChapters`) and the navigation between parts/chapters remain available through the existing Prev/Next chapter pills at the bottom of the Reader and via the BookDetail page.

## Notes

- Also remove the now-unused `List` icon import and the `showChapters` state + `<Sheet>` block if no other trigger remains — keeps the file clean.
- Optional: I can also slightly widen the title's max-width since one button slot is freed. Tell me if you want that, otherwise I leave the rest of the header layout untouched.

## Question

Do you want me to fully remove the chapters Sheet (no way to jump to an arbitrary part from inside the Reader anymore — only Prev/Next at the bottom), or keep the Sheet code and just hide the header button (so we can re-add a trigger later)? 

&nbsp;

U can remove it