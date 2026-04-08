

## App Improvements

After reviewing the full codebase, here are focused improvements across UX, reader experience, and feature polish.

### 1. Library — "Continue Reading" banner + search
- Add a "Continue Reading" section at the top of Library when there are books in progress (showing the most recently read book with a large card + progress bar + "Resume" button)
- Add a search/filter bar to find books by title, author, or JLPT level

### 2. BookDetail — Smart "Continue" button
- If the user has progress for a book, show "Continue Reading" instead of "Start Reading" with the saved difficulty pre-selected
- Show a small progress indicator (e.g. "42% read")

### 3. Reader — Font size & dark mode controls
- Add font size adjustment (small/medium/large) to the settings panel, persisted in localStorage
- Add a dark/light mode toggle in the reader settings panel (separate from system theme)
- Show estimated reading time remaining based on scroll position

### 4. Flashcards — Shuffle + progress stats
- Add a "Shuffle" toggle for review mode
- Show a simple stats summary: total words saved, words reviewed today
- Add "Know it" / "Still learning" buttons during review to track mastery (persisted in store)

### 5. Page transitions & polish
- Add smooth fade transitions between pages using `framer-motion`
- Add skeleton loading states for the Library page
- Improve the bottom nav with a subtle active indicator dot instead of just color change

### Files to modify
1. `src/pages/Library.tsx` — Continue reading banner, search bar
2. `src/pages/BookDetail.tsx` — Continue vs Start, progress display
3. `src/pages/Reader.tsx` — Font size control, dark mode toggle, time remaining
4. `src/pages/Flashcards.tsx` — Shuffle, stats, know/learning buttons
5. `src/stores/flashcards.ts` — Add mastery tracking fields
6. `src/stores/reading-progress.ts` — Add font size preference
7. `src/components/BottomNav.tsx` — Active indicator dot
8. `src/index.css` — CSS variables for font size levels
9. `package.json` — Add `framer-motion`
10. `src/App.tsx` — Wrap routes with AnimatePresence

### Technical notes
- Font size stored as a user preference in the reading-progress store
- Dark mode uses Tailwind's `dark` class toggle, scoped to the reader page
- Flashcard mastery uses a simple counter per word (0 = new, 1-2 = learning, 3+ = known)
- framer-motion page transitions use `AnimatePresence` + `motion.div` wrappers

