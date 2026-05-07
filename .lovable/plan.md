## Problème

Sur le screenshot, le mot いつまでも (kana) est affiché comme « 何時ま... » (kanji) dans la popup. La logique `getDisplayWord` repose uniquement sur le tag « usually written using kana » de Jisho, qui n'est pas toujours présent/fiable.

## Solution proposée

Améliorer `getDisplayWord` dans `src/lib/jisho.ts` pour aussi prendre en compte la **surface réellement rencontrée dans le texte**. Si la surface (ou baseForm) est entièrement en kana et correspond au `reading` du résultat, on affiche la forme kana — peu importe que Jisho ait taggé UK ou non.

### Changements

**1. `src/lib/jisho.ts` — `getDisplayWord`**
- Ajouter un paramètre optionnel `surface?: string`.
- Nouvelle règle (en plus de l'existante UK tag) : si `surface` est fourni, est entièrement en hiragana/katakana, et correspond à un `japanese[].reading`, alors retourner `{ word: reading, reading: undefined }`.

**2. `src/components/WordMiniPopup.tsx`**
- Passer `surfaceForMatch` aux deux appels `getDisplayWord(result)` → `getDisplayWord(result, surfaceForMatch)`.

**3. `src/components/WordPopup.tsx`**
- Idem : passer `surfaceForMatch` aux appels `getDisplayWord`.

### Détails techniques

```ts
const KANA_ONLY = /^[\u3040-\u309F\u30A0-\u30FF\u30FC]+$/;

export function getDisplayWord(result, surface?) {
  if (!result) return { word: '' };
  const j = result.japanese[0];
  if (!j) return { word: '' };

  // Nouveau : surface kana qui matche un reading => kana
  if (surface && KANA_ONLY.test(surface)) {
    const match = result.japanese.find(x => x.reading === surface || x.word === surface);
    if (match?.reading) return { word: match.reading };
  }

  // Existant : tag UK
  if (isUsuallyKana(result) && j.reading) return { word: j.reading };
  return { word: j.word || j.reading, reading: j.reading };
}
```

Aucun changement dans le système de token-overrides ni dans l'edge function.