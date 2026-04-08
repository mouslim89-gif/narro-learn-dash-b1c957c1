

## Japanese Reading App — "Yomimasu" (読みます)

### Pages & Navigation

**Bottom tab bar** with 4 tabs: Library, My Books, Flashcards, Dictionary

---

### 1. Library (Home)
- **Hero section** with a featured/recommended book
- **Genre sections** (horizontal scroll): Folk Tales, Fiction, Sci-Fi, Slice of Life, Horror
- Each **book card** shows: cover image (colored placeholder), title (JP + EN), difficulty badge (N5→N1 color-coded), estimated reading time
- Tapping a card → Book Detail page

### 2. Book Detail Page
- Book cover, title, synopsis, genre badge, difficulty badge
- **3 reading modes** as selectable cards:
  - 🟢 Simplified — very easy Japanese (short sentences, basic kanji)
  - 🟡 Intermediate — moderately simplified
  - 🔴 Original — full original text
- "Start Reading" button → Reader page
- Audio toggle: if audio file is available, show an audio badge

### 3. Reader Page
- Clean reading view with large Japanese text (vertical or horizontal layout)
- **Sticky audio player bar** at bottom (play/pause, progress bar, speed control) — audio file based, no TTS
- **Word tap popup bubble**: tap any word → floating bubble with:
  - The word in kanji + furigana reading
  - English translation
  - "Save to flashcards" ⭐ button
  - "Open in dictionary" 📖 button
- Progress indicator (chapter/percentage)
- Difficulty switcher accessible from a top menu to switch version mid-read

### 4. Flashcards Page
- List of all saved words, grouped by book
- Simple flashcard review mode: show word → tap to reveal meaning
- Delete/archive saved words

### 5. Dictionary Page
- Search bar (search by romaji, kana, or English)
- Results show: word, reading, translation, example sentence
- "Save to flashcards" button on each entry

---

### Data & Content
- All books use Lorem Ipsum–style Japanese placeholder text (mix of hiragana/katakana/kanji gibberish) for now
- ~6 sample books across genres
- Word definitions are hardcoded sample data (a set of ~30 common Japanese words)
- No backend needed initially — all data stored locally in the app

### Design
- Modern, colorful UI with Duolingo-like energy
- Primary: vibrant teal/green, accents: coral, purple badges
- Rounded cards, playful icons, smooth transitions
- Responsive but mobile-first feel

