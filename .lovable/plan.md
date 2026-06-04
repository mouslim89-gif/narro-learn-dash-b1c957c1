## Bug
In `src/pages/Reader.tsx` (lines ~380-411), the sentence splitter flushes on every `。`/`！`/`？` regardless of context. When such a character appears inside 「…」 / 『…』 quotes (e.g. `太郎は「かわいそうに。だれかが…」と言った。`), the splitter breaks mid-quote, so translation mode sends `太郎は「かわいそうに。` as a standalone sentence.

## Fix
Track quote depth inside the `sentences` `useMemo` and only flush on terminal punctuation when `quoteDepth === 0`. Newline-driven flushes stay unchanged (paragraph layer already protects quoted spans).

Pseudocode:
```ts
let quoteDepth = 0;
const updateDepth = (text: string) => {
  for (const ch of text) {
    if (ch === '「' || ch === '『') quoteDepth++;
    else if ((ch === '」' || ch === '』') && quoteDepth > 0) quoteDepth--;
  }
};

tokens.forEach((token) => {
  // ...existing newline handling unchanged...
  current.push(token);
  updateDepth(token.t);
  const hasTerminal = /[。！？]/.test(token.t);
  if (hasTerminal && quoteDepth === 0) flush(false);
});
```

No other change. Translation cache keys stay valid because previously-split fragments will simply merge into the correct full sentence going forward; old cached partial entries become unused (harmless).

## File
- `src/pages/Reader.tsx` — update the `sentences` `useMemo`.
