## Goal
1. Update the grammar-notes edge function prompt so future generations never contain romaji.
2. Clean romaji out of the existing `src/data/book-grammar.ts` without re-running the full text-to-grammar generation.

## 1. Prompt fix (`supabase/functions/grammar-notes/index.ts`)
Add an explicit hard rule to the system prompt:
- No romaji anywhere in output.
- `pattern` → kana/kanji only (e.g. `～ている`).
- `example` → copied verbatim from source (kana/kanji).
- `meaning` & `tip` → English; any Japanese reference written in kana/kanji, optionally followed by an English gloss in parentheses (e.g. `食べる (to eat)`). Never `tabeta`, `te-iru`, `kuru`, etc.

Then redeploy the function.

## 2. Clean existing notes
Write a one-off script `scripts/strip-romaji-grammar.ts` that:
1. Loads `src/data/book-grammar.ts` (parses the JSON literal already in the file).
2. For each note where `meaning` or `tip` contains a romaji transliteration of Japanese, sends just that one note to the Lovable AI gateway with a "rewrite without romaji, keep the same meaning, keep all other fields untouched" instruction. `pattern` and `example` are left alone (already kana/kanji from the existing data; example is verbatim source).
3. Writes the cleaned object back to `src/data/book-grammar.ts` using the same shape and header the existing generator scripts write.

Detection heuristic to decide which notes need a rewrite (to avoid touching/billing notes that are already clean):
- Strip out an allow-list of plain English words (the/a/is/verb/noun/adjective/particle/JLPT/etc.) and Japanese (kana/kanji) characters from `meaning + tip`.
- If what's left still contains a lowercased multi-letter Latin token that matches a romaji shape (`^[a-zāīūēōâîûêô']+$` with at least one vowel and not in the English allow-list), flag it.
- Flagged notes only are sent to the model — keeps cost minimal.

Model: `google/gemini-3.5-flash` (cheap, good enough for short rewrites). Batched ~20 notes per request to limit round-trips.

After the script runs once, the file is clean and the new prompt prevents regressions.

## Out of scope
- No UI changes.
- No re-generation from book text.
- No schema/token/dictionary changes.
