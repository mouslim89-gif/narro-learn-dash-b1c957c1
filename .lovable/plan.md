# Fix corrupted grammar pattern labels

## What is wrong

The label in your screenshot reads "Volitional form form form + とした/とする". The duplication is in the data file `src/data/book-grammar.ts`, not in the display code.

Cause: the label-normalization script has two overlapping rules, `volitional form -> Volitional form` and `volitional -> Volitional form`. The second rule re-matches the word inside an already-normalized label, so every run of the script appends another "form". The script's single cleanup rule only removes one duplication, not two.

## Full audit of the data (622 unique patterns)

Confirmed issues, all in `src/data/book-grammar.ts`:

- 21 labels with `Volitional form form form`
- 8 labels with `Volitional form form`
- 1 label with `Conditional form form (ば)`
- 3 labels ending with a stray English word `luxury`:
  - `Dictionary form + にちがいない luxury`
  - `Te-form + たまらない luxury`
  - `Volitional form form form + と思う luxury`
- 1 typo label: `Volitional form form form + とるす` (should be `とする`)
- 1 duplicated note: in `gyofukuki / simplified / part 2`, two notes share the exact same meaning ("To try to do something or to be about to do something") with patterns `とした/とする` and `としました`. This is the second card in your screenshot.

No other repeated-word or garbled labels were found.

## What I will do

1. Clean the labels in `src/data/book-grammar.ts`:
   - collapse any `form form...` run back to a single `form`
   - drop the trailing `luxury` artifacts
   - fix `とるす` to `とする`
2. Remove the duplicated `としました` note in `gyofukuki / simplified / part 2`, keeping the `Volitional form + とした/とする` one.
3. Fix `scripts/normalize-grammar-labels.ts` so it can never reintroduce the bug: make the bare `volitional` rule ignore an already-followed "form", and make the cleanup rule collapse any number of repeats (same for `conditional`, `potential`, `passive`, `causative`, `imperative`, `te`, `dictionary`).
4. Cache check: labels are the cache key (`pattern_slug`) for grammar structures/examples. Most corrected labels already have a cached row in the database, so no regeneration is needed for them. For the few corrected labels with no cached row, I will run the existing preload script only for those missing patterns (a handful of requests, not a full re-run).

## Technical notes

- Files touched: `src/data/book-grammar.ts`, `scripts/normalize-grammar-labels.ts`.
- No UI/component change; `GrammarPanel` and `GrammarDetail` render the label as-is.
- The old corrupted `pattern_slug` rows in `grammar_examples` are left in place (harmless, unreferenced); no destructive database change.
