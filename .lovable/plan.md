## Hide bottom nav on detail/settings pages

Update `src/App.tsx` — extend the `hideNav` condition so the `BottomNav` is not rendered on:

- `/book/:id` (Book details)
- `/dictionary/:word` (Word detail)
- `/settings`

Already hidden: `/reader/*`, `/auth`, `/reset-password`, and during flashcard review.

Top nav (the 4 main tabs: Library, My Books, Flashcards, Dictionary) stays visible only on those root pages — so navigating into a book, a word, or settings gives a fully focused screen.

### Transitions

Current setup in `App.tsx` already uses a single Framer Motion fade (0.28s, spring easing) with `mode="wait"` when logged in. There is no loading screen / skeleton flash between routes — only the fade. So the first part of your message can be ignored unless you're still seeing a loading state somewhere specific (let me know which route if so).

### Technical detail

```ts
const hideNav =
  location.pathname.startsWith('/reader/') ||
  location.pathname.startsWith('/book/') ||
  location.pathname.startsWith('/dictionary/') && location.pathname !== '/dictionary' ||
  location.pathname === '/settings' ||
  isReviewing ||
  isAuthRoute;
```

(`/dictionary` keeps the nav, `/dictionary/:word` hides it.)
