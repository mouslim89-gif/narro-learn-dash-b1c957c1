## Objectif

Augmenter la taille du titre une fois le header réduit (état scrollé) à **24px**, au lieu des ~17px actuels.

## Changements

Ajuster uniquement le facteur `--title-scale` dans les 3 headers animés. Les tailles initiales (`fontSize`) restent inchangées.

### `src/pages/Library.tsx`
- Titre "Tsundoku" : `fontSize: 42px` initial
- Scale actuel : `1 - p * 0.595` → 42→17px
- **Nouveau** : `1 - p * 0.429` → 42→24px

### `src/pages/Dictionary.tsx`
- Titre "Dictionary" : `fontSize: 32px` initial
- Scale actuel : `1 - p * 0.469` → 32→17px
- **Nouveau** : `1 - p * 0.25` → 32→24px

### `src/pages/MyBooks.tsx`
- Titre "My Books" : `fontSize: 32px` initial
- Même changement que Dictionary : `1 - p * 0.25` → 32→24px

### `src/pages/Flashcards.tsx`
- Vérifier et appliquer le même ajustement si un `--title-scale` y est utilisé (le harmoniser à 24px final).

## Hors scope

- Pas de changement aux paddings du header, à la couleur/blur de fond, au comportement de scroll, ni aux animations lettre-par-lettre.
- Pas de modification de `marginBottom` (l'offset compense déjà la baseline).
