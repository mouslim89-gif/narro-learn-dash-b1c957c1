# Fix: bottom nav disappears and doesn't come back on refresh

## Root cause

In `src/App.tsx`, the bottom nav is hidden whenever `isReviewing` from the flashcard store is `true`:

```ts
const hideNav = location.pathname.startsWith('/reader/') || isReviewing || isAuthRoute;
```

`isReviewing` lives in `src/stores/flashcards.ts`, which uses Zustand's `persist` middleware **without a `partialize`**. That means the entire state — including `isReviewing: true` — gets written to `localStorage` under `yomimasu-flashcards`.

If a review session ends abnormally (navigation away mid-review, tab close, crash, hot reload during review, etc.) without `setIsReviewing(false)` firing, the `true` value is persisted. On reload, the store rehydrates `isReviewing = true`, so the nav stays hidden on every page until something flips it back — which today only happens by entering and leaving the Flashcards review flow again (or any edit that resets the store shape).

This matches the symptom exactly: nav gone, refresh doesn't fix it, next "edit" makes it come back.

## Fix

Two small, complementary changes in `src/stores/flashcards.ts`:

1. **Add a `partialize`** to the `persist` config so only `savedWords` is written to `localStorage`. `isReviewing` and `syncUserId` are pure runtime/session state and shouldn't be persisted.
2. As a safety belt, **add an `onRehydrateStorage`** that forces `isReviewing = false` after rehydration. Cheap insurance against any old persisted value already sitting in users' browsers.

```ts
persist(
  (set, get) => ({ /* unchanged */ }),
  {
    name: 'yomimasu-flashcards',
    partialize: (state) => ({ savedWords: state.savedWords }),
    onRehydrateStorage: () => (state) => {
      if (state) state.isReviewing = false;
    },
  }
)
```

No changes to `App.tsx` or `BottomNav.tsx` needed.

## Why not other approaches

- **Resetting `isReviewing` in a `useEffect` on mount in `App.tsx`** would also work, but it leaks store concerns into the app shell and runs on every mount. Fixing it at the store boundary is cleaner.
- **Removing the `isReviewing` check from `hideNav`** would break the intentional fullscreen review UI.

## Files touched

- `src/stores/flashcards.ts` — extend the `persist` options object only.
