# Règles de tokens partagées (admin → tous les comptes)

## Problème actuel
La table `user_token_rules` est filtrée par RLS sur `auth.uid() = user_id`. Donc une règle créée par ton compte admin (même avec `book_id = '*'`) reste invisible pour les autres comptes connectés. C'est pourquoi `一緒に` ne s'applique nulle part ailleurs.

## Solution
Introduire une **2ᵉ source de règles**, "shared rules" (règles publiées), gérées uniquement par les admins, lues par tout le monde (même non connecté). Les règles personnelles `user_token_rules` restent intactes pour la flexibilité par utilisateur.

## Côté base

Nouvelle table `public.shared_token_rules` :
- `book_id text` (ou `'*'` pour global)
- `rule jsonb`
- `position int`
- `created_by uuid` (admin auteur, audit)

Sécurité :
- RLS activée
- SELECT public (true) → toute l'app peut lire, même invité
- INSERT / UPDATE / DELETE réservés aux admins via une **table `admin_users`** + fonction `is_admin(uid)` SECURITY DEFINER (pattern recommandé, évite de hardcoder l'email côté DB)
- Seed : insérer ton `auth.uid()` dans `admin_users`

Migration des règles existantes :
- Copier toutes les lignes de `user_token_rules` où `user_id = <ton uid admin>` ET `book_id = '*'` vers `shared_token_rules`
- (Optionnel) supprimer ces lignes de `user_token_rules` pour éviter doublon

Index unique : `(book_id, md5(rule::text))`.

## Côté front

1. **`src/lib/admin.ts`** : ajouter un hook `useIsAdminAsync` basé sur la table `admin_users` (et garder `ADMIN_EMAILS` en fallback côté UI).

2. **Nouveau store `src/stores/shared-rules.ts`** :
   - `saved: Record<scope, SharedRule[]>`
   - `loadShared()` — appelé au mount de Reader, sans dépendance au user
   - `addShared(scope, rule)` / `deleteShared(id, scope)` — admin uniquement (RLS bloquera sinon)

3. **`src/pages/Reader.tsx`** :
   - Charger les règles partagées au mount (indépendamment du login)
   - Combiner dans l'ordre : `applyTokenOverrides` → règles **partagées** (book + `*`) → règles **perso** saved (book + `*`) → règles perso pending
   - `useEffect` réagit aussi à `sharedRules`

4. **`src/components/TokenEditPanel.tsx`** :
   - Switch "Apply globally" devient un sélecteur 3 options pour les admins :
     - `Ce livre (perso)` → user_token_rules / book
     - `Tous mes livres (perso)` → user_token_rules / `*`
     - `Publier pour tous les comptes` (admin only) → shared_token_rules / book ou `*`
   - Pour non-admin, le switch reste binaire perso book/global perso.

5. **`src/components/TokenEditFloatingBar.tsx`** :
   - Onglet supplémentaire "Shared" affichant les règles publiées
   - Bouton suppression visible seulement pour les admins (RLS appliquera quand même la sécurité)
   - "Apply" envoie chaque pending vers la bonne table selon son scope encodé

6. Encoder le scope dans le pending : changer la clé de pending de `string` à `{ table: 'user'|'shared', scope: string }` (ou préfixe `shared:bookId`). Petite refacto de `addPending` / `applyPending`.

## Détails techniques

```text
applyRules order in Reader:
  base tokens
    → applyTokenOverrides (hardcoded book overrides)
    → shared rules for book_id
    → shared rules for "*"
    → user saved rules for book_id
    → user saved rules for "*"
    → user pending rules (book + *)
```

Suppression admin d'une règle partagée → DELETE sur `shared_token_rules` → la règle disparaît immédiatement pour tous les comptes au prochain `loadShared()` (au prochain ouverture de livre, ou via Realtime si on l'ajoute plus tard).

## Hors scope (à proposer ensuite si tu veux)
- Sync Realtime sur `shared_token_rules` pour propagation immédiate sans recharger
- Versioning / historique des règles publiées
