# Romaji-aware search bars

Goal: typing `taberu` finds 食べる, `neko` finds 猫, etc., across all search bars in the app.

## Approach

Use the already-installed `wanakana` library (`toHiragana`, `isRomaji`) to convert romaji input → hiragana before searching. Romaji is only converted when the input looks like pure latin (so English queries like "peach" still work in Library/Flashcards).

A tiny helper in `src/lib/utils.ts` (or a new `src/lib/romaji.ts`):

```ts
import { toHiragana, isRomaji } from 'wanakana';

/** If the query is pure romaji, return its hiragana form; else return null. */
export function romajiToKana(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  // Pure latin letters (+ spaces/'-'): treat as romaji
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return null;
  if (!isRomaji(trimmed)) return null;
  const kana = toHiragana(trimmed, { passRomaji: false });
  return kana && kana !== trimmed ? kana : null;
}
```

## Per-page integration

### 1. `src/pages/Dictionary.tsx` (Jisho search)

- Before calling `searchJisho(query)`, compute `const kana = romajiToKana(query) ?? query;` and pass that.
- The visible input keeps showing the user's original romaji; only the search string is transformed.
- (Optional small UX hint: under the input, if a conversion happened, show `→ たべる` muted text so the user understands what was searched.)

### 2. `src/pages/Flashcards.tsx` (saved words filter)

- In the filter pass at line ~65, build a second query `kana = romajiToKana(q)` and match against `word`, `reading`, and meanings using **either** `q` or `kana`. English meanings still work because English queries don't pass the romaji test.

### 3. `src/pages/Library.tsx` (book title/author filter)

- Same dual-match: keep matching `titleEn`/`author` with the lowercase query, and additionally match `titleJp` against the romaji→kana version. So `momotaro` would match `桃太郎` if such a title's romaji form roughly matches; in practice we just compare `titleJp.includes(kana)`.

## Edge cases handled

- `n` ambiguity: wanakana handles `nn` → ん and `n'` → ん correctly.
- Mixed input (e.g. `食べru`) — fails the pure-latin regex, so it stays as-is.
- English words that happen to be valid romaji (e.g. `sake`, `kite`) — Library/Flashcards search **both** the original English string and the kana form, so English matches keep working.
- Empty / whitespace input — returns null, no change.

## Files touched

- `src/lib/romaji.ts` (new, ~10 lines)
- `src/pages/Dictionary.tsx` (1 line in the debounced effect)
- `src/pages/Flashcards.tsx` (a few lines in the filter)
- `src/pages/Library.tsx` (a few lines in the filter)

No backend changes, no new deps (wanakana already installed).

## Question

Veux-tu que j'affiche un petit indicateur sous la search bar du Dictionary genre `→ たべる` quand une conversion romaji se fait, ou je le garde 100% silencieux ?

&nbsp;

Réponse : non garde ça silencieux 