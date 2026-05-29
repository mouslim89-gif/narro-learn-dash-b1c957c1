## Goal

1. Add a quick chapter-jump UI in the Reader for parts (and reuse for multi-chapter books).
2. Move the admin "token edit" wrench out of the header and into the Settings sheet as a toggle row.

## Changes (all in `src/pages/Reader.tsx`)

### 1. Chapters sheet

- **Header chip** (only when `hasParts(book)` or `book.chapters?.length > 1`): new `HeaderChip` with `List` icon (lucide-react), placed just before the Settings chip. Opens a new bottom `Sheet` (`ChaptersSheet`).
- **Sheet content** (`side="bottom"`, `rounded-t-3xl max-h-[80vh]`, scrollable):
  - Title row: `"Chapters"` + small `"{currentIdx+1} / {total}"` muted counter.
  - List items reusing the visual pattern from `BookDetail.tsx` (lines 160-230):
    - Numbered circle → `CheckCircle2` when `pct >= 100`, plain number otherwise; primary tint when done, ring on current.
    - Anchor title (parts) or `chapter.title` (chapters).
    - `Progress` bar + `%` when `0 < pct < 100`.
    - `ChevronRight` on the right.
  - **Current item**: `ring-2 ring-primary bg-primary/5`, auto-scrolled into view on open.
  - Tap → `navigate(\`/reader/${id}/${difficulty}/${targetId}\`)` and close sheet. Tapping the current item just closes.
- **Data**: read `useReadingProgressStore((s) => s.progress)`; look up each entry by `chapterKey(bookId, partChapterId(i))` or `chapterKey(bookId, ch.id)`.
- Keep existing top article anchor heading and bottom prev/next pills unchanged.

### 2. Move admin edit toggle to Settings

- Delete the wrench `HeaderChip` block (lines 756-769) from the header.
- In the Settings sheet body (`settingsBody`), add a new `SettingsSection label="Admin"` rendered only when `isAdmin`:
  - A row with label `"Token edit mode"` + helper text `"Tap tokens to merge or split"` + a `Switch` bound to `tokenEditMode` / `setTokenEditMode`.
  - Toggling off also clears `selectedIdx`, closes `miniPopup` and `sentenceTranslation` (same side-effects the old chip had).
- Remove unused `Wrench` import if it's no longer used elsewhere in the file.

## Out of scope

- BookDetail chapter list changes.
- Persisting sheet state, swipe gestures, or transitioning between parts without leaving the reader.
- Any backend or data file changes.
