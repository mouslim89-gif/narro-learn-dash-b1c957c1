## Goal

Restyle `src/components/FlashcardReview.tsx` so the modal matches the editorial theme already used on Flashcards / My Books / Book Detail (serif headings, pill buttons, tinted gradients, kanji watermark, removed JLPT badges, premium typography). No behavior changes — same flip, same SRS buttons, same delete dialog, same advance logic.

## Changes (presentation only)

### Container & header
- Keep `fixed inset-0` shell, but tint the background with a subtle gradient (`linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 60%)`) and add a faint serif `札` (or `読`) watermark behind the card area, matching `library-kanji-watermark` treatment.
- Replace plain ghost icon buttons in the top bar with floating round chips (`h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40`) like Flashcards/MyBooks headers. Left = back arrow, right = trash chip with destructive tint.
- Add a tiny serif label `Review` + dot separator above the progress, e.g. `Review · {currentIdx+1} / {deck.length}`, with `text-[10px] uppercase tracking-[0.18em] text-muted-foreground` for the kicker and serif for the count.
- Progress bar: keep `h-1`, but switch to a softer track (`bg-muted/60`) and use the warm amber tint already used in the "Due today" hero so it ties back to the page.

### Front face
- Replace the flat `rounded-2xl border bg-card shadow-lg` with the `book-paper`-style card: `rounded-3xl`, `ring-1 ring-border/40`, layered shadow, and a soft gradient backdrop `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(36 80% 60% / 0.06) 100%)` (very subtle, not loud).
- Word: keep `font-japanese text-6xl font-bold` but tighten with `tracking-[-0.02em]`. Add a small serif kicker above it: `Word`.
- Reading row stays, but the eye toggle and play button become pill chips (`rounded-full px-3 h-9 bg-muted/60`) instead of bare ghost icons, matching the editorial control style.
- Replace the "Tap to flip" caption with the section-bullet treatment (`<span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" /> Tap to flip`), uppercase tracking like the masthead subtitles.

### Back face
- Same card surface (rounded-3xl, ring, gentle gradient).
- Header: word in `font-japanese text-3xl font-bold`, reading muted, romaji in italic small. **Remove the JLPT pill** entirely (data not displayed elsewhere now). Keep only the parts-of-speech chips and restyle them as `rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em]` to match Library/MyBooks chip styling.
- Body sections get the editorial kicker pattern used on Book Detail: `<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Meanings</p>` with the bullet dash before it (`section-bullet` if present, otherwise the inline `h-px w-6` mark).
- "From your reading" callout: switch from primary tint to the warm amber tint used on the hero CTA so it reads as a page-cohesive accent (`linear-gradient(135deg, hsl(36 80% 60% / 0.14) 0%, hsl(var(--card)) 100%)`, ring `border-amber-500/15`), with `BookOpen` icon and serif label.
- "Show N more" becomes a small pill button (`rounded-full px-3 h-7 bg-muted/60 text-[11px]`), not a text link.

### Bottom action bar
- Wrap the SRS / Skip row in a soft floating bar: `rounded-full bg-card/80 backdrop-blur ring-1 ring-border/40 shadow-sm` with internal padding, mirroring the rounded pill aesthetic of the page CTAs. Skip becomes `variant="ghost" rounded-full`.

### Completion screen
- Translate the remaining French strings (`Session terminée !`, `cartes révisées`, `Retour`) to English to match the rest of the app: `Session complete`, `{n} cards reviewed`, `Back`.
- Use the same masthead treatment: serif `Session complete`, bullet kicker, and a rounded-full primary `Back` button.

## Out of scope

- No edits to `Flashcards.tsx`, `SrsButtons.tsx`, store, or SRS logic.
- No new tokens in `index.css` — reuse `book-paper`, `card-lift`, `tap-scale`, `library-kanji-watermark`, `section-bullet` if present (otherwise inline the same markup already used on the pages).
- No layout/scroll changes beyond what already shipped (back face stays fully scrollable).

## Files touched

- `src/components/FlashcardReview.tsx` (only)
