## Diagnostic

1. **DB pollution** : la table `dictionary` contient `の → {"results": []}` (vérifié via psql).
2. `hydrateDictionaryForBook` seed cette entrée vide dans le cache mémoire au chargement du livre.
3. `getCached('の')` retourne `undefined` (length=0), donc `WordMiniPopup` appelle `lookupWord('の')`.
4. `lookupWord` voit l'entrée existante vide → tente une fetch live → ajoute `'の'` à `liveAttempted`.
5. Si cette fetch live échoue ou retombe sur une réponse vide (timing, rate-limit, retour ancien), la garde `liveAttempted` empêche tout retry futur → l'entrée vide reste collée.
6. `pickBestResult([], …)` → `null` → `setError(true)` → "No definition found".

L'edge function `jisho-lookup` retourne pourtant bien 5 résultats actuellement pour `の` (vérifié via curl direct). Le problème est donc le **cache vide persistant**.

## Solutions

### Option A — Nettoyer la DB + ne plus seeder les entrées vides (recommandé)

**1. Supprimer la ligne polluée en DB :**
```sql
delete from dictionary where word = 'の' and jsonb_array_length(entry->'results') = 0;
-- (étendre à toutes les entrées vides pour nettoyer d'un coup)
delete from dictionary where jsonb_array_length(entry->'results') = 0;
```

**2. Dans `src/lib/jisho.ts` → `seedCache`** : skip les entrées vides pour qu'une mauvaise donnée DB ne pollue jamais le cache mémoire :
```ts
export function seedCache(entries: Record<string, CacheEntry>): void {
  for (const [word, entry] of Object.entries(entries)) {
    if (isKnownStaleEntry(word, entry)) continue;
    if (!entry?.results || entry.results.length === 0) continue; // ← nouveau
    cache.set(word, entry);
  }
}
```

**3. Côté IndexedDB** : idem dans `dictionary-db.ts`, ne pas persister les entrées vides récupérées de Supabase (sinon le client local restera coincé même après cleanup DB) :
```ts
fetched.forEach((entry, word) => {
  if (!entry?.results?.length) return; // skip empty
  fetchedObj[word] = entry;
  idbPairs.push([word, entry]);
});
```

Avantage : robuste contre toute donnée DB pourrie, future-proof.

### Option B — Forcer le retry dans `lookupWord`

Retirer la garde `liveAttempted` pour les entrées vides : toujours retry quand `results.length === 0`. Plus simple mais coût réseau plus élevé sur les vrais "no result" (mots inventés, etc.).

### Option C — Quick fix DB only

Juste supprimer la ligne `の` en DB et invalider le hydrated flag IndexedDB. Le bug reviendra si une autre entrée vide est insérée plus tard.

## Recommandation

**Option A** : nettoyer la DB + filtrer les entrées vides dans `seedCache` ET dans `dictionary-db.ts`. C'est la fix défensive qui empêche toute récidive.

Note : il faudra aussi probablement invalider le flag `book:gyofukuki:hydrated` dans IndexedDB côté user pour forcer un re-fetch propre, ou bumper une version de schéma. Le plus simple : ajouter un check au démarrage qui purge les entrées IDB vides.
