## Goal

On mobile, when a button triggers navigation, the press animation (`active:scale-[0.92]`) is invisible because the page unmounts before the browser paints the pressed state. Fix: defer the navigation by ~120ms so the press-down → release animation is fully visible, then change route.

## Approach

Add a small reusable hook that wraps any navigation action with a short delay, and apply it to all navigating buttons/links across the app.

### 1. New hook `src/hooks/use-delayed-nav.ts`

```ts
// Returns a click handler that:
// 1. Lets the browser paint the :active (pressed) state
// 2. Waits ~120ms total so the scale-down + scale-up is visible
// 3. Then navigates (or runs the provided callback)
// Respects prefers-reduced-motion (no delay).
// Ignores modifier keys / middle click (let browser handle).
export function useDelayedNav(delay = 120) { ... }
```

It will:
- Call `e.preventDefault()` on the click
- `requestAnimationFrame` → `setTimeout(delay)` → `navigate(to)` (or callback)
- Skip delay if `matchMedia('(prefers-reduced-motion: reduce)').matches`

### 2. Apply globally via the `Button` component

In `src/components/ui/button.tsx`, when `asChild` is false and the consumer passes an `onClick` that navigates, the delay is the consumer's responsibility — but for the most common case (Button wrapping a `Link` via `asChild`), we can't intercept easily. So instead:

- Add a tiny dedicated component `NavButton` (or extend `Button` with a `to` prop) that internally uses `useDelayedNav`.
- Migrate all navigating buttons to it.

Simpler alternative used in this plan: keep `Button` as-is, and update each navigating call site to use the hook. Since "all navigation buttons" is the scope, we'll grep for `<Link to=` / `navigate(` / `<Button asChild>` and convert systematically.

### 3. Files to touch (navigation buttons / cards)

Located via grep on `navigate(`, `<Link `, `asChild`:
- `src/pages/Library.tsx` — book cards, CTAs
- `src/pages/MyBooks.tsx` — shelf items
- `src/pages/BookDetail.tsx` — Continue / Start Reading, chapter rows, back button
- `src/pages/Flashcards.tsx` — start review, deck items
- `src/pages/Dictionary.tsx` — word rows
- `src/pages/WordDetail.tsx` — back button, related words
- `src/pages/Settings.tsx` — back button, links
- `src/pages/Auth.tsx` / `ResetPassword.tsx` — submit-then-redirect flows (apply only to navigation links, not form submits)
- `src/components/BookCard.tsx`
- `src/components/my-books/BookShelfRow.tsx`
- `src/components/NavLink.tsx` — used by header back buttons
- **Excluded**: `BottomNav.tsx` (per your earlier instruction the floating pill should not animate as a button — keep it as-is, no delay needed because the active pill already moves with `layoutId`)
- **Excluded**: in-Reader controls (`ReaderToken`, settings panel) — Reader has its own UI rules per memory

### 4. Timing

- Delay: **120ms** (matches the perceived press duration of `active:scale-[0.92]` with `duration-200 ease-out`, captures both press-in and partial release).
- Combined with the existing 280ms page fade transition, total feel stays well under 500ms — still snappy.
- Reduced-motion users skip the delay entirely.

### 5. Edge cases

- Double-tap protection: the hook stores a ref to ignore re-entrant clicks while a navigation is pending.
- External links (`http(s)://`): bypass the delay, native behavior.
- Cmd/Ctrl/middle-click: bypass (open in new tab).
- If the component unmounts before the timeout fires, clear the timer.

## Technical details

```ts
// src/hooks/use-delayed-nav.ts
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

const PRESS_DELAY_MS = 120;

export function useDelayedNav() {
  const navigate = useNavigate();
  const pendingRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => () => {
    if (pendingRef.current) window.clearTimeout(pendingRef.current);
  }, []);

  return useCallback(
    (
      to: string | number,
      e?: React.MouseEvent,
      options?: NavigateOptions,
    ) => {
      if (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
      }
      if (lockedRef.current) return;
      lockedRef.current = true;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const delay = reduce ? 0 : PRESS_DELAY_MS;

      pendingRef.current = window.setTimeout(() => {
        lockedRef.current = false;
        if (typeof to === "number") navigate(to);
        else navigate(to, options);
      }, delay);
    },
    [navigate],
  );
}
```

Usage pattern at call sites:

```tsx
const goTo = useDelayedNav();
<Button onClick={(e) => goTo(`/reader/${book.id}/${difficulty}`, e)}>Continue</Button>
// or for <Link> styled as card:
<a href={`/book/${book.id}`} onClick={(e) => goTo(`/book/${book.id}`, e)} className="...">
```

For `<Link>` we keep the `<a>` element (so right-click "open in new tab" still works) but intercept the click.

## Out of scope

- No changes to BottomNav (per prior decisions).
- No changes inside the Reader UI.
- No changes to button visual styling (`relief-raised`, `tap-scale`, etc. stay as-is).
- No backend changes.
