## Why `です` shows up as the noun "spit (of land) / Dezu"

Three things combine:

1. In `src/data/book-tokens.ts`, Kuromoji glued です to the preceding noun, so the original token is e.g. `{t:"仕事中です", p:"名詞/サ変接続", b:"仕事"}` — there is no standalone です token in the text.

2. Your override `["仕事中です", "仕事中::仕事中", "です"]` correctly splits it into two replacement tokens `仕事中` and `です`. But in `src/data/token-overrides.ts`, `parseToken` defaults POS to `"名詞"` whenever no POS is provided in the rule string:

   ```ts
   p: punct ? "記号" : (resolvedPos ?? "名詞"),
   ```

   So your `"です"` replacement becomes `{t:"です", p:"名詞"}` — a Noun.

3. Your separate rule `["です", "です::です:aux"]` is never applied to that output: `applyRules` iterates the input tokens once and pushes replacements straight to `out`, it does not re-match rules against replacement tokens.

Net result: `WordPopup` is called with `pos="名詞"`, `pickBestResult` filters Jisho results for `Noun`, and the copula entry (Copula/Auxiliary verb) is rejected → it falls down to 出洲 "spit (of land) / Dezu".

## Fix

Make `parseToken` leave POS **undefined** when the rule doesn't specify one, instead of defaulting to `"名詞"`. With undefined POS:

- `pickBestResult` skips the POS-filter branch and falls through to "exact surface/reading match", which picks the copula です (first Jisho result whose reading is です) — the correct entry.
- The separate `["です", "です::です:aux"]` rule then becomes redundant, but harmless (it would still apply if a raw です token ever appeared on its own).
- All existing rules that DO specify a POS (`particle`, `aux`, etc.) continue to work unchanged.

### Single change

`src/data/token-overrides.ts`, in `parseToken`:

```ts
// before
p: punct ? "記号" : (resolvedPos ?? "名詞"),

// after
p: punct ? "記号" : resolvedPos,   // undefined when omitted → no POS filter
```

`BookToken.p` is already typed as optional, and `pickBestResult` / `WordPopup` already handle undefined POS. No other file needs to change.

### Optional follow-up (not part of this fix)

If you want `["です", "です::です:aux"]` to also affect *replacement* tokens emitted by earlier rules, we'd need a second pass of `applyRules`. Recommend skipping it — the fix above already solves the reported case and avoids re-entrancy edge cases.