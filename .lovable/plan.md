

## Reading Progress Tracking

### What it does
- Tracks scroll position in the Reader and saves it as a percentage per book+difficulty
- Persists to localStorage via a new Zustand store
- My Books page shows only books the user has started, with progress bars and last-read difficulty
- BookCard gets an optional progress indicator
- Reader resumes scroll position on re-open

### Files to create
**`src/stores/reading-progress.ts`** — Zustand store with `persist` middleware
- State: `Map<bookId, { difficulty, progressPercent, lastReadAt }>`
- Actions: `updateProgress(bookId, difficulty, percent)`, `getProgress(bookId)`, `getAll()`

### Files to modify

**`src/pages/Reader.tsx`**
- Track scroll position relative to the article container, compute percentage
- Debounce updates to the store (every ~500ms on scroll)
- On mount, restore scroll position from stored progress
- Replace hardcoded `<Progress value={35}>` with actual progress value

**`src/pages/MyBooks.tsx`**
- Filter to only show books that have progress entries in the store
- Display progress bar, difficulty label, and "last read" time on each card
- Show empty state if no books have been started

**`src/components/BookCard.tsx`**
- Accept optional `progress` prop to show a thin progress bar overlay on the book cover

### Technical approach
- Pure localStorage, no database needed (consistent with existing flashcards store pattern)
- Scroll percentage = `scrollTop / (scrollHeight - clientHeight) * 100`
- Scroll listener with `requestAnimationFrame` debounce for performance

