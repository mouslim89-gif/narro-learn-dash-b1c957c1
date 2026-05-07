# Mode "Édition de tokens" dans le Reader (admin-only)

## Objectif

Ajouter dans le Reader un mode interactif qui permet, à toi seul, de visualiser tous les tokens du chapitre et de les modifier (fusionner, splitter, éditer reading/base/POS, surface furigana). Les modifs sont accumulées dans un buffer et exportables sous forme de règles `Rule` prêtes à coller dans `src/data/token-overrides.ts`.

## 1. Garde admin (email hardcodé)

Nouveau fichier `src/lib/admin.ts` :

- Constante `ADMIN_EMAILS = ["mouslim89@gmail.com"]`
- Hook `useIsAdmin()` qui lit `useAuth()` et renvoie `true` si `user.email` est dans la liste.

Tu nous diras ton email exact lors de l'implémentation (ou je mets un placeholder à compléter).

## 2. Bouton d'entrée dans le menu Settings du Reader

Dans `src/pages/Reader.tsx`, dans le panneau Settings existant :

- Si `useIsAdmin()` → afficher une section "Dev" avec un toggle **"Token edit mode"**.
- Quand activé, le Reader passe en mode édition (state `tokenEditMode`).

## 3. UI mode édition

Nouveau composant `src/components/TokenEditOverlay.tsx`.

Comportement dans le Reader quand `tokenEditMode = true` :

- Les popups habituels (mini/full word popup, sentence translation) sont désactivés.
- Chaque token est rendu avec une bordure fine et un fond léger basé sur sa couleur POS (réutilise `getPosColorClass`).
- **Tap simple sur un token** → ouvre un panneau bottom-sheet (réutilise `Sheet` shadcn) avec :
  - Surface (`t`) — éditable
  - Reading (`r`) — éditable (furigana affiché dans wordpopup ET au-dessus du texte)
  - Base (`b`) — éditable (clé dico)
  - POS (`p`) — select avec les alias (particle, verb, …) + champ libre
  - Toggle "ponctuation" (`j=false`)
  - Bouton **"Splitter"** → ouvre un éditeur où tu saisis les nouveaux tokens un par un (chacun avec t/r/b/p)
  - Bouton **"Supprimer cette règle"** si la règle existe déjà dans le buffer
- **Sélection multi-token** : tap long sur un token → entre en mode sélection ; les taps suivants ajoutent/retirent des tokens contigus à la sélection. Bouton flottant **"Fusionner ces N tokens"** → ouvre le même panneau pour définir le token résultant.
- Barre flottante en bas avec :
  - Compteur "X règle(s) en attente"
  - Bouton **"Voir les règles"** → modal qui affiche le bloc TS prêt à coller, avec bouton "Copier" :
    ```ts
    // À coller dans tokenOverrides["gyofukuki"] :
    ["三|人", "三:さん", "人:じん"],
    ["お", "お:お:御"],
    ```
  - Bouton **"Reset"** vide le buffer.
- Les règles du buffer sont **appliquées en live** au rendu pour que tu voies l'effet immédiatement (on les fusionne avec `tokenOverrides` existants via `applyTokenOverrides`).

## 4. Persistance buffer

`localStorage` clé `token-edit-buffer:<bookId>:<chapterId>` (Zustand store dédié `src/stores/token-edit.ts` avec `persist`). Pas de DB, pas de partage avec les autres users — tu copies le bloc dans `token-overrides.ts` quand tu es satisfait.

## 5. Génération des règles

Helper `src/lib/token-edit-rules.ts` :

- `tokensToRule(matched: BookToken[], replacement: BookToken[]): Rule` — produit le format court `[match, ...replace]` en respectant la convention de `token-overrides.ts` (préfixe `!` pour ponctuation, `pos` aliasé en `particle/verb/...`, champs vides skippés).
- `formatRulesBlock(rules: Rule[], bookId: string): string` — sort le snippet TS formaté.

## 6. Détails techniques

- Aucun changement aux fichiers `dictionary-db`, `jisho.ts`, `merge-tokens`, `generate-tokens.ts`.
- Le mode édition travaille sur la liste **après** `cleanRubyTokens` + `mergeConjugatedTokens` + `applyTokenOverrides` (= la même qu'aujourd'hui), pour que tu vois ce que voit l'utilisateur.
- Les règles que tu crées sont scopées au `bookId` courant (jamais `*`), car c'est le cas d'usage le plus fréquent. Toggle "appliquer à tous les livres" disponible dans le panneau d'édition.
- Le furigana modifié via le mode édition est utilisé à la fois dans le texte (`FuriganaWord`) et dans les popups (déjà géré par `overrideReading` ajouté précédemment).

## Fichiers touchés

- **Nouveau** `src/lib/admin.ts`
- **Nouveau** `src/stores/token-edit.ts`
- **Nouveau** `src/lib/token-edit-rules.ts`
- **Nouveau** `src/components/TokenEditOverlay.tsx`
- **Nouveau** `src/components/TokenEditPanel.tsx` (le bottom-sheet d'édition)
- **Modifié** `src/pages/Reader.tsx` — toggle dans Settings + branchement de l'overlay + désactivation des popups en mode édition

