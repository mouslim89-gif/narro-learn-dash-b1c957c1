

## Carte verso auto-height

### Problème
La carte a une hauteur fixe (`h-64` = 16rem) qui force le scroll quand le verso contient beaucoup de contenu.

### Solution
Remplacer la hauteur fixe par une hauteur automatique. Comme le flip 3D nécessite que recto et verso soient superposés (`absolute inset-0`), il faut adapter l'approche :

- Retirer `h-64` du conteneur de la carte
- Utiliser `min-h-64` pour garder une taille minimum (le recto reste joli)
- Le verso passe de `absolute inset-0` à `relative` quand flippé, avec auto-height
- Alterner l'affichage recto/verso avec un simple `hidden`/`block` au lieu de l'animation 3D pure, tout en gardant l'animation de transition

**Alternative plus simple** : garder le flip 3D mais passer le conteneur en `h-auto` avec un `min-h-64`. Le recto garde `absolute inset-0` et le verso utilise `relative` + `invisible`/`visible` pour piloter la hauteur.

### Fichier modifié
| Fichier | Changement |
|---------|-----------|
| `src/components/FlashcardReview.tsx` | Retirer `h-64`, ajouter `min-h-64`, adapter le positionnement recto/verso pour auto-height |

