## Objectif

Indiquer visuellement que les cartes de résultats sur `/dictionary` sont cliquables (mènent vers `/dictionary/:word`).

## Changement

Dans `src/pages/Dictionary.tsx`, sur chaque carte de résultat :

- Ajouter un `ChevronRight` (lucide-react) positionné à droite, verticalement centré, dans la zone cliquable.
- Couleur `text-muted-foreground/60`, taille 18px, légère translation au hover de la carte pour renforcer l'affordance (`group-hover:translate-x-0.5 transition-transform`).
- Repositionner : le bouton Star (étoile) reste en `top-4 right-4`, le chevron est placé en bas à droite OU centré verticalement sur le bord droit de la zone cliquable, sans chevaucher l'étoile.
- Ajouter `group` sur le conteneur cliquable pour activer l'animation hover du chevron.
- Augmenter le `pr-*` du bloc texte pour laisser la place au chevron.

Aucune modification de logique : juste un ajustement visuel/présentation.

## Fichier modifié

- `src/pages/Dictionary.tsx`
