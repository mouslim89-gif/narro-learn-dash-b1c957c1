# Back face — flip-anywhere + richer typography

Scope strictly limited to the **back face text** shown in the screenshot (word, reading, romaji, POS, meanings, "from your reading"). No content added/removed, no layout sections added, no decorative blobs/watermarks/cards.

## 1. Flip on tap anywhere on the back face

Today, the back body has `data-no-flip` + `stopPropagation`, so taps on the text don't flip back.

- Remove `data-no-flip` and `onClick stopPropagation` from the back body container.
- Keep flip-blocking only on truly interactive controls: `PlayWordButton` wrapper and the "{n} more" button.
- Guard against scroll-vs-tap: on the perspective container, track `pointerdown` X/Y and only call `setFlipped` on `click` if movement ≤ 8px. Preserves vertical scrolling without flipping.

## 2. Make the back text less thin and empty (typography only)

All edits in the back face header + meanings list. No new sections, icons, chips, cards, or watermarks.

Word (`card.word`):
- `34px` → `44px`, `font-semibold` → `font-bold`, tighter `tracking-tight`, `leading-[0.95]`.

Reading (`card.reading`):
- `15px` → `18px`, weight `400` → `500`, color `text-muted-foreground` → `text-foreground/70`.
- Margin top `2` → `2.5`.

Romaji:
- `11px` italic muted → `12px` non-italic, `text-muted-foreground` (drop the `/60`), `tracking-wide` kept.
- Margin top `1` → `1.5`.

POS line:
- `10px` uppercase muted/70 → `11px` uppercase, weight `font-semibold`, color `text-foreground/60`, `tracking-[0.2em]`.
- Margin top `3` → `4`.

Section eyebrows ("Meaning", "From your reading", "Example") — keep as-is in markup, just bump:
- `10px` → `11px`, weight `font-medium` → `font-semibold`, color `text-muted-foreground/70` → `text-foreground/55`.

Meanings list:
- Item text `15px` → `17px`, `leading-snug` → `leading-relaxed`.
- Numbers `font-mono text-xs text-muted-foreground/50` → `font-semibold text-[13px] text-foreground/50`, width `w-3` → `w-4`.
- `space-y-2` → `space-y-2.5`.

"{n} more" button:
- `text-xs` → `text-[13px]`, `font-medium` → `font-semibold`.

Context sentence (the「そうしてその客と…」line):
- `15px` → `17px`, `leading-relaxed` kept.
- Border accent `border-border` → `border-primary/40`, `border-l-2` → `border-l-[3px]`.
- Highlighted word: keep dotted underline, add `text-primary` so it pops vs. surrounding text.

Romaji + reading + POS line stay in their current positions; nothing structural changes.

## Out of scope

- Front face (untouched).
- Header (close/progress/delete) — untouched.
- SRS / Skip buttons — untouched.
- Example sentence component internals — untouched.
- Store, business logic, data — untouched.

## File touched

- `src/components/FlashcardReview.tsx` only.
