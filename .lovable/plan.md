## Editorial polish — GrammarPanel & WordPopup

Both components work but feel less "editorial" than the rest of the app. Goal: align them with the same paper/card/ring/serif language used on Library, Reader, Settings, Auth — without changing behavior.

### 1. `src/components/WordPopup.tsx`

Already serif/editorial in the body. Small tightening only:

- Wrap the whole sheet in the same surface treatment as `WordMiniPopup` / `SentenceTranslationPopup`: solid `bg-card`, full opacity, `ring-1 ring-border/40`, `shadow-lg`, no gradient strip at the top.
- Replace the bold action buttons (`Add to Flashcards` / `Dictionary`) with calmer editorial pills: `rounded-full`, `ring-1 ring-border/40`, `bg-card` / `bg-muted/40`, `tap-scale-sm`, gold `text-accent` for the primary save state instead of saturated `bg-accent`.
- Section labels (`Meanings`, `Examples`, `Conjugations`) → reuse the small uppercase-tracked `SectionLabel` style used in Settings (`text-[10px] uppercase tracking-[0.2em] text-muted-foreground`) with the short gold underline.
- `Common` chip → `bg-accent/10 text-accent ring-accent/20` to match gold accent system.
- Conjugation card → `rounded-2xl bg-muted/40 ring-1 ring-border/30` (currently already close; just unify radius/ring tokens).

### 2. `src/components/GrammarPanel.tsx`

Currently very flat (border + shadow-xl, primary purple sparkle, raw `bg-muted/50` blocks). Bring it in line:

- Sheet container: `rounded-t-3xl sm:rounded-3xl bg-card ring-1 ring-border/40 shadow-lg`, remove the heavy `border` + `shadow-xl`.
- Header: lose the sticky bar styling, use a thin editorial header — small drag handle on mobile (`h-1.5 w-10 rounded-full bg-border/60 mx-auto mt-2`), title in `wordmark font-serif text-base`, replace `Sparkles` icon with a kanji glyph `文` in `text-accent/70 font-serif`. Close button → `rounded-full bg-muted/50 hover:bg-muted ring-1 ring-border/30`.
- Each grammar note card: `rounded-2xl bg-card ring-1 ring-border/30 shadow-sm` instead of `rounded-lg border bg-background`. Replace bright JLPT pill background with a soft chip `bg-accent/10 text-accent ring-1 ring-accent/20` (keeping JLPT-aware color as a tiny dot on the left rather than full-bleed) — or keep the colored pill but reduce it to `rounded-full px-2 py-0.5 text-[10px]` with the JLPT color at 90% opacity for consistency.
- "Example from text" block → `rounded-xl bg-muted/40 ring-1 ring-border/30`, label in the same small uppercase-tracked style with gold underline.
- "Tip" block → `rounded-xl bg-accent/5 ring-1 ring-accent/20`, label `text-accent`, drop the emoji or keep as `・` separator.
- Loading skeletons → `rounded-2xl` to match.
- Error state → same `rounded-2xl bg-card ring-1 ring-destructive/30` treatment.

### Scope

- CSS/className changes only. No prop changes, no logic changes, no shared UI component edits, no new dependencies.
- Files touched: `src/components/WordPopup.tsx`, `src/components/GrammarPanel.tsx`.

Want me to also propose 2–3 visual variants per component (e.g. one more minimal, one more decorative with a kanji watermark inside the sheet) before implementing, or proceed straight with the unified plan above?
