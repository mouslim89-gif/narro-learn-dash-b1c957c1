## Constat

- `三` n’existe plus dans la table `dictionary`, donc l’app devrait appeler la fonction live et recevoir la bonne entrée `三`.
- `一` est correct en base (`一`, `一つ`, etc.), mais si l’app affiche encore `一歩`, c’est très probablement l’ancien cache IndexedDB du navigateur qui reste utilisé.
- Le problème peut donc revenir tant que le cache local garde des entrées polluées, même après nettoyage de la base.

## Plan recommandé

1. **Validation stricte du cache local**
   - Modifier `seedCache` / `getCached` pour refuser une entrée si aucun résultat ne correspond au mot demandé (`word` ou `reading`).
   - Ça empêche une vieille entrée IndexedDB `三 → 三人` ou `一 → 一歩` d’être utilisée.

2. **Fallback live automatique**
   - Si une entrée cache est invalide pour le mot demandé, la traiter comme un miss.
   - L’app appellera alors `jisho-lookup` et récupérera les résultats corrects.

3. **Ne pas marquer le livre “hydrated” trop tôt**
   - Ajuster `hydrateDictionaryForBook` pour ne pas ignorer les mots manquants simplement parce que le livre est déjà marqué hydraté.
   - Ça évite qu’un mot supprimé/corrigé en base ne soit jamais refetch côté client.

4. **Purge ciblée côté navigateur**
   - Option économique : ajouter une version de cache dictionnaire (`dictCacheVersion`) et invalider uniquement l’ancien IndexedDB une fois.
   - Ça force tous les utilisateurs à repartir sur les données propres sans leur demander de vider le cache manuellement.

5. **Vérification**
   - Tester `三` et `一` via la fonction dictionnaire.
   - Vérifier que le code sélectionne `三` et `一`, pas `三人` / `一歩`.

## Détail technique

- Fichiers concernés :
  - `src/lib/jisho.ts`
  - `src/lib/dictionary-db.ts`
- Pas besoin de modifier le schéma de base.
- Pas besoin de purger plus largement la table maintenant : la fonction live renvoie déjà les bonnes données pour `三` et `一`.