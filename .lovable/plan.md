## Améliorations du mode Token Edit

### 1. Bouton header (admin only)
Dans `src/pages/Reader.tsx`, ajouter une icône `Wrench` dans le header à côté du bouton Settings, visible uniquement si `useIsAdmin()`.
- Tap = toggle direct de `tokenEditMode`
- Style actif: fond `primary/15`, icône colorée primary
- Retirer le toggle "Token edit mode" de la section Dev du panneau Settings (devient redondant). Garder éventuellement un petit raccourci "Clear buffer" pour admin.

### 2. POS optionnel + mode "Auto"
Dans `src/components/TokenEditPanel.tsx`:
- Ajouter en tête du select POS deux options spéciales:
  - `Auto` (valeur par défaut pour un edit) — garde le POS d'origine du token matché, n'écrase rien dans la règle
  - `Aucun (omit)` — la règle générée n'inclut PAS le champ p
- Ajout de `pMode: 'auto' | 'none' | 'set'` dans `TokenDraft` pour distinguer ces cas.

Dans `src/lib/token-edit-rules.ts` (`encodeReplacement`):
- Si `pMode === 'none'` ou si `p` est vide → ne pas émettre p (déjà partiellement géré, à formaliser).
- Si `pMode === 'auto'` → ne pas émettre p non plus (le moteur garde l'original via fallback existant dans `applyRules`).

Vérifier que `applyRules` dans `src/data/token-overrides.ts` conserve bien le POS du token matché quand le replacement n'a pas de p (ajuster si besoin — petit fix défensif).

### 3. Preview live de la règle
Ajouter en bas du `TokenEditPanel`, au-dessus des boutons Cancel/Save, un bloc `<pre>` compact qui affiche en temps réel le snippet TS de la règle en cours de construction (utilise `tokensToRule` + `formatRule` exporté depuis `token-edit-rules.ts`). Bouton "Copy" inline.

### 4. Undo dernière règle
Dans `src/stores/token-edit.ts`:
- Ajouter `undoLast: (scope: string) => Rule | null` qui pop la dernière règle du buffer et la renvoie.

Dans `src/components/TokenEditFloatingBar.tsx`:
- Bouton `Undo` (icône `Undo2`) à côté de "View rules", désactivé si buffer vide. Toast de confirmation avec contenu retiré.

### 5. Sélection par drag
Dans `src/pages/Reader.tsx` (rendu des tokens en mode edit):
- Sur chaque `ReaderToken`, ajouter `onPointerDown` qui démarre un drag (state `dragSelecting`), `onPointerEnter` (pendant drag) qui ajoute le token à `selectedIdx`, `onPointerUp` global qui termine.
- Tap simple sans mouvement (< 5px) = ouvre le panel d'édition pour ce token (comportement actuel).
- Touch: utiliser `pointer events` natifs (fonctionne tactile + souris). Sur touch, désactiver le scroll vertical pendant le drag via `touch-action: none` sur le conteneur tokens en mode edit.
- Garder Clear sel et Merge dans la barre flottante.

### 6. Polish floating bar
- Réordonner: `[Exit] EDIT MODE · N pending  ——  [Undo] [View rules]`
- Quand sélection > 1 : afficher `[Merge N] [Clear]` au centre, en `accent`.

### Fichiers touchés

- **Modifié** `src/pages/Reader.tsx` — bouton Wrench header, retrait toggle Settings, drag-select pointer events, `touch-action`.
- **Modifié** `src/components/TokenEditPanel.tsx` — POS Auto/Aucun, preview live, badge POS d'origine.
- **Modifié** `src/lib/token-edit-rules.ts` — gestion pMode, export `formatRule`.
- **Modifié** `src/stores/token-edit.ts` — `undoLast`.
- **Modifié** `src/components/TokenEditFloatingBar.tsx` — bouton Undo, layout.
- **Modifié (défensif)** `src/data/token-overrides.ts` — `applyRules` garde POS original si replacement omet p.
