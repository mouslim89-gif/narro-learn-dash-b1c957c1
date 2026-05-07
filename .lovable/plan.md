## Problème

Override `["で|ある", "である::である"]` → token résultant a `p: "名詞"` (défaut forcé dans `parseToken`).
Dans `pickBestResult`, le filtre POS sur "Noun" rejette l'entrée Copula `である` et garde `である体` (Noun).

Même bug structurel que の : le défaut `名詞` dans `parseToken` casse les overrides qui ne précisent pas de POS.

## Solutions possibles

### Option A — Retirer le défaut `名詞` dans `parseToken` (recommandé)

Dans `src/data/token-overrides.ts`, ligne 78 :
```ts
p: punct ? "記号" : (resolvedPos ?? "名詞"),
```
→
```ts
...(punct ? { p: "記号" } : resolvedPos ? { p: resolvedPos } : {}),
```

Comme ça, sans POS spécifié, aucun filtre POS n'est appliqué et `pickBestResult` choisit par surface match → `である` (Copula) en premier.

Avantage : règle générale, fix tous les overrides futurs sans POS.
Risque : si d'autres tokens dépendent du défaut 名詞 implicite — à vérifier mais peu probable vu que sans POS, `pickBestResult` tombe sur le premier surface match, ce qui est le comportement le plus naturel.

C'est d'ailleurs la fix qui avait été faite pour le bug の précédent mais qui a été perdue.

### Option B — Spécifier le POS dans l'override

Remplacer `["で|ある", "である::である"]` par `["で|ある", "である:::aux"]`.
`aux` → `助動詞` → matche "Auxiliary, Copula, Particle" dans `POS_KEYWORDS`.

Avantage : ciblé, pas de changement de la logique.
Inconvénient : il faudra le faire à chaque override, le bug reviendra.

### Option C — Faire les deux

Retirer le défaut `名詞` (Option A) **et** taguer explicitement les particules/copules comme `である:::aux` et `の:::particle` quand on veut forcer le POS. Plus robuste.

## Recommandation

**Option A** : c'est la fix qui a déjà été identifiée auparavant pour le bug de の (cf. l'historique du chat) mais qui semble avoir été reperdue. Le défaut `名詞` est la source de récidive. Une fois retiré, on peut aussi simplifier l'override de の en `["の", "の"]` ou même le supprimer si pas nécessaire.
