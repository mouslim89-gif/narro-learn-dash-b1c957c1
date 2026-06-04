## Remove header subtitles + align Grammar Notes panel style

### 1. Remove subtitle `<p>` under page titles

Remove the small `inline-block h-px w-6 …` decorative line + text under the title in each top-level page header:

- **`src/pages/Library.tsx`** — remove `Learn Japanese through reading`
- **`src/pages/MyBooks.tsx`** — remove `Continue where you left off`
- **`src/pages/Settings.tsx`** — remove `Make it yours`
- **`src/pages/Flashcards.tsx`** — remove `{n} saved words`

Only the `<p>` is removed. Titles, icons, header buttons, layout untouched. `Auth.tsx` / `ResetPassword.tsx` are auth screens with their own subtitle layout — left alone.

### 2. Restyle Grammar Notes panel to match Chapters/Reader Settings

The Reader's `Chapters` and `Reader Settings` panels both use the shadcn `Sheet` opened from the bottom (`side="bottom"`, `rounded-t-3xl max-h-[80vh]`) with a sticky header containing a `wordmark font-serif text-[22px]` title and a `border-b border-border/40`.

**`src/components/GrammarPanel.tsx`** — replace the current custom fixed overlay (`fixed inset-0 z-40 …` + `bg-black/40` backdrop + `relative z-50 …` card + drag handle + small title row) with a `Sheet` matching the Chapters panel:

- Use `<Sheet open={open} onOpenChange={(o) => !o && onClose()}>`
- `<SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto bg-background p-0">`
- Sticky header: `sticky top-0 z-10 bg-background px-5 pt-6 pb-3 border-b border-border/40` with `<h2 className="wordmark font-serif text-[22px] leading-none">Grammar Notes</h2>` (drop the decorative 文 character and the round X button — Sheet provides its own close)
- Body (notes list, loading / error / empty states) kept as-is, wrapped in `px-4 py-4` to mirror Chapters spacing
- Remove the manual `useBodyScrollLock` (Sheet handles it) and the manual backdrop

No changes to data fetching, props, or behavior. The `partIdx`/`bookId`/`difficulty` reset effect stays intact.

### Out of scope

No other components, no token changes, no behavior changes.