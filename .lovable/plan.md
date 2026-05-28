# Inline English Translations (Bilingual Mode)

Show the English translation in a smaller, muted line directly below each Japanese sentence in the Reader. Toggle is always-on/off (global), translations are preloaded for the whole part on book open, and cached in the DB so the cost is paid once per sentence ever, across all users.

## UX

- **Toggle** in the Reader top bar (next to furigana toggle): "Show translations" eye icon. Persisted in `user_preferences.show_translations` (new boolean, default `false`).
- **Render**: under each sentence's Japanese line, a smaller English line: `text-sm text-muted-foreground leading-snug`, slightly indented, no border. Hidden when toggle is off (no layout shift — we keep the DOM and use `hidden` class).
- **Loading state**: while preloading, show a thin shimmer placeholder under each sentence instead of text. No spinner, no toast — silent.
- **Failure**: if a sentence fails, show nothing (no broken UI). Retry happens on next book open.

## Preload strategy

When the Reader mounts a `(book, difficulty, part)`:

1. Collect all sentence strings from `sentences` memo (already exists in `Reader.tsx`).
2. SHA-256 hash each sentence client-side.
3. **One bulk DB query** to `sentence_translations` filtering `hash IN (...)` — returns all already-cached translations in a single round trip (instant, no AI cost).
4. For the missing ones, call the edge function in **parallel batches of 5** with a small delay between batches to avoid rate-limit spikes. Each call writes to DB cache, so the next user gets it free.
5. Store results in a `Map<hash, english>` in component state. Render as soon as each sentence's translation arrives (progressive reveal).

Total cost for a fresh book: ~N sentences × 1 cheap Gemini Flash call, **once ever** across all users of the app. Subsequent opens: 1 DB SELECT.

## Technical changes

### 1. DB / migration

- Add unique index on `sentence_translations.hash` if not present (needed for `IN` lookup + upsert). Check first; the `upsert(onConflict: "hash")` implies it exists.
- No new tables. `sentence_translations` already exists with `hash`, `japanese`, `english`.

### 2. New edge function `translate-sentences-batch`

- Input: `{ sentences: string[] }` (max 50 per call).
- For each: hash, lookup cache, if missing → call AI, write cache.
- Returns: `{ results: { hash, english }[] }`.
- Rationale: avoids 1 HTTP call per sentence (could be 200+ for a long part). Internally still parallelized but with shared cache lookup.
- Alternative kept: existing single-sentence `translate-sentence` stays for the popup feature.

### 3. New lib `src/lib/sentence-translations.ts`

- `hashSentence(s: string): Promise<string>` — SHA-256 hex via Web Crypto.
- `preloadTranslations(sentences: string[]): Promise<Map<string, string>>`:
  - Hash all → query `sentence_translations` for cached hashes in one SELECT.
  - Group missing into chunks of 50 → call `translate-sentences-batch` in parallel (max 3 in flight).
  - Returns full `Map<hash, english>`.
- LocalStorage layer (optional, behind same hash key) to skip even the DB lookup on repeat opens of the same book — keeps it instant offline.

### 4. `Reader.tsx`

- New state: `translations: Map<hash, string>`, `translationsLoading: boolean`.
- New `useEffect` on `[bookId, difficulty, partIndex, showTranslations]`: when enabled and not yet loaded, call `preloadTranslations(sentenceStrings)`.
- In the sentence render loop (around the existing token map), after the Japanese tokens, append a `<div>` with the English translation. Visibility controlled by `showTranslations` pref.

### 5. `user_preferences`

- Add `show_translations boolean default false` column.
- Wire into existing preferences store (same place `show_furigana` is read/written).
- Add the toggle to whatever settings panel currently hosts `show_furigana` in the Reader.

## Out of scope (intentional)

- Per-sentence reveal / blur / paragraph mode — user chose always-on.
- Translations for the audio sync sentence alignment (separate concern).
- Quality controls (alternate translations, user edits) — can come later.

## Risk / tradeoffs

- **Cost on first reader of a brand-new book**: ~200 AI calls in 10–20s. Acceptable since cache is shared globally and you've already paid this pattern for grammar notes.
- **No streaming UI**: translations appear progressively as batches resolve, which is good enough.
- **Toggle ON by default?** Recommend keeping it **OFF by default** so users get the immersive experience first; power users opt in. Open to flipping if you disagree. keep it off by default