## Format ultra-court

Chaque règle = un tableau : `[match, ...replace]`.
- `match` : string `"a|b|c"` (tokens du texte séparés par `|`)
- chaque `replace` : string `"surface:reading:base"` (reading et base optionnels)
- Pour la ponctuation : préfixe `!` → `"!。"`

```ts
export const tokenOverrides: Record<string, Rule[]> = {
  "*": [
    ["何|も", "何も:なにも"],
    ["お",   "お:お:御"],     // ← affiché "お", lu "お", dico cherche "御"
  ],
  urashima: [
    ["りょう|し", "漁師:りょうし"],
  ],
};
```

Règles de parsing :
- `surface` toujours obligatoire (1er champ avant `:`)
- `reading` (2e champ) → `r`
- `base` (3e champ) → `b` (= ce que le dico cherche)
- POS par défaut `名詞` ; `j: true` sauf si surface commence par `!`

Pour multi-tokens en sortie : on ajoute simplement plus de strings dans le tableau.
```ts
["桜|の|樹", "桜:さくら", "の", "樹:き"]
```

## Bug `お → 尾`

Avec `["お", "お:お:御"]`, le token reçoit `b="御"` → lookup Jisho cherche `御` directement, plus de collision avec 尾.

## Fichiers touchés

- `src/data/token-overrides.ts` — réécrit (~40 lignes total avec parser mini).
- Reader.tsx inchangé (signature `applyTokenOverrides(bookId, tokens)` conservée).

## Détails techniques

Type :
```ts
type Rule = [match: string, ...replace: string[]];
```

Parser d'un replace string :
```ts
function parse(s: string): BookToken {
  const punct = s.startsWith("!");
  if (punct) s = s.slice(1);
  const [t, r, b] = s.split(":");
  return { t, j: !punct, ...(r && { r }), ...(b && { b }), p: punct ? "記号" : "名詞" };
}
```
