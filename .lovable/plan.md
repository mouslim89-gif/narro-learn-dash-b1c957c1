

## Fix Conjugation Detection & Conjugation Table Scope

### Problems identified

1. **Stale pre-baked data**: 26% of entries in `book-dictionary.ts` have empty results (316 out of 1173). Words like `行きました` in momotaro/simplified return 0 results. The data was generated before the deinflection rules were improved.

2. **ConjugationTable shows for する compound verbs**: Words like `勉強する` show a full conjugation table. The user only wants conjugation tables for pure verbs (行く, 食べる, する, 来る), not for every noun+する compound.

3. **Deinflected field always null**: Even when Jisho finds `行く` from `行きました`, `deinflected` is null because the edge function only tries deinflection when Jisho returns 0 results. This means the conjugation label in the popup relies solely on comparing `result.japanese[0].word` with the original word — which works, but is fragile.

### Plan

**1. Regenerate book-dictionary.ts** with the current (improved) edge function
- Write a script that tokenizes all books, calls the deployed edge function in batches, and writes the results back to `book-dictionary.ts`
- This will fix the 316 empty entries since the edge function now has proper godan deinflection rules

**2. Fix edge function deinflection trigger** (`supabase/functions/jisho-lookup/index.ts`)
- Currently deinflection only runs when `results.length === 0`. But Jisho sometimes finds the word directly (e.g. `行きました` → returns `行く`)
- Change logic: if the first result's `japanese[0].word` differs from the keyword, set `deinflected` to that word so the client knows it was conjugated
- This gives the client a reliable `deinflected` field

**3. Restrict ConjugationTable to pure verbs** (`src/components/WordPopup.tsx`)
- Only show ConjugationTable when the word is a standalone verb (godan, ichidan, する, 来る)
- Skip it for する compound verbs (parts_of_speech containing "Suru verb" but the word ends in する and has a noun prefix)
- Simple check: only show table if dictForm is する, 来る, or is a godan/ichidan verb (not a suru-compound)

**4. Fix ConjugationTable filter** (`src/components/ConjugationTable.tsx`)
- In `getVerbType`, return `'suru'` only when the word is exactly `する` (not compounds like `勉強する`)
- For compounds, return `null` so no table is rendered

### Files to modify
1. `supabase/functions/jisho-lookup/index.ts` — Set deinflected when Jisho auto-matches a different base form
2. `src/components/ConjugationTable.tsx` — Only show for pure する, not compounds
3. `src/components/WordPopup.tsx` — Minor adjustment to isVerb check
4. `src/data/book-dictionary.ts` — Regenerate with current edge function

