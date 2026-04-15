

## Fix: boutons de review poussés hors écran

### Problème
Le conteneur invisible (ligne 141) qui contient `backContent` pour dimensionner la carte peut devenir très grand (meanings, context sentence, example sentence...). Comme il est dans le flux normal du `flex-1`, il pousse les boutons d'action (Again/Hard/Good/Skip) en dehors du viewport `h-screen overflow-hidden` — ils sont rendus mais invisibles.

### Solution
Contraindre la zone de la carte avec `max-h` et `overflow-hidden` sur le conteneur invisible, puis `overflow-y-auto` sur les faces visibles. Concrètement :

1. **Conteneur de la carte** (ligne 130) : ajouter `min-h-0` (déjà là) — OK
2. **Invisible sizing div** (ligne 141) : ajouter `max-h-[50vh]` pour limiter la hauteur du ghost qui drive le layout, empêchant de pousser les boutons hors écran
3. **Back face** (ligne 154) : garde `overflow-y-auto` pour scroller le contenu long dans la carte

### Fichier modifié
| Fichier | Changement |
|---------|-----------|
| `src/components/FlashcardReview.tsx` | Ajouter `max-h-[50vh] overflow-hidden` sur le div invisible (ligne 141) |

