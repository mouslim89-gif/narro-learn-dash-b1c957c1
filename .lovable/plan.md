## Problème

Le bouton "Continue without signing in" m'a bien laissé passer côté UI, mais l'edge function `jisho-lookup` exige un JWT utilisateur valide (`requireUser` → `getClaims`). En invité, la requête repart avec la clé anon → `401 Unauthorized` → la recherche renvoie `[]` → "No results found".

C'est ça qui casse le dico, pas le code de recherche/ranking en anglais.

## Correctif

Rendre `jisho-lookup` accessible en invité (lecture publique de dictionnaire, aucune donnée sensible).

### `supabase/functions/jisho-lookup/index.ts`
- Retirer l'appel `requireUser(req, corsHeaders)` (et son import).
- Garder tout le reste à l'identique : CORS, `fetchWord`, batch, `persistLookups` (utilise déjà `adminClient` côté serveur, donc indépendant du caller).

### Rien d'autre à toucher
- `src/lib/jisho.ts` continue d'envoyer la clé anon en `Authorization` quand il n'y a pas de session — Supabase l'accepte pour les fonctions sans `verify_jwt`, et notre check applicatif disparaît.
- `src/lib/romaji.ts` et le ranking dans `Dictionary.tsx` restent inchangés (ils marchaient déjà, le 401 masquait juste tout).

## Vérification
- `curl` direct sur `/functions/v1/jisho-lookup?keyword=cat` avec uniquement l'anon key → 200 + résultats.
- Dans le preview en mode invité : "cat", "super", "neko", "猫" renvoient des résultats correctement classés.
