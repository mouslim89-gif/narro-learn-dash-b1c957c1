## Le bug

Dans le texte, le token est `ひそか` (kana, classé `名詞` par Kuromoji).
Le lookup Jisho de `ひそか` renvoie plusieurs entrées :

1. `密か` — **na-adjective** (le bon mot)
2. `密か事` (みそかごと) — **noun** (un mot rare et différent)
3. …

`pickBestResult` (`src/lib/jisho.ts`) cherche le premier résultat dont le POS correspond au POS Kuromoji. Comme `ひそか` est marqué `名詞`, la règle ne matche que `Noun/Pronoun/Suffix/Prefix`. `密か` (na-adj) est rejeté → on tombe sur `密か事`. Puis `getDisplayWord` affiche `j.word` = `密か事`.

C'est le même type de problème pour tous les na-adjectifs en kana que Kuromoji classe `名詞`.

## Correctifs proposés (à choisir)

### Option A — Étendre le matching POS (recommandé, 1 fichier)

Dans `src/lib/jisho.ts`, pour la règle `名詞`, ajouter `'Na-adjective'`, `'No-adjective'`, `'Adjectival noun'` aux `needles`. Ça suit la réalité linguistique : Kuromoji étiquette beaucoup de na-adj comme noms.

```ts
{ match: (p) => p.startsWith('名詞'),
  needles: ['Noun','Pronoun','Suffix','Prefix','Na-adjective','No-adjective'] },
```

Avantage : règle générale, corrige aussi 静か, 綺麗, 大切, etc.
Risque : très faible (na-adj sont quasi toujours le sens voulu quand Kuromoji dit 名詞).

### Option B — Préférer une entrée dont la forme matche la surface

Avant de regarder le POS, si parmi les résultats il y en a un dont `japanese[0].word === surface` OU `japanese[0].reading === surface`, on le choisit. Ex : pour `ひそか`, on prendrait `密か` (reading=ひそか) avant `密か事` (reading=みそかごと).

Avantage : règle aussi générale, garantit "le mot du popup = le mot du texte".
Inconvénient : nécessite de passer la `surface` à `pickBestResult` (changer la signature, ~3 call-sites).

### Option C — Cap sur le `getDisplayWord`

Si la surface du token est en kana pur et que le résultat trouvé a un `reading` différent → fallback au `reading` (ou rejeter le résultat). Plus défensif mais plus magique.

### Option D — Override manuel via `token-overrides.ts`

Ajouter une règle `ひそか => ひそか@ひそか:形容動詞` pour ce cas précis. Ne corrige que ce mot, pas la cause profonde.

## Recommandation

Combiner **A + B** : A corrige le POS matching trop strict, B garantit que si une entrée a exactement la même forme que le texte elle est préférée. Les deux sont petits et couvrent tous les cas similaires sans toucher à la tokenisation. (note de l'utilisateur, je choisis cette option!)

## Fichiers touchés

- `src/lib/jisho.ts` — modifier `pickBestResult` (et sa signature si Option B) + ajouter `'Na-adjective'` à la règle 名詞.
- `src/components/WordMiniPopup.tsx` + `src/components/WordPopup.tsx` — passer la `surface` au `pickBestResult` (uniquement si Option B).

Dis-moi quelle(s) option(s) tu veux que j'implémente.