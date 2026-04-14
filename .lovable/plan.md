

## Supprimer le temps de chargement des phrases d'exemple

### Problème
Chaque phrase est récupérée individuellement via l'API Tatoeba au montage du composant, ce qui crée un délai visible avec des skeletons de chargement.

### Solutions proposées

**Option recommandée : Cache en base de données**

Stocker les phrases récupérées dans une table Supabase. Le flux devient :
1. Vérifier si la phrase existe déjà en base → réponse instantanée
2. Si non, appeler Tatoeba, stocker le résultat en base, puis retourner
3. Les appels suivants pour le même mot sont instantanés (~50ms vs ~1-2s)

Avantage : après la première consultation, toutes les phrases sont instantanées. Le cache se remplit naturellement avec l'usage.

### Plan technique

**1. Migration DB** — Créer une table `example_sentences`
- Colonnes : `word` (text, primary key), `japanese` (text), `english` (text), `created_at`
- Pas de RLS (données publiques, pas liées à un utilisateur)

**2. Modifier `supabase/functions/tatoeba-example/index.ts`**
- Vérifier d'abord dans la table `example_sentences`
- Si trouvé → retourner immédiatement
- Sinon → appeler Tatoeba, insérer en base, retourner le résultat

**3. Optionnel : prefetch batch**
- Quand les résultats de recherche arrivent dans Dictionary.tsx, lancer le fetch de toutes les phrases en parallèle (pas séquentiellement au montage de chaque composant)

### Fichiers à modifier
1. Migration SQL — nouvelle table `example_sentences`
2. `supabase/functions/tatoeba-example/index.ts` — ajout du cache DB
3. `src/pages/Dictionary.tsx` — prefetch parallèle (optionnel)

