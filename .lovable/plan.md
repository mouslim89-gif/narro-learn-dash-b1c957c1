## Issues identified (using うるさい as the example case)

1. **Header shows 煩い instead of うるさい** — `getDisplayWord()` in `src/lib/jisho.ts` checks `isUsuallyKana()` against `senses[].parts_of_speech` and `result.tags`, but Jisho's "Usually written using kana alone" flag actually lives in `senses[].misc` (and sometimes `senses[].tags`). The edge function `supabase/functions/jisho-lookup/index.ts` strips those fields out in `mapResult()`, so the client never sees the uk flag and falls back to the kanji form.

2. **Meanings rendered as `noisy;loud`** — definitions are joined with a bare `';'` (no spaces) in `WordDetail.tsx` line 278 and `Dictionary.tsx` line ~210. Should be `'; '` (or `', '`) to read naturally.

3. **Examples don't contain the word** — Tatoeba does substring matching, so a query for `煩い` returns sentences containing `煩悩`, `煩わしい`, etc. We also never query the kana form, so we miss the most natural うるさい sentences. The result is filtered to nothing relevant.

---

## Plan

### 1. Edge function: preserve uk metadata
`supabase/functions/jisho-lookup/index.ts` — extend `mapResult()` so each sense also carries `misc` and `tags`:
```ts
senses: (item.senses || []).slice(0, 3).map((s: any) => ({
  english_definitions: s.english_definitions || [],
  parts_of_speech: s.parts_of_speech || [],
  tags: s.tags || [],
  misc: s.misc || [],
})),
```
No schema change for callers; just additional fields.

### 2. Client: detect uk correctly
`src/lib/jisho.ts`
- Extend the `JishoResult` sense type to optionally include `tags?: string[]` and `misc?: string[]`.
- Update `isUsuallyKana()` to also check `sense.tags` and `sense.misc` (Jisho exposes the human label "Usually written using kana alone" in misc; the short tag `uk` may appear too).

### 3. Fix meanings separator
- `src/pages/WordDetail.tsx` line 278: `english_definitions.join('; ')`.
- `src/pages/Dictionary.tsx` (search result card meanings): same change.

### 4. Filter Tatoeba examples to the actual word
`supabase/functions/tatoeba-example/index.ts`
- Accept an optional `altWord` in the request body (e.g. the kana form for usually-kana entries).
- Query Tatoeba with whichever form is more likely to give clean matches (prefer the kana form when provided, since substring noise from a kanji like 煩 is the worst offender). Optionally do a second query for the alt form and merge.
- After fetching, **filter** `collected` to sentences whose `japanese` contains either `word` or `altWord` as a substring matching the **exact form** (i.e. the kanji form OR the kana form, not just one kanji of it). Concretely: keep a sentence iff it contains `word` or `altWord` literally.
- Important: drop the existing cache row before re-querying when callers supply a new altWord, or key the DB cache on `(word, altWord)`. Simpler approach: cache key stays `word`, but we re-validate and re-fetch when cached sentences fail the new filter. To keep this minimal, just re-filter at read time and treat empty filtered cache as a miss.

`src/lib/tatoeba.ts`
- Add optional `altWord?: string` parameter to `fetchExamples(word, limit, altWord?)`.
- Pass it through in the function body.

`src/pages/WordDetail.tsx`
- When calling `fetchExamples`, pass both the chosen display form and the other form: if `disp.word === reading` (usually-kana case), pass `altWord = result.japanese[0].word` (the kanji form). Otherwise pass `altWord = reading`. This way we always look up examples by whichever form actually exists in Tatoeba data, then filter to one of those forms.

### 5. Verification
- Reload `/dictionary/うるさい` (or search "urusai"): header card should display うるさい with 煩い as a secondary reading; meanings show "noisy; loud" with spacing; example list shows only sentences containing うるさい or 煩い (exact substring), no 煩悩 / 煩わしい matches.
- Spot-check a non-uk word (e.g. 食べる) to make sure the uk path didn't regress regular entries.

---

## Files touched
- `supabase/functions/jisho-lookup/index.ts` — keep `misc` and `tags` per sense.
- `supabase/functions/tatoeba-example/index.ts` — accept `altWord`, filter results to exact-form matches.
- `src/lib/jisho.ts` — extend type; uk detection reads `misc`/`tags`.
- `src/lib/tatoeba.ts` — pass `altWord` through.
- `src/pages/WordDetail.tsx` — pass altWord; fix `'; '` join.
- `src/pages/Dictionary.tsx` — fix `'; '` join.

No DB migration, no new dependencies.