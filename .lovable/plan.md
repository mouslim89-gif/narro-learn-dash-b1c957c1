## Changes

### 1. Star button → "+" toggle (add/remove)
In `WordMiniPopup.tsx` and `WordPopup.tsx`:
- Replace the `Star` icon import/usage with `Plus` (when not saved) and `Check` or `Minus` (when saved) from lucide-react.
- Wire the click handler so that:
  - if `hasWord(wordId)` → call `removeWord(wordId)` (with toast "Removed from Flashcards")
  - else → call `addWord(entry)` (existing behavior)
- Update label text in `WordPopup` from "Add to Flashcards" / "Added to Flashcards" → "Add to Flashcards" / "Remove from Flashcards".

**Icon choice question:** I'll use `Plus` (not saved) and `Check` (saved). If you prefer `Plus` / `Minus`, tell me.

### 2. Review mode: toggle to show/hide kana reading on front
In `FlashcardReview.tsx`:
- Add a local toggle (persisted to localStorage, e.g. `yomimasu-review-show-reading`, default = `true` to keep current behavior).
- Render a small `Switch` + label ("Show reading") in the review header area.
- On the front face (line 98), conditionally render the `<p>{card.reading}</p>` based on the toggle. Audio button stays visible.

### Technical notes
- No backend / store schema changes.
- The toggle preference is local-only (per device), not synced.
- Files touched: `src/components/WordMiniPopup.tsx`, `src/components/WordPopup.tsx`, `src/components/FlashcardReview.tsx`.