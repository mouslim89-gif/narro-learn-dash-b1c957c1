## Améliorer la détection des verbes/auxiliaires

Extension de la couche de fusion frontend (`src/lib/merge-tokens.ts`). Pas de regénération des tokens des livres nécessaire.

### Cas corrigés

| Entrée | Voulu |
|---|---|
| 信じ + て + いい | 信じて + いい |
| じゃ + ない / なかった / ありません | じゃない… |
| で + は + ない / では + ない | ではない… |
| よう + に / な | ように / ような |
| そう + に / な | そうに / そうな |
| みたい + に / な / だ / です | みたいに… |
| なければ + ならない / いけない | なければならない |
| なくて + は + いけない / ならない | なくてはいけない |
| こと + が + ある / ない | ことがある / ことがない |
| わけ + で + は + ない / わけ + では + ない | わけではない |
| かも + しれない / しれません | かもしれない |
| について / に対して / として / による / によって | groupés |

### Plan technique

**1. Modifier `mergeConjugatedTokens`** (`src/lib/merge-tokens.ts`) :
- Quand on consomme て/で après un verbe tête et que ce qui suit n'est PAS un auxiliaire reconnu, avaler quand même て/で dans le chunk verbe puis s'arrêter. Résultat : `信じて` devient une unité (base = `信じる`), et `いい` reste intact comme token suivant.

**2. Nouvelle passe `gluePhrasalCompounds(tokens)`** appliquée après merge :
- Parcourt la liste, et pour chaque position essaie de matcher (du plus long au plus court) une table de patterns définis par séquence de surfaces exactes.
- Quand match, fusionne en un seul `BookToken` :
  - `t` = concat des surfaces
  - `r` = concat des lectures
  - `b` = forme canonique (ex: `じゃない`, `ではない`, `ように`, `かもしれない`)
  - `j: true`
  - `p` adapté : `助動詞` pour les négations, `副詞` pour ように/そうに/みたいに, `連体詞` pour ような/そうな/みたいな, `表現` pour les autres expressions figées.
- Permet au dictionnaire / GPT grammar de chercher la forme composée directement.

**3. Brancher dans `src/pages/Reader.tsx` (ligne 154)** :
```ts
return gluePhrasalCompounds(mergeConjugatedTokens(cleanRubyTokens(raw)));
```

### Fichiers touchés

- `src/lib/merge-tokens.ts` — étendre la logique て isolé + ajouter `gluePhrasalCompounds` avec table de patterns.
- `src/pages/Reader.tsx` — chaîner la nouvelle passe (1 ligne + 1 import).