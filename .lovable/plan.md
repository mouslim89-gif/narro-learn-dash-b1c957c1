## Objectif

Pour les mots habituellement écrits en kana (ex: `あの`, `する`, `いる`, `こと`, `もの`…), afficher la forme kana au lieu du kanji (`彼の`, `為る`, `居る`, `事`, `物`) dans les popups, le mini-popup, et le dictionnaire.

## Détection

Jisho marque ces mots avec le tag `"Usually written using kana alone"` dans les `senses[].parts_of_speech` (ou parfois `misc`). On crée un helper unique :

```ts
// src/lib/jisho.ts
export function isUsuallyKana(result: JishoResult): boolean {
  return result.senses.some(s =>
    s.parts_of_speech.some(p => /usually written using kana/i.test(p))
  );
}

export function getDisplayWord(result: JishoResult): { word: string; reading?: string } {
  const j = result.japanese[0];
  if (!j) return { word: '' };
  if (isUsuallyKana(result) && j.reading) {
    // reading devient le "word", on n'affiche plus de reading séparée
    return { word: j.reading };
  }
  return { word: j.word || j.reading, reading: j.reading };
}
```

## Application

3 endroits remplacent l'accès direct à `result.japanese[0]?.word` par `getDisplayWord(result)` :

1. **`src/components/WordPopup.tsx`** (lignes ~247-277) — `displayWord` / `displayReading`. Si kana-only, ne pas afficher la "reading" en double.
2. **`src/components/WordMiniPopup.tsx`** (lignes ~160-211) — header word + reading sous le titre. Même logique : pas de reading si kana-only.
3. **`src/pages/Dictionary.tsx`** (lignes ~111-126) — affichage du mot + reading dans la liste de résultats.

Pour la sauvegarde en flashcards (`handleSave`) : on stocke `word = reading` quand kana-only, pour que la flashcard montre aussi `あの` plutôt que `彼の`.

## Ce qui n'est PAS modifié

- Le texte dans le Reader (le token original tel qu'écrit dans le livre est conservé — si l'auteur écrit `彼の` on garde `彼の`, on ne réécrit pas le livre).
- La recherche / lookup (on continue à chercher par n'importe quelle forme).
- Le `dictForm` passé à `ConjugationTable` reste la forme canonique kanji (sinon les conjugaisons cassent).

## Risques / edge cases

- Certains résultats ont `Usually written using kana` sur le sens 2 mais pas le sens 1 → on considère kana-only seulement si **le premier sens** le porte (plus fiable). Ajustable.
- Mots sans `reading` (rare) → fallback sur `word`.

Veux-tu que j'applique aussi ce comportement aux flashcards déjà sauvegardées (migration), ou seulement aux nouvelles ?