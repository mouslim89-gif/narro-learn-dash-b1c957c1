## Objectif

Éliminer le spinner "Looking up…" sur les tokens issus de règles de merge (auto ou règles partagées). Aujourd'hui les shards `public/dict/<key>.json` sont générés à partir des tokens **bruts** de `book-tokens.ts` → les surfaces fusionnées (`九時`, `ように`, `について`, `かもしれない`, …) n'y figurent pas, donc tap = aller-retour edge function.

## Approche

Au moment de la génération des shards, on simule exactement le pipeline de merge du runtime, on collecte les surfaces/bases finales, puis on fetch leurs entrées dictionnaire.

## Modifications

### 1. `scripts/generate-dictionary-shards.ts`

Refondre la collecte des mots :

- Importer dynamiquement (via `tsx`/`bun`) :
  - `mergeConjugatedTokens`, `gluePhrasalCompounds`, `mergeCounterCompounds`, `splitNoParticleNouns` depuis `src/lib/merge-tokens.ts`
  - `applyRules` + `tokenOverrides` depuis `src/data/token-overrides.ts`
- Fetch toutes les `shared_token_rules` depuis Supabase (table publique en lecture).
- Pour chaque key (`bookId` ou `bookId__chapterId`) :
  1. Reconstruire la liste de tokens à partir de `bookTokens[key][difficulty]` (boucle sur les difficultés comme aujourd'hui).
  2. Appliquer dans cet ordre, exactement comme `Reader.tsx` :
     - `splitNoParticleNouns`
     - `mergeConjugatedTokens`
     - `gluePhrasalCompounds`
     - `mergeCounterCompounds`
     - `applyRules([...sharedRules[bookId], ...sharedRules['*'], ...tokenOverrides[bookId], ...tokenOverrides['*']], tokens)`
  3. Collecter `tok.t` + `tok.b` pour chaque token avec `j === true`.
- Fetch `dictionary` pour ces mots (déjà fait).
- **Nouveau** : pour les mots **absents** de la table `dictionary` (typiquement les surfaces fusionnées comme `九時` qui ne sont jamais passées par le runtime), appeler l'edge function `jisho-lookup?keyword=...` au build, et :
  - inclure le résultat dans le shard,
  - upserter dans la table `dictionary` (warm le cache global, évite de re-fetcher).

### 2. Régénération automatique

Dans la doc / `package.json`, rappeler que `bun run build:dict` doit être relancé après :
- ajout d'un nouveau livre,
- ajout/modification d'une `shared_token_rule` (admin).

Optionnel (pas dans ce plan, à proposer ensuite) : un trigger Supabase ou un job qui appelle un endpoint quand `shared_token_rules` change pour forcer la régénération côté CI.

### 3. Pas de changement runtime

`hydrateDictionaryFromShard` et `WordMiniPopup` restent identiques — ils profiteront automatiquement des nouvelles entrées dans le shard.

### Cas non couverts (acceptés)

- **Règles purement personnelles** (`user_token_rules` d'un user) : restent un lookup live au premier tap. Rare en pratique. Si gênant plus tard, on ajoute un warm-cache à l'application de la règle (option B précédente).

## Vérification

- Relancer `bun run build:dict`, vérifier que `public/dict/asa.json` contient une entrée pour `九時` (et autres merges connus comme `ように`, `について`).
- Dans le Reader, taper sur `九時` → résultat instantané, plus de spinner.
- Inspecter Network : aucun appel à `jisho-lookup` au tap.
