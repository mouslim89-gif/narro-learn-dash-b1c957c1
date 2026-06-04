## Objectif
S'assurer que **chaque bouton** de l'app a un retour visuel clair au tap (couleur + micro-animation), puisque tous les `hover:` / `active:` ont été supprimés précédemment.

## Stratégie
Centraliser le feedback dans 2 endroits pour ne pas avoir à toucher chaque composant :

### 1. `src/components/ui/button.tsx` (couvre 80% des boutons)
Ajouter au `cva` base : `tap-scale active:scale-[0.96]`
Ajouter par variant un overlay de couleur au `:active` :
- `default` (primary) → `active:bg-primary/85`
- `destructive` → `active:bg-destructive/85`
- `secondary` → `active:bg-secondary/70`
- `outline` → `active:bg-accent/10`
- `ghost` → `active:bg-foreground/8`
- `link` → `active:opacity-70`

### 2. `src/index.css` — renforcer `.tap-scale` et `.tap-scale-sm`
S'assurer que les classes incluent bien :
- `transform: scale(0.96)` sur `:active`
- un léger `background-color` overlay via `::after` (déjà partiellement en place)
- `-webkit-tap-highlight-color: transparent` + `touch-action: manipulation`

### 3. Composants custom qui n'utilisent pas `<Button>`
Audit ciblé + ajout de `tap-scale` (ou `tap-scale-sm`) + une classe `active:bg-*` adaptée au fond :
- `BottomNav.tsx` — items de navigation (couleur d'item actif déjà OK, ajouter feedback au tap)
- `NavLink.tsx` — rien à faire (wrapper)
- `ReaderToken.tsx` — déjà géré par `animate-word-tap`, vérifier
- `PlayWordButton.tsx` — déjà `tap-scale-sm`, OK
- `SrsButtons.tsx` — déjà `tap-scale`, OK
- `BookCard.tsx` — `card-lift tap-scale` à confirmer
- `TokenEditFloatingBar.tsx`, `WordPopup.tsx`, `WordMiniPopup.tsx`, `AudioPlayer.tsx`, `GrammarPanel.tsx`, `Reader.tsx` (icon buttons `.reader-icon-btn` déjà gérés en CSS)
- `MyBooks.tsx`, `Library.tsx`, `BookDetail.tsx`, `Flashcards.tsx`, `Settings.tsx`, `Dictionary.tsx`, `WordDetail.tsx`, `Auth.tsx` — sweep des `<button>` natifs et `<div onClick>` interactifs

### 4. shadcn ui interactifs (au-delà de Button)
Ajouter feedback sur les surfaces tappables : `tabs trigger`, `select trigger`, `dropdown item`, `accordion trigger`, `toggle`, `switch`, `checkbox`, `radio` — ajouter `active:bg-*` au `cn()` de base de chaque.

## Approche d'exécution
1. Patch `button.tsx` + `index.css` (gain immédiat sur la majorité)
2. Sweep `rg "<button"` et `rg "onClick"` dans `src/components` et `src/pages` → ajouter `tap-scale` + `active:bg-*` sur les surfaces qui n'en ont pas
3. Patch ciblé des composants shadcn les plus utilisés (tabs, select, dropdown-menu, toggle, switch, accordion)
4. Vérification visuelle via preview sur quelques écrans clés (Library, Reader, Flashcards, Settings)

## Question
**Quelle intensité de feedback veux-tu ?**
- (A) **Subtil** : `scale(0.96)` + overlay 8% (cohérent avec ce qui est déjà là)
- (B) **Marqué / Duolingo-like** : `scale(0.94)` + overlay 15% + 150ms
- (C) **Coloré** : overlay teinté `--accent` (doré) au lieu de neutre, pour un effet plus signature

Je pars sur **(A)** par défaut sauf indication contraire.
