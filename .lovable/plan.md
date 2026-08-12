# Cards page: unified review deck + finish grammar preloading

## 1. The Words / Grammar switch becomes a list filter only

Today the switch swaps the entire page. After this change it sits just above the list and only changes which list is shown. Everything above it — the Review CTA, daily goals, stat tiles, search and sort — stays visible in both modes and covers words *and* grammar together.

Layout order:

```text
Header (Flashcards)
Review CTA        <- with All / Words / Grammar scope selector
Daily goals
Stat tiles (New / Learning / Known / Due)  <- combined counts
Search + sort
Words | Grammar switch   <- filters only the list below
List
```

## 2. Grammar points become real SRS cards

- Saved grammar gains the same SM-2 fields as words (mastery, ease, interval, reps, lapses, last/next review) and the same daily counters feed.
- Existing saved points are migrated on load: treated as brand-new cards, due immediately.
- Card format: front shows the pattern, back shows the meaning, the formation chips and one example sentence with furigana (from the existing grammar cache — no new AI calls).
- Rating buttons (Again / Hard / Good / Easy) behave exactly as for words; each rating syncs to the cloud like words do.

## 3. Review scope selector

A small segmented control sits on the Review CTA: **All / Words / Grammar**, each showing its due count. Default is All, and the deck is shuffled so words and grammar are interleaved. Tapping Review starts a session with the chosen scope.

## 4. Combined counters

New / Learning / Known / Due tiles, the daily goal gauges and the streak graph count words and grammar together. Filtering by a tile still applies to whichever list is currently shown.

## 5. Finish the grammar example preloading

516 of ~622 unique patterns are cached in the database today. I'll run the existing backfill script to generate the ~106 missing ones (sequential, with backoff, resumable). Once done, every grammar detail page and every grammar review card renders from cache with zero AI cost. I'll report the final cached count.

## Technical notes

- `src/stores/saved-grammar.ts` — extend `SavedGrammar` with `SrsCard` fields, add `migrateCard` on rehydrate/merge, add `adjustGrammarMastery`, `getDueGrammar`; push updates through the existing `pushSavedGrammar` (payload jsonb absorbs the new fields, no migration needed).
- `src/stores/flashcards.ts` — daily counters (`reviewedToday`, `newToday`, `history`) stay the single source of truth; grammar reviews increment them through an exported helper so goals/streak stay combined.
- `src/components/FlashcardReview.tsx` — deck type becomes `SavedWord | SavedGrammar`; a discriminant renders either the word card or a new grammar card face. Existing swipe/anim/exit logic untouched.
- `src/pages/Flashcards.tsx` — restructure so shared sections render unconditionally; the tab only switches the list; add the scope segmented control on the CTA.
- Grammar card examples read the `grammar_cache_<pattern>_<jlpt>` localStorage entry hydrated by `src/lib/grammar-preload.ts`, falling back to `note.example`.
- Backfill: `npx tsx scripts/preload-grammar-examples.ts` (already skips cached slugs).
