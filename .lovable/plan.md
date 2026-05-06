## Problème

Quand un token a été glué (ex. `に + なって` → surface `になって`, base `なる`), les popups appellent `getCached(word)` AVANT `getCached(baseForm)`. Comme `になって` est dans le cache préchargé (Jisho retourne "になって初めて" / "成ってない" / "ニナリッチ" pour les variantes), on n'arrive jamais à `なる`.

Même cause pour le lookup live : `lookupWord(baseForm)` est essayé en premier seulement si `getCached(word)` est vide — mais comme il ne l'est pas, on prend la mauvaise entrée.

## Correction

**`src/components/WordPopup.tsx` et `src/components/WordMiniPopup.tsx`** — inverser la priorité :

1. Si `baseForm` est défini ET différent de `word` :
   - `cached = getCached(baseForm)` d'abord, fallback `getCached(word)`
   - Lookup live : `lookupWord(baseForm)` d'abord, fallback `lookupWord(word)` (déjà le cas, mais déclencher même si `cached(word)` existe)
2. Sinon comportement actuel.

Mettre à jour `deinflected` à `baseForm` quand on résout via la base.

## Détails techniques

Dans les deux popups, remplacer :

```ts
const cached = getCached(word) || (baseForm ? getCached(baseForm) : undefined);
```

par :

```ts
const cached = (baseForm && baseForm !== word ? getCached(baseForm) : undefined)
  ?? getCached(word);
```

Le bloc `useEffect` actuel essaie déjà `lookupWord(baseForm)` en premier — il fonctionnera correctement une fois que la priorité du cache est inversée (le `if (cached)` early-return prendra alors l'entrée `なる` directement).

Aucun changement nécessaire dans `merge-tokens.ts`, `jisho.ts`, ni l'edge function.

## Vérification

- Tester `になって`, `になった`, `になります` → doit afficher la def de `なる` (Godan verb).
- Vérifier que les autres mots non-gloués (ex. `桜`, `樹`) restent inchangés (pas de baseForm distinct).
- Vérifier que `信じて` (baseForm `信じる`) affiche bien `信じる`.
