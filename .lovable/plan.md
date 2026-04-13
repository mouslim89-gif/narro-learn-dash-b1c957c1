

## Improve Reader text presentation for mobile

### Current issues
1. **Underline on every clickable word** — `underline decoration-accent/30 decoration-1 underline-offset-4` on both `FuriganaWord` and inline spans creates visual noise. Every single word is underlined, making it feel like a hyperlink farm instead of a reading experience.
2. **No visual distinction between tapped and untapped** — the underline is always present regardless of interaction.
3. **Padding/spacing too tight for mobile** — `px-6` on a 360px screen leaves little breathing room, and the warm background doesn't contrast enough with the card.
4. **Active/hover states designed for desktop** — `hover:bg-accent/15` and `active:scale-95` feel off on mobile touch.
5. **Article background blends with page** — no card-like container to frame the reading area on mobile.

### Plan

**1. `src/components/FuriganaWord.tsx`** — Remove persistent underline
- Replace `underline decoration-accent/30 decoration-1 underline-offset-4` with a subtle bottom border only on active tap: `border-b border-transparent active:border-accent/40`
- Add a gentle `active:bg-accent/8` highlight instead of hover styles
- Remove `hover:bg-accent/15 hover:text-accent` (not useful on mobile)

**2. `src/pages/Reader.tsx`** — Improve the non-furigana word spans
- Same treatment: remove persistent underline, use `active:bg-accent/10 rounded-sm` for tap feedback
- Reduce article padding on mobile: `px-5 sm:px-6`
- Add a soft card wrapper around the article on mobile with slightly different background (`bg-white dark:bg-card rounded-2xl shadow-sm mx-3 my-4`)
- Improve line height for non-furigana mode: add `leading-relaxed` (currently no leading class when furigana is off)
- Remove `text-justify` — it creates uneven spacing with Japanese characters on narrow screens; use default alignment

**3. `src/index.css`** — Add a subtle word-tap animation
- Add a quick `@keyframes word-tap` pulse for tactile feedback on mobile

### Result
- Clean, book-like reading surface without visual clutter
- Words are still tappable but don't scream "clickable" — tap feedback only appears on touch
- Better mobile spacing and card framing
- More readable line height in both furigana and non-furigana modes

### Files to modify
1. `src/components/FuriganaWord.tsx` — Remove underline, add tap-only feedback
2. `src/pages/Reader.tsx` — Card wrapper, spacing, remove underline from inline spans
3. `src/index.css` — Optional tap animation keyframe

