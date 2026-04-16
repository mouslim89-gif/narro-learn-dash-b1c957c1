

## Plan

Two fixes:

### 1. Add "Common" badge to WordMiniPopup
Currently the mini popup shows JLPT badge but no Common badge. Add a small `✦` badge (very compact) next to JLPT in the header when `result.is_common` is true.

### 2. Fix conjugation label in WordPopup

**Problem A — wrong label for 包まれる:**
The current `getConjugationLabel` in `WordPopup.tsx` iterates `CONJUGATION_PATTERNS` and matches the **first** suffix found. For 包まれる:
- The list has `られる` (passive/potential) BEFORE `れる`, but `包まれる` ends in `まれる`, not `られる`. So it falls through to shorter patterns and matches `る`-less stuff... actually it ends up matching nothing specific and may hit `ます`-related fallback. Looking at the list, none of the patterns match `包まれる` cleanly except potentially nothing — meaning it returns `Dictionary form: 包む`.

Wait — re-reading: user says it shows "polite form". That means it's matching `ます` somewhere... actually it must match because `包まれる` doesn't end in any of those. Let me check — patterns are checked with `original.endsWith(suffix)`. `包まれる` ends with `れる` — but `れる` isn't in the list as standalone. It DOES end with `る` — not in list. Hmm.

Actually the issue: passive `〜れる` (godan passive, e.g. 包む→包まれる) is NOT in the patterns list. Only `られる` (ichidan passive) is. So `包まれる` falls through entirely and shows the generic "Dictionary form: 包む" — but user says it shows "polite form". 

Either way, the fix is the same: **add proper detection for godan passive `〜れる`** and improve the heuristics by also using the POS/dictionary form comparison rather than blind suffix matching.

**Problem B — arrow direction reversed:**
Currently shows `{word} → {deinflected}` (e.g. `包まれる → 包む`). User wants the dictionary form first: `包む → 包まれる` (dict → conjugated).

### Changes

**`src/components/WordMiniPopup.tsx`:**
- Add small Common indicator (✦ icon or tiny badge) in header when `result.is_common` is true
- Place it before/with the JLPT badge, very compact (text-[9px])

**`src/components/WordPopup.tsx`:**
- Add `〜れる` (godan passive) and `〜せる` (godan causative) patterns to `CONJUGATION_PATTERNS`, ordered properly (longer first)
- Specifically: detect when surface ends in `あ-row + れる/せる` and base is godan → passive/causative
- Reverse arrow display: `{deinflected} → {word}` instead of `{word} → {deinflected}`

### Files modified
| File | Change |
|------|--------|
| `src/components/WordMiniPopup.tsx` | Add Common badge in header |
| `src/components/WordPopup.tsx` | Add passive/causative patterns, fix arrow direction |

