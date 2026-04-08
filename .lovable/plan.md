

## Redesign: Serious, Book-Like Aesthetic

### Current State
The app uses a playful Duolingo-inspired design with bright teal/coral/purple colors, rounded cards, and emoji-heavy UI.

### New Direction
A refined, literary aesthetic — think Kindle meets a beautiful bookshop app. Warm, muted tones with elegant typography.

### Design Changes

**Color Palette**
- Background: warm off-white/cream (#FAF8F5) with dark mode using deep charcoal (#1A1A1A)
- Primary: deep navy (#2C3E50) or warm brown (#5D4037)
- Accent: muted gold (#B8860B) for highlights and badges
- Cards: soft white with subtle shadows
- Remove the vibrant teal/coral/purple palette

**Typography**
- Replace Nunito with a more literary font: **Merriweather** for headings (serif), keep **Noto Sans JP** for Japanese text
- Use an elegant sans-serif like **Inter** for UI labels
- Increase line-height in the reader for comfortable reading

**Component Styling**
- Softer border-radius (0.5rem instead of 1rem) — less bubbly
- Subtle borders and shadows instead of bold colored backgrounds
- Book cards: taller, more like actual book covers with a spine effect
- Remove emoji from difficulty levels, use clean text labels or minimal icons
- More whitespace, less visual density

**Library Page**
- Replace the bright gradient featured card with an elegant hero using a subtle background
- Genre sections with refined typography headers (thin uppercase tracking)
- Book cards styled like physical book covers

**Book Detail Page**
- More editorial layout — like a book's back cover
- Clean difficulty selector with radio-style buttons instead of colorful cards

**Reader Page**
- Cream/sepia background option for reading comfort
- More refined header bar
- Subtle word highlight on tap instead of bright primary color

**Audio Player**
- Minimal, dark-toned player bar
- Less playful, more like a podcast player

### Files to Modify
1. `src/index.css` — New color tokens, typography imports
2. `tailwind.config.ts` — Update border-radius default
3. `src/pages/Library.tsx` — Refined hero and genre sections
4. `src/components/BookCard.tsx` — Book-like card styling
5. `src/pages/BookDetail.tsx` — Editorial layout
6. `src/pages/Reader.tsx` — Sepia reading mode, refined styling
7. `src/components/AudioPlayer.tsx` — Minimal dark player
8. `src/components/WordPopup.tsx` — Cleaner popup design
9. `src/components/BottomNav.tsx` — Refined navigation
10. `src/pages/Dictionary.tsx`, `Flashcards.tsx`, `MyBooks.tsx` — Consistent styling
11. `src/data/books.ts` — Update cover colors to muted tones, remove emoji from difficulty config

