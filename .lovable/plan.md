

## Fix: Merge adjective te-forms (嬉しくて) into single tokens

### Problem
Kuromoji splits `嬉しくて` into two morphemes: `嬉しく` (形容詞) + `て` (接続助詞). The current merge logic only absorbs `て` when it's followed by a dependent verb or auxiliary (like `ている`). For adjective te-forms, `て` is left as a separate token.

This means:
- `嬉しくて` appears as two clickable words instead of one
- The base form `嬉しい` is harder to reach since only `嬉しく` is shown

### Fix

**1. `scripts/generate-tokens.ts`** — Add a merge rule in `mergeTokens()`
- After the existing te-form merge rule (line ~160), add: if the **head word** is an adjective (形容詞) and the next token is a te-form particle (`て`/`で`), merge it unconditionally
- This produces `嬉しくて` as a single token with base form `嬉しい`

**2. Regenerate `src/data/book-tokens.ts`**
- Re-run `npx tsx scripts/generate-tokens.ts` to produce updated tokens

### Files to modify
1. `scripts/generate-tokens.ts` — Add adjective + て merge rule
2. `src/data/book-tokens.ts` — Regenerated output

