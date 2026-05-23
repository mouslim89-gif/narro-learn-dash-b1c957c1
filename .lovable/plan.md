## Plan: Word detail page + star toggle fix

### 1. Star toggle (Dictionary list)
**`src/pages/Dictionary.tsx`** — remove `disabled={saved}`; on click, if `saved` call `removeWord(word)`, else `addWord(entry)`. `e.stopPropagation()` + `e.preventDefault()` so it doesn't trigger card navigation. Use existing `removeWord` from `useFlashcardStore`.

### 2. Card → word detail route
**`src/App.tsx`** — add route `/dictionary/:word` → `WordDetail`.
**`src/pages/Dictionary.tsx`** — wrap each card in `<Link to={`/dictionary/${encodeURIComponent(word)}`}>` (block link). Star button inside uses stopPropagation.

### 3. New page `src/pages/WordDetail.tsx`
Paper UI consistent with the rest of the app. Sections, top to bottom:
- **Back button** (top-left) → `navigate(-1)` with `/dictionary` fallback.
- **Header card**: word (large, font-japanese) + reading + romaji + `PlayWordButton`.
- **Primary CTA**: prominent "Add to flashcards" / "Saved ✓" button (pill, accent color, full-width on mobile). Toggles save state — same logic as the list star. Plus a secondary star icon button for symmetry (optional, but the primary CTA is the explicit ask).
- **Tags row**: Common, JLPT, parts of speech.
- **All meanings**: every `result.senses` entry (no slicing) numbered, with per-sense POS chips and tags.
- **Kanji breakdown**: one card per kanji char in the word. Shows large char, meanings, on'yomi, kun'yomi, JLPT, grade. Skips kana.
- **Examples**: 3 sentences via Tatoeba.
- **Conjugation**: `ConjugationTable` rendered **always expanded** — no accordion / collapsible. Update `ConjugationTable` to accept a `defaultOpen` / `alwaysOpen` prop (or render its inner table directly without the toggle wrapper on this page).

### 4. New edge function `kanji-lookup`
Uses `https://kanjiapi.dev/v1/kanji/{char}` (free, no key). Returns meanings, kun_readings, on_readings, jlpt, grade, stroke_count. Cached in new `kanji_details` table. Zod-validated single-char input.

**New table `kanji_details`** (public read, no client write):
```
character text pk, meanings jsonb, kun_readings jsonb, on_readings jsonb,
jlpt int null, grade int null, stroke_count int null, created_at timestamptz default now()
```

Client helper `src/lib/kanji.ts` with in-memory Map cache.

### 5. Examples (3 sentences)
Extend `supabase/functions/tatoeba-example/index.ts`: optional `limit` (1–5, default 1). Add `sentences jsonb` column to `example_sentences` (nullable, back-compat with `japanese`/`english`). Helper `fetchExamples(word, limit)` in `src/lib/tatoeba.ts`.

### 6. ConjugationTable change
**`src/components/ConjugationTable.tsx`** — add `alwaysOpen?: boolean` prop. When true, render the table directly without the expandable wrapper. Dictionary list keeps current behavior; WordDetail passes `alwaysOpen`.

### Out of scope
Reader, flashcard schema, kanji stroke animations.