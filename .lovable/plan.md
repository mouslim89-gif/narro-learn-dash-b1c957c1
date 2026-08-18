# Native polish: infinite scroll, safe area, no bounce/zoom/scrollbar

## 1. Dictionary: auto-load instead of "Load more"

Replace the "Load more" button with an IntersectionObserver sentinel at the end of the list. When the sentinel enters the viewport (with a ~400px root margin), `visibleCount` grows by 10. Same behaviour for both Words and Grammar tabs. A small spinner row shows while more items remain; nothing shows once the list is exhausted. `visibleCount` still resets to 10 on a new query, tab change or JLPT filter change.

## 2. Too much scroll at the bottom (native)

The page wrapper in `App.tsx` uses `min-h-screen` (`100vh`) while pages also add their own bottom padding (`pb-24`), so every page is at least one full viewport tall plus the padding, which creates dead scroll space. On native, `100vh` also ignores the status/navigation bar insets, adding more.

Fix: switch the route wrapper to `min-h-[100dvh]` and let page padding account for the bottom nav plus `env(safe-area-inset-bottom)`, so short pages no longer scroll at all.

## 3. No rubber-band / stretch overscroll

- Add `overscroll-behavior: none` on `html, body` (kills the iOS bounce and the Android stretch/glow inside the WebView).
- Add `overscroll-behavior: contain` on the scrollable horizontal rails so a sideways flick never chains to the page.

## 4. No scrollbar, no zoom (native and mobile web)

- Hide scrollbars globally: `::-webkit-scrollbar { display: none }` on `html, body` plus `scrollbar-width: none`. The existing `.no-scrollbar` utility stays for rails.
- Block pinch/double-tap zoom: add `maximum-scale=1, user-scalable=no` to the viewport meta and `touch-action: pan-x pan-y` on `body`. The reader keeps its own touch handling untouched.

## 5. Top of the app behind the status bar

The sticky page headers use a hard-coded `40px` / `48px` top padding, which sits under the status bar on device. Each of them (Library, Dictionary, Cards, My Books, Settings) gets `env(safe-area-inset-top)` added to the base padding, keeping the existing scroll-collapse maths (`--p`) intact. Book Detail's fixed back button and the Reader chrome already use `max(..., env(safe-area-inset-top))` and stay as is.

Also set the Android status bar to non-overlaying so the WebView starts below it, and keep the theme-colour sync already in `src/lib/native.ts`.

## Technical notes

Files touched: `src/pages/Dictionary.tsx`, `src/App.tsx`, `src/index.css`, `index.html`, `src/lib/native.ts`, and the top-padding line of `Library.tsx`, `Flashcards.tsx`, `MyBooks.tsx`, `Settings.tsx`. No backend or business-logic change.
