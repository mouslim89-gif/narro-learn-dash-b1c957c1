# Serif reader font + Highlights toggle behaviour

## 1. Serif font looks identical to sans

What the code says today:
- `font-jp-serif` is declared as `font-family: 'Noto Serif JP', 'Noto Sans JP', serif`.
- All five families (including Noto Serif JP) are loaded through a single `@import url(fonts.googleapis.com...)` at the top of `src/index.css`, with no `preconnect` to `fonts.gstatic.com`.

In a desktop headless browser the serif class does render differently, so the class chain itself is fine. The most likely cause on mobile: Noto Serif JP (a very large multi-subset Japanese webfont, loaded late because `@import` serialises the request) is not available when the reader paints, and the declared fallback is `Noto Sans JP`. Result: serif silently renders as the sans font, exactly as reported.

Fix:
1. Verify first: check the computed font family and `document.fonts.check('16px "Noto Serif JP"')` in the reader with Serif selected, to confirm the webfont is the missing piece.
2. Change the serif fallback so it can never fall back to the sans face: `'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif`. Same treatment for the handwriting class (fallback to a serif/system face instead of Noto Sans JP).
3. Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` plus the stylesheet `<link>` in `index.html`, and drop the `@import` from `index.css` so fonts start downloading immediately instead of after the CSS parse.
4. Move the `.font-jp-sans` / `.font-jp-serif` / `.font-jp-hand` rules out of `@layer base` into plain CSS so no Tailwind utility can outrank them.
5. When the reader font preference is `serif` or `handwriting`, warm it with `document.fonts.load()` on mount so the switch takes effect immediately rather than on the next repaint.

Optional variation, if the webfont still stalls on mobile: self-host a subset of Noto Serif JP (only the glyph ranges used by the books) in `public/fonts/` and declare a local `@font-face`. Much faster and no third-party dependency, but adds a build step. I would only do this if step 2-5 is not enough.

## 2. "Highlight saved words" off should not hide the sub-toggles

Currently the three colour rows (New / Learning / Known) are rendered only when `showKnownHighlights` is true, so they disappear.

Change in the reader settings panel: always render the three rows; when the master switch is off, keep them visible but inert (switches `disabled`, row content at reduced opacity). The stored per-level values are untouched, so turning the master switch back on restores the previous selection.

## Technical notes

- `src/index.css` — font-family declarations, layer placement, `@import` removal.
- `index.html` — preconnect + stylesheet link.
- `src/pages/Reader.tsx` — Highlights section rendering; optional `document.fonts.load` warm-up.
- No store, backend, or data changes. `showKnownHighlights` keeps driving the actual highlighting in the reader text.
