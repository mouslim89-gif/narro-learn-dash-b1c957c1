# Legal pages: back button must match the app's round header buttons

The back button on `/terms` and `/privacy` is flat. Every other round header back button in the app (Word Detail, Grammar Detail, Book Detail) carries the `header-chip` class, which is what gives them their raised look. The shared legal header is the only one missing it.

## Change

In `src/components/legal/LegalPage.tsx`, align the back button with the canonical pattern used by Word Detail and Grammar Detail:

- Use the shadcn `Button` with `variant="ghost" size="icon"`
- Classes: `h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 shrink-0 header-chip`
- Keep `ArrowLeft` at `h-[18px] w-[18px]`, keep `aria-label="Back"` and the existing back behaviour

Nothing else on the pages changes.

## Documentation

Project docs describe the back button as a plain `rounded-full bg-background/70 ring-1` block and never mention `header-chip`, which is why the legal page came out flat. Update the recurring-patterns snippet in `CLAUDE.md` and the visual-system memory so the canonical round header button includes `header-chip`.
