

## Improved Verb Conjugation Detection & Conjugation Table

### Problem
1. The deinflection in the edge function is basic — e.g. `行きました` (polite past of `行く`) doesn't match because the rule `ました$` → `る` produces `行きる`, not `行く`. The godan verb masu-stem rules are incomplete.
2. The conjugation label in WordPopup uses simple `endsWith` checks that miss many patterns (e.g. `行きました` ends in `ました` but the check order means it may match wrong).
3. No conjugation table is shown.

### Plan

**1. Fix deinflection rules in the edge function** (`supabase/functions/jisho-lookup/index.ts`)

Expand `getDeinflections` with proper godan masu-stem → dictionary form mappings:
- `きました` / `きます` → `く` (行きました → 行く)
- `ぎました` / `ぎます` → `ぐ`
- `しました` / `します` → `す`
- `ちました` / `ちます` → `つ`
- `にました` / `にます` → `ぬ`
- `びました` / `びます` → `ぶ`
- `みました` / `みます` → `む`
- `りました` / `ります` → `る`
- `いました` / `います` → `う`

Also add polite negative (`ません`), polite past negative (`ませんでした`), volitional (`よう`, `ましょう`), imperative, conditional (`ば`, `たら`) forms.

**2. Improve conjugation label detection** (`src/components/WordPopup.tsx`)

Replace the simple `endsWith` chain with a structured approach that checks longer suffixes first and covers more forms:
- Polite past: `ました`
- Polite negative: `ません`
- Continuous: `ている`, `ていた`, `ていました`
- Past: `った`, `んだ`, `いた`, `いだ`, `した`, `た`
- Te-form: `って`, `んで`, `いて`, `いで`, `して`, `て`
- Negative: `ない`
- Tai: `たい`
- Passive: `られる`, `られた`
- Causative: `させる`, `させた`
- Conditional: `れば`, `たら`
- Volitional: `よう`, `ましょう`
- Potential: `える`, `ける`

**3. Add conjugation table component** (new `src/components/ConjugationTable.tsx`)

A collapsible section in the WordPopup that shows a full conjugation table for the verb. Generated client-side from the dictionary form and verb type (godan/ichidan detected from Jisho parts_of_speech data):

| Form | Japanese | Romaji hint |
|------|----------|-------------|
| Dictionary | 行く | iku |
| Polite | 行きます | ikimasu |
| Past | 行った | itta |
| Polite past | 行きました | ikimashita |
| Negative | 行かない | ikanai |
| Te-form | 行って | itte |
| Potential | 行ける | ikeru |
| Passive | 行かれる | ikareru |
| Causative | 行かせる | ikaseru |
| Volitional | 行こう | ikou |
| Conditional | 行けば | ikeba |

The table only appears when the word is a verb (checked via `parts_of_speech` containing "Verb"). Uses a `Collapsible` component (already in UI library) to keep the popup compact.

**4. Regenerate book-dictionary data** (`src/data/book-dictionary.ts`)

After deploying the improved edge function, regenerate the pre-baked dictionary data so that conjugated forms in the books have correct `deinflected` values. This ensures instant lookup with proper conjugation info.

### Files to modify
1. `supabase/functions/jisho-lookup/index.ts` — Expanded deinflection rules
2. `src/components/WordPopup.tsx` — Better conjugation labels, integrate ConjugationTable
3. `src/components/ConjugationTable.tsx` — New component for verb conjugation display
4. `src/data/book-dictionary.ts` — Regenerated with improved deinflection data

