## Grammar notes — tighten prompt + regenerate matsu

### 1. Edge function (`supabase/functions/grammar-notes/index.ts`)

Rewrite the system prompt to enforce:

**Skip (do NOT emit a note for):**
- Standalone particles: が, の, を, に, へ, で, と, は, も, から, まで, や, か, ね, よ…
- Bare conjugation morphemes on their own: passive ～られる, potential ～える/～られる, causative ～せる/～させる, past ～た, te-form ～て, negative ～ない, polite ～ます, volitional ～よう
- Basic aspect/voice combos considered too elementary: ～ている, ～させてもらう, ～られている
- General rule: skip anything that is just a conjugation slot with no added meaning beyond the base verb form

**Keep (emit a note for):**
- Compound/idiomatic patterns: ～てしまう, ～なければならない, ～ために, ～のに, ～ように, ～そうだ, ～らしい, ～べき, ～わけではない, ～ばかり, ～つつ, etc.
- Anything carrying its own lexical/discourse meaning beyond raw conjugation

**Metalanguage rules (all English, zero romaji):**
- Pattern strings use English slot labels + kana/kanji: `dictionary form + ために`, `te-form + しまう`, `plain past + ら`, `noun + のような`, `i-adjective stem + そうだ`
- Allowed slot labels: dictionary form, plain form, plain past, te-form, stem, masu-stem, noun, i-adjective, na-adjective, clause
- `meaning` and `tip` fields: English prose only. No Japanese sentences in tips (kana/kanji tokens as references are fine, e.g. "Don't confuse with ～てある").
- Hard ban on romaji anywhere in any field. Explicitly list forbidden examples in the prompt: "no tame ni", "te iru", "rareru", "tabeta", "ikimasu" → all must be written in kana/kanji.

Then redeploy the function.

### 2. Regenerate matsu only

Run `scripts/generate-grammar-for-matsu.ts` to overwrite matsu's entry in `src/data/book-grammar.ts` with notes that follow the new rules.

### 3. Side fix (runtime error)

The preview is currently broken: `Failed to fetch …/book-tokens/books/hana.ts`. That token file is missing — only a-aki, kumo-no-ito, matsu, sakura exist under `src/data/book-tokens/books/`. I'll regenerate the missing token files via `scripts/generate-tokens.ts` in the same pass so `/reader/hana/...` works again.
