# Fix : cache dictionnaire pollué (三 → 三人, etc.)

## Diagnostic

La table `dictionary` (cache backend) contient pour `三` les résultats `[三人, 三人組, …]` — aucune entrée pour `三` lui-même. L'API Jisho live renvoie pourtant correctement `三, 三-1, 三つ, 三味線, 三日`.

Le bug n'est donc **pas** dans `pickBestResult` ni dans la priorité aux noms (déjà retirée). C'est juste de la mauvaise data en cache, probablement issue d'un ancien sync où la requête était mal formée. Mêmes symptômes confirmés pour : `一, 二, 四, 五, 七, 九, に, で, と` (tous ont un slug premier composé au lieu du caractère seul).

## Plan

### 1. Détecter les entrées polluées
Une entrée est "polluée" si **aucun** de ses `results[*].japanese[*].word` ni `reading` ne matche exactement le `word` clé. Requête de détection :

```sql
SELECT word FROM dictionary
WHERE NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(entry->'results') r,
              jsonb_array_elements(r->'japanese') j
  WHERE j->>'word' = dictionary.word OR j->>'reading' = dictionary.word
);
```

### 2. Purger ces entrées (migration DELETE)
On les supprime toutes en une fois.

### 3. Re-sync ciblé
Lancer `scripts/sync-dictionary-to-db.ts` qui repassera par `jisho-lookup` et réinsèrera proprement les entrées manquantes.

### 4. Vider le cache mémoire local
Pas de changement de code nécessaire : le live fetch dans `lookupWord` repeuplera à la demande pour les utilisateurs déjà actifs (et `seedCache` ignore déjà les entrées vides depuis le fix précédent). Au prochain `hydrateDictionaryForBook`, les nouvelles entrées propres seront chargées.

## Fichiers touchés

- Nouvelle migration SQL : `DELETE FROM dictionary WHERE …` (la requête ci-dessus)
- Aucun changement de code

## Étapes que je ferai après approbation

1. Créer la migration `DELETE` ciblée
2. Exécuter `scripts/sync-dictionary-to-db.ts` pour repeupler
3. Vérifier en DB que `三` a bien `slug = "三"` en premier
