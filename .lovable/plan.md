# Kill overscroll stretch, scrollbars and zoom in the native app

Three fixes, all in web/config layer. No feature or UI changes.

## 1. Overscroll stretch on scrollable pages

Today the page scrolls on `<body>`, and the WebView itself scrolls with it. `overscroll-behavior: none` only suppresses the effect on Android; on iOS WKWebView it is ignored, which is why pages with content still bounce while short pages do not.

Fix: stop the WebView from being the scroller and scroll inside the app instead.

- `capacitor.config.ts`: add `ios.scrollEnabled: false` (keeps `contentInset: 'never'`), and `android.overScrollMode: 'never'` so the Android glow/stretch is gone too.
- App shell: make `html, body, #root` full height, non-scrolling (`overflow: hidden`), and give the app a single scroll container (`overflow-y: auto`, `overscroll-behavior: contain`, `-webkit-overflow-scrolling: touch`) wrapping the routed pages in `App.tsx`.
- Keep the sticky headers working: they are `sticky top-0` inside the page, so the scroll container becomes their scroll parent. `use-scroll-progress` reads window scroll today, so it needs to read the container's `scrollTop` instead (pass the container via a ref/context, fall back to `window` when there is none).
- `ScrollToTop` and any `window.scrollTo` calls get pointed at the same container.

Risk noted: this touches the scroll root, which previously broke headers once. Headers and the reader will be verified after the change (reader UI rules unchanged).

## 2. No visible scrollbar

Global rule in `src/index.css`: hide scrollbars on the scroll container and everywhere (`::-webkit-scrollbar { display: none }`, `scrollbar-width: none`), keeping scrolling functional. The existing `.no-scrollbar` utility stays.

## 3. No zoom

- `index.html` viewport meta: add `maximum-scale=1, minimum-scale=1, user-scalable=no` (keeps `viewport-fit=cover`).
- CSS: `touch-action: manipulation` on `body` to remove double-tap zoom, and `-webkit-text-size-adjust: 100%` so the WebView does not resize text.
- Ruby/furigana and reader font-size settings are unaffected.

## 4. Top safe zone: smaller and applied everywhere

Today each page hardcodes its own top padding (main pages use `calc(env(safe-area-inset-top) + 40px ...)`, detail/legal pages use their own values). Since the status bar no longer overlays the WebView, `env(safe-area-inset-top)` is 0 on native and the extra 40px reads as too much empty space, while secondary pages are inconsistent.

- Add one shared CSS variable in `src/index.css`, e.g. `--header-top: calc(env(safe-area-inset-top) + 20px)` (down from 40px), plus a `.page-top` utility.
- Use it in every page header: Library, My Books, Flashcards, Dictionary, Word Detail, Grammar Detail, Book Detail, Settings, Premium, and the legal pages (Terms, Privacy, Credits, Support, Account Deletion) so the spacing is identical app-wide.
- Scroll-driven headers keep their `--p` collapse maths, just based on the new variable.
- Reader chrome is left untouched (its own UI rules).

## Technical notes

Files touched: `capacitor.config.ts`, `index.html`, `src/index.css`, `src/App.tsx`, `src/hooks/use-scroll-progress.ts`, `src/components/ScrollToTop.tsx`, and the page headers listed above.

After merging you need to `git pull` then run `npx cap sync` before the next native build for the Capacitor config changes to apply.

