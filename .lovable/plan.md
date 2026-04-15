

## Améliorer le verso des flashcards

Le verso actuel est basique : mot, définitions empilées, badge JLPT, et une phrase d'exemple. On va le restructurer pour qu'il soit plus lisible et informatif.

### Changements dans `src/pages/Flashcards.tsx`

**Structure du verso redessinée :**
- **En haut** : mot + reading + romaji (via `wanakana.toRomaji`) + bouton audio, sur une ligne compacte
- **Section définitions** : numérotées (1. 2. 3.), avec une meilleure hiérarchie visuelle, couleur `text-foreground` au lieu de `text-accent`
- **Badges** : ligne de tags — JLPT badge + parts of speech en chips mutés, alignés horizontalement
- **Séparateur** fin avant la phrase d'exemple
- **Phrase d'exemple** : en bas, avec plus d'espace
- Meilleur padding et espacement global, texte aligné à gauche (plus naturel qu'un centrage)

### Fichier à modifier
| Fichier | Changement |
|---------|-----------|
| `src/pages/Flashcards.tsx` | Redesign du verso de la carte (lignes 62-74) |

