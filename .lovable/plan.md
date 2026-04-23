

# Système de comptes + sync cloud

## Vue d'ensemble

L'app passera de "100% local" à "login obligatoire avec sync background". Les **flashcards** et la **progression de lecture** seront liées au compte. Les **préférences UI** (dark mode, font, furigana) restent locales par device.

Login proposé : **Apple + Google + Email/mot de passe**.

## UX

- **Écran de login** affiché dès le démarrage si non connecté (3 boutons : Apple, Google, Email).
- **Email** : signup avec vérification + reset password (page dédiée `/reset-password`).
- **Settings** : nouvelle section "Compte" avec email affiché + bouton "Sign out" + "Delete account".
- **Indicateur de sync** discret dans la BottomNav (petit point qui clignote pendant la sync, croix rouge si erreur).
- **Première connexion** : si des données locales existent déjà (cas où l'utilisateur a utilisé l'app avant), elles sont écrasées par les données cloud (cohérent avec "login obligatoire").

## Architecture sync : Local-first + background push

```text
User action → Zustand (instant UI) → debounce 1.5s → push to Supabase
                                                    ↓
                                          Realtime channel ← autres devices
```

- **Lecture** : au login, on hydrate Zustand depuis Supabase (1 requête par store).
- **Écriture** : Zustand reste source de vérité côté UI. Un middleware custom déclenche un push debouncé (1.5s) vers Supabase.
- **Multi-device** : abonnement Realtime par user_id → réconciliation par `updated_at` (last-write-wins, suffisant pour ce use case mono-utilisateur multi-device).
- **Offline** : Zustand persist conserve tout. Une queue d'opérations en attente est rejouée à la reconnexion.

## Schéma DB

**Table `profiles`** (auto-créée par trigger sur signup) :
- `id` (uuid, FK auth.users, PK)
- `email`, `display_name`, `created_at`

**Table `flashcards`** :
- `id` (text, PK composite avec user_id) — réutilise l'`id` Jisho actuel
- `user_id` (uuid, FK auth.users)
- `word`, `reading`, `meanings` (jsonb), `jlpt` (jsonb), `parts_of_speech` (jsonb), `context_sentence`
- `mastery` (int), `last_reviewed_at`, `next_review_at`
- `created_at`, `updated_at`
- PK : `(user_id, id)`

**Table `reading_progress`** :
- `user_id` (uuid, FK auth.users)
- `book_id` (text), `difficulty` (text)
- `progress_percent` (int), `last_read_at`
- `created_at`, `updated_at`
- PK : `(user_id, book_id)` — une seule progression par livre, même si l'utilisateur change de difficulté

**RLS** : chaque table → `user_id = auth.uid()` pour SELECT/INSERT/UPDATE/DELETE.

**Trigger** : `on_auth_user_created` → insère une ligne dans `profiles`.

## Fichiers à créer

- `src/contexts/AuthContext.tsx` — provider exposant `user`, `session`, `loading`, helpers `signOut()`. Setup de `onAuthStateChange` AVANT `getSession()`.
- `src/pages/Auth.tsx` — UI avec 3 boutons OAuth + form email (toggle Sign in / Sign up) + lien "Forgot password".
- `src/pages/ResetPassword.tsx` — page publique pour `updateUser({ password })`.
- `src/components/ProtectedRoute.tsx` — wrapper qui redirige vers `/auth` si pas de session.
- `src/lib/sync/cloud-sync.ts` — utilitaires `pullFlashcards`, `pushFlashcard`, `pullProgress`, `pushProgress` + abonnement Realtime.
- `src/lib/sync/sync-middleware.ts` — middleware Zustand qui debounce les writes vers le cloud.

## Fichiers à modifier

- `src/stores/flashcards.ts` — ajouter `updatedAt` aux `SavedWord`, hook `hydrateFromCloud(userId)`, `clearLocal()` au logout. Brancher le middleware de sync.
- `src/stores/reading-progress.ts` — séparer en deux : la partie **progression** (synced) et la partie **préférences UI** (local-only, inchangée). Ajouter `hydrateFromCloud` / `clearLocal`.
- `src/App.tsx` — wrapper `<AuthProvider>`, route `/auth`, route `/reset-password`, `<ProtectedRoute>` autour des routes app.
- `src/pages/Settings.tsx` — section "Compte" : email, sign out, delete account.
- `src/components/BottomNav.tsx` — petit indicateur de sync.
- `supabase/config.toml` — `site_url` + `additional_redirect_urls` pour OAuth.

## Détails techniques

- Auth Apple : utilise le BYOC géré par Lovable Cloud — recommandé si publication App Store. Si l'utilisateur n'a pas encore de compte Apple Developer, on peut activer Apple plus tard sans casser Google/Email.
- `onAuthStateChange` : ne **jamais** faire d'appel Supabase async dans le callback (deadlock). Utiliser `setTimeout(..., 0)` pour différer les fetches.
- Realtime : un seul channel par user, abonné aux 2 tables, filtré par `user_id`.
- Migration data locale : à la 1re connexion, on **ignore** le local et on prend le cloud (vide pour un nouveau compte). Le local sera repeuplé par les futures actions.
- Indicateur de sync : `useSyncStatus()` hook qui expose `'idle' | 'syncing' | 'error'` basé sur les promesses en cours.

## Ordre d'implémentation

1. Migration DB (profiles + flashcards + reading_progress + RLS + trigger)
2. AuthContext + page `/auth` + page `/reset-password` + ProtectedRoute
3. `cloud-sync.ts` + middleware
4. Adaptation des 2 stores (hydrate + clear + sync hook)
5. Section "Compte" dans Settings + indicateur sync
6. Test multi-device via Realtime

