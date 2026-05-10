## Problème observé

Quand tu modifies un token (ex. merge `一緒に`) :
- ✅ Application immédiate : OK
- ❌ Après logout / changement de compte : règles invisibles
- ❌ Après reconnexion sur le compte admin : règles toujours pas appliquées

## Diagnostic

J'ai vérifié la base : ta règle `["一緒|に", "一緒に:いっしょに:一緒に"]` (scope `*`) **est bien sauvée** pour ton user admin. Le problème est donc côté client, dans `src/stores/user-rules.ts` et `src/contexts/AuthContext.tsx`.

Trois bugs combinés :

1. **Aucun reset sur logout.** `resetForLogout()` existe mais n'est jamais appelé. Le store Zustand est persisté dans `localStorage` (clé `user-token-rules-v1`) avec `saved` ET `pending`. Quand tu changes de compte :
   - Les règles d'un user restent visibles brièvement pour l'autre.
   - À la reconnexion admin, `loadFromCloud` est appelé, mais il ne reset que `saved[bookId]` et `saved['*']` — les autres scopes restent pollués par l'ancienne session.

2. **`loadFromCloud` ne se redéclenche pas correctement.** Le `useEffect` dans `Reader.tsx` dépend de `[user, id, loadFromCloud]`. Si tu reviens sur un livre déjà ouvert avant le logout, `id` n'a pas changé et `user` peut être considéré stable selon le timing de l'auth listener — les règles fraîches du cloud ne sont pas re-pull.

3. **`applyPending` peut perdre l'état local.** L'upsert utilise `onConflict: 'user_id,book_id'` mais l'index unique réel est `md5(rule::text)`. Quand l'upsert "réussit" sans matcher l'index, il peut renvoyer `data = []`. Résultat : `pending` est vidé, `saved` n'est pas mis à jour, et l'affichage perd la règle jusqu'au prochain `loadFromCloud`.

## Plan de correction

### 1. `src/stores/user-rules.ts`
- **Ne plus persister `saved`** dans `localStorage` (garder seulement `pending` pour ne pas perdre les drafts non sauvegardés). Le cloud devient l'unique source de vérité pour `saved`.
- Dans `loadFromCloud`, **remplacer entièrement `saved`** (pas un merge partiel) pour éliminer les résidus inter-users.
- Réécrire `applyPending` : remplacer l'upsert ambigu par un `insert(...).select(...)`. En cas d'erreur de duplicat (`23505`), fallback sur un `loadFromCloud` complet pour resync.

### 2. `src/contexts/AuthContext.tsx`
- Dans `onAuthStateChange`, détecter `SIGNED_OUT` et `SIGNED_IN` (changement d'`user.id`) et appeler `useUserRulesStore.getState().resetForLogout()` avant de laisser le nouveau user déclencher son propre `loadFromCloud`.

### 3. `src/pages/Reader.tsx`
- Dans le `useEffect` de chargement, dépendre explicitement de `user?.id` (au lieu de l'objet `user`) pour garantir le re-pull à chaque changement de compte.
- Forcer `loadFromCloud` à attendre la fin avant de calculer `tokens` (afficher un état "chargement règles…" optionnel, ou juste accepter le re-render quand `savedRules` change — déjà le cas).

### 4. (Optionnel) Realtime sync
Comme déjà fait pour `flashcards` et `reading_progress` dans `src/lib/sync/cloud-sync.ts`, ajouter un canal Realtime sur `user_token_rules` filtré par `user_id`, pour que les modifications faites sur un autre appareil arrivent en direct.

## Résultat attendu

- Logout → store vidé immédiatement.
- Login (n'importe quel compte) → pull depuis le cloud, état propre.
- Sauvegarde d'une règle → insert direct, `saved` mis à jour de manière fiable, `pending` vidé seulement si l'insert a réussi.
- Multi-appareils → propagation en temps réel (si on ajoute le point 4).

Veux-tu que j'inclue le point 4 (Realtime) dans l'implémentation ou on garde ça pour plus tard ?