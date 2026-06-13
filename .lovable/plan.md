# Two dictionary bugs

## 1. "Cat" → 猫 ねこま (nekoma) instead of ねこ (neko)

**Root cause.** Jisho actually returns two entries that contain 猫:
- `猫` (common): senses = `["cat (esp. the domestic cat, Felis catus)", ...]` → scored **1** by `rankByRelevance` (only a `\bcat\b` substring match, not an exact "cat").
- `猫-1` (uncommon, archaic): senses = `[["cat"]]` → scored **3** (exact match). Its first japanese entry is `{word:"猫", reading:"ねこま"}`.

So `猫-1` wins the rerank, and the card renders the kanji 猫 with reading ねこま. It's a real Jisho entry, just an obscure archaic reading that shouldn't outrank the common 猫/ねこ.

**Fix in `src/pages/Dictionary.tsx` → `rankByRelevance`:**
1. Treat a definition that **starts with the query followed by space, `(`, `[`, or end** as an exact match (score 3). This catches `"cat (esp. the domestic cat…)"` → 3.
2. Add `is_common` as a tie-breaker after the score so common entries float to the top when scores tie.

Result for "cat": 猫 (common, score 3) ranks above 猫-1 (uncommon, score 3).

## 2. 超絶 rendered vertically (one kanji per line)

**Root cause.** In `src/pages/Dictionary.tsx`, the title row is:

```tsx
<div className="flex items-center gap-1.5 pr-12">
  <p className="font-japanese text-xl font-bold">{word}</p>
  <span className="font-japanese text-sm text-muted-foreground">{reading}</span>
  <span className="text-xs italic">{toRomaji(reading)}</span>
  <PlayWordButton ... />
</div>
```

On a 360px viewport, `超絶 + ちょうぜつ + chouzetsu + 🔊` overflows. Because nothing has `whitespace-nowrap` or `flex-shrink-0`, the browser breaks every text node character-by-character — kanji and kana both go vertical.

**Fix:**
- Add `flex-wrap` to the row so overflow wraps onto a new line instead of breaking inside words.
- Add `whitespace-nowrap` (and `shrink-0` for the kanji) to the three text spans so each one stays on a single line.
- Keep the reading + romaji together so they wrap as a unit below the kanji when space is tight.

Concretely:
```tsx
<div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pr-12">
  <p className="font-japanese text-xl font-bold whitespace-nowrap shrink-0">{word}</p>
  <div className="flex items-center gap-1.5 flex-wrap">
    {reading && reading !== word && (
      <span className="font-japanese text-sm text-muted-foreground whitespace-nowrap">{reading}</span>
    )}
    {reading && (
      <span className="text-xs text-muted-foreground/70 italic whitespace-nowrap">{toRomaji(reading)}</span>
    )}
    <span onClick={(e) => e.stopPropagation()}>
      <PlayWordButton word={word} reading={reading} size={16} />
    </span>
  </div>
</div>
```

## Scope
Only `src/pages/Dictionary.tsx`. No edge function or store changes. Same fix path applies to both result cards on the Dictionary page.
