## Constat

Deux bugs liés aux nombres :

1. **`三四百米` reste un seul token** — Kuromoji groupe les chiffres consécutifs (名詞/数 + 名詞/接尾) en une chaîne unique via `mergeTokens` (suffixes nominaux fusionnés). Résultat : un seul gros token cliquable au lieu de 4 (`三` `四` `百` `米`).

2. **Clic sur `三` renvoie `三つ`** — Dans `pickBestResult` (`src/lib/jisho.ts`), pour un token POS `名詞/数` :
   - La règle `名詞` cherche `Noun`/`Pronoun`/`Suffix`… dans les `parts_of_speech` Jisho.
   - Le 1er résultat `三` n'a que `Numeric` → exclu du filtre POS.
   - Le 2e résultat `三つ` a `Noun` → matche → retourné.
   - Même bug pour `一`/`二`/`百` etc.

## Plan

### 1. Splitter les séquences numériques (token-level)

Dans `scripts/generate-tokens.ts` :
- Ajouter une passe **post-merge** qui détecte tout token dont le texte est composé uniquement de kanji/chiffres numériques (`一二三四五六七八九十百千万億兆〇零` + `０-９`) **et** dont le POS est `名詞/数` ou contient `数`.
- Éclater ce token en un token par caractère, chacun avec :
  - `t` = le caractère
  - `r` = lecture par défaut (`さん`, `し`, `ひゃく`, `べい` pour `米` etc.) — utiliser une petite map kanji→on'yomi numérique
  - `p = '名詞/数'`
- Cas spécial : `米` (mètre, suffixe d'unité) → garder mais comme token séparé avec sa lecture.
- Régénérer `book-tokens.ts` via `npx tsx scripts/generate-tokens.ts`.

**Variante** : laisser le merger Kuromoji gérer la fusion mais empêcher la fusion quand la séquence ne forme pas un nombre lexicalisé (plus complexe, rejeté).

### 2. Fix `pickBestResult` pour les numériques

Dans `src/lib/jisho.ts`, ajouter une règle POS dédiée :

```ts
{ match: (p) => p.includes('数'), needles: ['Numeric', 'Counter', 'Noun'] }
```

placée **avant** la règle générique `名詞`. Ainsi pour token POS `名詞/数` + surface `三` :
- Filtre POS retient `Numeric` → résultats `三` (Numeric), `三つ` (Numeric+Noun)…
- Match exact surface `三` → renvoie l'entrée `三`.

Bonus : ça résout aussi `一`→`一つ`, `百`→`百貨店`, etc.

### 3. Vérification

- Recharger Reader sur `gyofukuki/original` : `三四百米` doit afficher 4 tokens cliquables.
- Cliquer `三` → popup "three / さん", pas `三つ`.
- Vérifier `一`, `二`, `百` ailleurs dans les livres.
- Tests : aucun snapshot existant à casser, mais `book-tokens.ts` change → diff volumineux attendu.

### Fichiers modifiés

- `scripts/generate-tokens.ts` (ajout passe split numérique)
- `src/data/book-tokens.ts` (régénéré)
- `src/lib/jisho.ts` (règle POS Numeric)

Pas de changement DB ni edge function.

## Question

Pour la lecture par défaut des kanji numériques splittés, tu préfères :
- **(a)** lecture on'yomi simple (`三`→さん, `四`→し, `百`→ひゃく) — simple, parfois "faux" en contexte (ex. `四百` se lit `よんひゃく`)
- **(b)** pas de furigana sur les chiffres splittés, l'utilisateur se réfère au popup
- **(c)** garder la lecture totale sur le 1er kanji (`三四百米`→`さんしひゃくべい` sur `三`) et rien sur les autres

Je recommande **(a)** : pragmatique et le clic donne la vraie définition.