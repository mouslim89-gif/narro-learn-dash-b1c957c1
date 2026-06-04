## Reader header — single-popup rule, clickable title affordance, full title

All changes in `src/pages/Reader.tsx` header block.

### 1. One bubble at a time
Make the reading-level Popover controlled with a `levelOpen` state.
- Opening it → `setMiniPopup(null)` + `setSentenceTranslation(null)`.
- Opening a word mini popup (token click ~line 1317) or sentence translation → `setLevelOpen(false)`.

### 2. Visible "open" state on the title
While `levelOpen` is true the title button gets `bg-foreground/10 ring-1 ring-border/50` and the chevron rotates 180°.

### 3. Clickable affordance next to the title
Inline `ChevronDown` (lucide, `h-3 w-3 text-muted-foreground`) next to the difficulty label, rotating on open:

```
浦島太郎
Intermediate ▾
```

### 4. Show the full Japanese title
Remove `truncate` from the title `<p>` and drop `min-w-0` constraints so the full `book.titleJp` wraps if needed. Title becomes `text-sm font-bold leading-tight` with `whitespace-normal break-words`. The header row stays `flex items-center` so wrapping the title doesn't push the side chips out — the title column grows vertically only.

### Technical notes
- `<Popover open={levelOpen} onOpenChange={(o) => { setLevelOpen(o); if (o) { setMiniPopup(null); setSentenceTranslation(null); } }}>`
- Add `ChevronDown` to the existing `lucide-react` import.
- No changes outside the header and the two popup-opening sites.
