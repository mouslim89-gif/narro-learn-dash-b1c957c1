## Problème

Dans `WordPopup` et `WordMiniPopup`, on calcule :

```ts
const displayReading = overrideReading || disp.reading;
```

`overrideReading` vient du token Kuromoji et correspond à la lecture de la **forme conjuguée** (ex: 行きました → いきました). Quand le popup affiche le mot **dictionnaire** (`displayWord` = 行く), on lui colle quand même la lecture de la conjugaison → furigana incohérent (行く avec いきました).

## Fix

Dans les deux composants, n'utiliser `overrideReading` que si le mot affiché correspond bien à la surface du token. Sinon, prendre la lecture du dictionnaire.

```ts
const isShowingSurface = displayWord === word;
const displayReading = (isShowingSurface ? overrideReading : undefined) || disp.reading;
```

## Fichiers touchés

- `src/components/WordPopup.tsx` (ligne 257)
- `src/components/WordMiniPopup.tsx` (ligne 166)

Aucun changement de logique métier, aucune nouvelle data. Pure correction d'affichage.
