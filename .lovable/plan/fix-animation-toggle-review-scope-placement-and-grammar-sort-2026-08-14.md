# Fix animation toggle, review scope placement, and grammar sorting

## 1. "Disable app animations" actually disables all motion

Today the toggle only tells the splash screen to return `null`. Everything else — page transitions, entrance/stagger animations, card lifts, pulses — keeps running, so the setting feels broken.

Make it a global motion kill-switch:

- Add a sync effect in `src/App.tsx` (next to `DarkModeSync`) that toggles a `no-anim` class on `<html>` from `useOnboardingStore.disableAnimation`.
- Add a rule in `src/index.css`:
  `html.no-anim *, html.no-anim *::before, html.no-anim *::after { animation: none !important; transition: none !important; }`
  Scroll-driven header vars (`--p`) are plain style values and stay unaffected.
- Wrap the app tree in Framer Motion's `MotionConfig` with `reducedMotion="always"` and a zero-duration transition when the flag is on, so route transitions and card animations resolve instantly instead of animating.
- Keep the splash's existing early return.
- Rename the Settings row to "Disable animations" with the subtitle "Admin only" unchanged.

## 2. Review scope selector moves into the review card

In `src/pages/Flashcards.tsx`, move the All / Words / Grammar segmented pill out of its standalone row and into the "Due today" card, directly under the row containing the Review button (full width, compact, same pill styling). When there is nothing due, the fallback "Review everything" button gets the same pill placed just beneath it inside a shared card container so the association stays obvious. It still only renders when both words and grammar are saved.

## 3. Sort works on the grammar tab

`filteredGrammar` currently ignores `sortBy` / `sortDir`, which is why the sort row is hidden with `tab === 'grammar' && 'hidden'`. Apply the same sorting to grammar items (insertion order for "Date added", `mastery` ascending for "Mastery", reversed on `desc`) and remove the `hidden` condition so the sort control is always visible.

## Technical notes

- Files: `src/App.tsx`, `src/index.css`, `src/pages/Flashcards.tsx`, `src/pages/Settings.tsx`.
- No store/schema changes; `disableAnimation` already persists in `onboarding-storage`.
- No hover states added; all controls keep `tap-scale` / pill styling per the app's mobile theme.
