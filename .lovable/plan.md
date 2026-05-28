Split **Urashima Tarō** and **Rashōmon** into synchronized narrative parts, following the `split-book-into-parts` skill (mirroring the `lemon` reference shape).

## Urashima Tarō → 4 parts

Boundaries follow the author's own 一/二/三/四 section breaks in the original (sizes 1567 / 1270 / 1105 / 1689 chars). Simplified and intermediate split at the matching narrative beats (both have 23 paragraphs, cleanly aligned).

| # | Anchor | Narrative beat | Original ¶ | Intermediate ¶ | Simplified ¶ |
|---|---|---|---|---|---|
| 1 | **The Young Fisherman** | opens → through arriving at the palace gate | 一 | 1–7 | 1–7 |
| 2 | **The Dragon Palace** | inside the palace, feasts, four-season windows | 二 | 8–10 | 8–10 |
| 3 | **Homeward Bound** | homesickness, departure, receiving the box | 三 | 11–14 | 11–14 |
| 4 | **The Empty Shore** | return to the village, the box | 四 | 15–23 | 15–23 |

## Rashōmon → 6 parts

Original is 17 K chars over 36 paragraphs — split at narrative ruptures, mapped onto the simpler versions paragraph-by-paragraph.

| # | Anchor | Narrative beat | Original ¶ | Intermediate ¶ | Simplified ¶ |
|---|---|---|---|---|---|
| 1 | **Beneath the Gate** | evening, ruined Rashōmon, decay of Kyoto | 1–4 | 1–3 | 1–2 |
| 2 | **Starve or Steal** | the servant's dismissal and dilemma | 5–7 | 4–6 | 3–4 |
| 3 | **Firelight Above** | climbs the ladder, sees fire, sees the old woman | 8–12 | 7–9 | 5–6 |
| 4 | **Drawn Blade** | fury, leaps out, demands an answer | 13–22 | 10–15 | 7–8 |
| 5 | **The Old Woman's Tale** | her justification, the servant listens | 23–28 | 16–17 | 9–11 |
| 6 | **Into the Night** | the servant acts, vanishes | 29–36 | 18–22 | 12–15 |

Anchors are Title Case, 2–4 words, evocative, no spoilers (no "snaps", "dies", "robs", "opens", etc.).

## Execution steps

1. Rewrite `src/data/books/urashima.ts` and `src/data/books/rashomon.ts` with `…SimplifiedParts`, `…IntermediateParts`, `…OriginalParts`, `…Anchors`, plus back-compat `urashimaSimplified = urashimaSimplifiedParts.join('\n\n')` aliases. Separator is exactly `'\n\n'`. Concatenation of parts must be byte-identical to the current blob — self-checked in a tiny verification script before writing.
2. Update `src/data/books.ts` for both books: add `parts: {...}` and `anchors: ...`, extend the import line. Leave `content` as-is.
3. Create `scripts/generate-grammar-for-urashima.ts` and `scripts/generate-grammar-for-rashomon.ts` by copying the lemon variant and swapping the id (these already exist as single-blob versions — they'll be replaced with the per-part shape from `scripts/generate-grammar-for-lemon.ts`). Run them; verify `bookGrammar['urashima']['simplified'].length === 4` and `bookGrammar['rashomon']['simplified'].length === 6`.
4. Re-run `npx tsx scripts/generate-tokens.ts` so tokens reflect the (unchanged-content) re-split files.
5. Skip dictionary regen — no wording changes.
6. Verify in the Reader: `/reader/urashima/.../part-N` and `/reader/rashomon/.../part-N` render the correct slice, prev/next pills work, BookDetail lists anchors with per-part progress, GrammarPanel shows only that part's notes.

## Technical notes

- The Reader, BookDetail and GrammarPanel are already part-aware (`hasParts`, `parsePartId`, `getChapterContent`, `getGrammarForPart`) — no UI code changes needed.
- Confirming the anchors **before** Step 3 because the grammar generator makes ≈ 4×3 + 6×3 = 30 edge-function calls.
- Translation cache (`sentence_translations`) is hash-keyed on the sentence text only, so the already-preloaded translations remain valid (no re-translation needed).

## Out of scope

- No per-part audio, no rephrasing, no new dictionary words.

**Please confirm the anchors** (especially Urashima #3 "Homeward Bound" and Rashōmon #5 "The Old Woman's Tale") — anything you'd like reworded before I burn the grammar API calls?