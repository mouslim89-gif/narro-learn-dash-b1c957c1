## Problème

`呑めそうな` (forme "looks like one can drink") est tokenisée par Kuromoji en :

- `呑め` — 動詞/自立 (stem potential)
- `そう` — **名詞,特殊,助動詞語幹** (PAS dans `MERGEABLE_POS_PREFIXES`)
- `な` — 助動詞 (連体形 de だ)

La fusion verbale (`mergeConjugatedTokens`) s'arrête à `呑め` car `そう` n'est pas reconnu comme auxiliaire mergeable. Ensuite le pattern phrasal `['そう','な']` colle `そうな` ensemble. On finit avec `[呑め, そうな]`, et `そうな` est cliquable seul → définition de `な` / `そう`.

Même problème pour `〜たい`, `〜らしい`, `〜そうだ`, `〜そうに`, `〜たがる`.

## Solution

Étendre `mergeConjugatedTokens` avec un set d'**auxiliaires « pseudo-nominaux »** reconnus par leur **surface form**, qui se collent à un verbe/adjectif tête même quand Kuromoji les tague `名詞`.

```ts
// Auxiliaries Kuromoji tags as 名詞,特殊,助動詞語幹 — match by surface
const AUX_PSEUDO_NOUN = new Set(['そう', 'よう', 'たい', 'らしい', 'みたい']);

function isAuxPseudoNoun(tok: BookToken): boolean {
  return AUX_PSEUDO_NOUN.has(tok.t) &&
         (tok.p?.startsWith('名詞') || tok.p?.startsWith('助動詞'));
}
```

Dans la boucle interne de `mergeConjugatedTokens`, ajouter une branche : si `next` matche `isAuxPseudoNoun`, on l'absorbe et on continue la fusion (ce qui permet ensuite d'avaler `な`/`だ`/`に` 助動詞 qui suivent via la branche `isMergeableAux` existante).

Résultat pour `呑めそうな` :
- merge tête `呑め` (base `呑む`, pos `動詞/自立`)
- absorbe `そう` (pseudo-aux)
- absorbe `な` (助動詞) → token unique `呑めそうな`, base `呑む`, pos `動詞/自立`.

Cliquer dessus lookup `呑む` → bonne définition. Le label de conjugaison dans `WordPopup` affichera "Dictionary form: 呑む" (à terme on pourra ajouter un label dédié `〜そうな` mais hors scope).

## Effets de bord à vérifier

- Patterns phrasaux `['そう','な']`, `['よう','な']`, `['みたい','な']` : ils s'appliquent **après** la fusion verbale, donc seuls les cas où そう/よう/みたい ne suivent PAS un verbe restent (ex: `本当のような` avec の avant). OK, comportement préservé.
- `〜たい` (auxiliaire désir) : déjà 助動詞 normalement, mais certains cas le taguent 形容詞 — `isHead` matche déjà 形容詞, donc pas de régression.
- Il faut s'assurer que `そう` ne soit absorbé que **directement** après une tête verbe/adj (pas après un nom indépendant). Comme on est dans la boucle interne déclenchée par `isHead`, c'est garanti.

## Fichier modifié

- **`src/lib/merge-tokens.ts`** : ajout de `AUX_PSEUDO_NOUN` + `isAuxPseudoNoun`, et nouvelle branche dans la boucle de `mergeConjugatedTokens` (avant la branche `isTeParticle`).

## Variantes possibles (à choisir)

1. **Approche surface-set** (proposée ci-dessus) — simple, ciblée, faible risque.
2. **Approche POS-élargie** : ajouter `'名詞,特殊,助動詞語幹'` à `MERGEABLE_POS_PREFIXES` → plus générique mais risque de manger des noms légitimes mal tagués.
3. **Approche phrasal pattern** : ajouter des patterns `[{verbHead}, 'そう', 'な']` etc. → multiplie les patterns, plus verbeux.

Je recommande la **variante 1**. OK pour partir là-dessus ?