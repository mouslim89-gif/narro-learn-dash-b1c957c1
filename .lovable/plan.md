

## Mobile-First App Improvements

Since this is a mobile app, the improvements focus on touch interactions, mobile UX patterns, and proper mobile viewport handling.

### 1. WordPopup → Bottom Sheet on Mobile
The current popup uses absolute positioning which clips on small screens. Replace with a slide-up bottom sheet using Drawer component (vaul, already installed).
- Tap word → bottom sheet slides up from bottom with drag handle
- Swipe down to dismiss
- Keep all existing content (definition, conjugation, JLPT badge, save button)

**Files**: `src/components/WordPopup.tsx`, `src/pages/Reader.tsx`

### 2. Flashcards — Flip Animation + SRS Scheduling
- Add 3D CSS flip animation on the review card (tap to flip)
- Add `lastReviewedAt`, `nextReviewAt` to SavedWord for spaced repetition intervals (1d → 3d → 7d → 30d)
- Show "X cards due" notification badge on the Cards tab in BottomNav
- Add progress bar during review

**Files**: `src/stores/flashcards.ts`, `src/pages/Flashcards.tsx`, `src/components/BottomNav.tsx`, `src/index.css`

### 3. Mobile Meta Tags + PWA Setup
- Update `index.html`: set title to "Yomimasu", add `apple-mobile-web-app-capable`, status bar color, theme-color meta tags
- Add `viewport-fit=cover` for notched devices
- Add safe-area padding to BottomNav for home indicator

**Files**: `index.html`, `src/components/BottomNav.tsx`

### 4. Reader Touch Improvements
- Increase tap target size for Japanese words (slightly more padding)
- Add haptic-style visual feedback on word tap (brief scale animation)
- Sentence-level highlighting: tap a sentence to softly highlight it for tracking position

**Files**: `src/pages/Reader.tsx`, `src/index.css`

### 5. My Books — Reading Stats Header
- Stats row at top: total words saved, books in progress, estimated reading time
- Streak counter based on `lastReadAt` timestamps (calculated at render)

**Files**: `src/pages/MyBooks.tsx`

### 6. Visual Polish
- BookCard: subtle gradient overlay on covers for depth
- Better empty state illustrations (emoji-based) for My Books and Flashcards
- Smooth page transitions using framer-motion (already installed)

**Files**: `src/components/BookCard.tsx`, `src/pages/MyBooks.tsx`, `src/pages/Flashcards.tsx`, `src/App.tsx`

### Technical notes
- Bottom sheet uses the existing `vaul` Drawer component — no new dependencies
- SRS intervals stored alongside existing mastery data in the flashcards Zustand store
- Safe-area insets use `env(safe-area-inset-bottom)` CSS
- All changes are client-side only, no backend modifications

