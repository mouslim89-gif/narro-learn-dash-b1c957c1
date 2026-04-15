

## Mettre en évidence le mot dans toutes les phrases (contexte + exemple) avec une couleur orangée

### Problème
- La mise en évidence ne concerne que l'exemple Tatoeba dans `ExampleSentence.tsx`
- La phrase de contexte ("From your reading") dans `FlashcardReview.tsx` n'a aucune mise en évidence
- La couleur actuelle (`text-primary`) ne ressort pas assez — il faut une couleur plus orangée/chaude

### Changements

**1. `src/components/ExampleSentence.tsx`**
- Changer `text-primary font-bold` → `text-amber-500 font-bold` (orange chaud)

**2. `src/components/FlashcardReview.tsx`**
- Dans la section "From your reading" (ligne 87), ajouter une fonction `highlightInContext` qui cherche `card.word` dans `card.contextSentence` et l'entoure d'un `<span className="text-amber-500 font-bold">`
- Remplacer `{card.contextSentence}` par `{highlightInContext(card.contextSentence, card.word)}`

**3. `src/pages/Dictionary.tsx`** (si applicable)
- Vérifier si les phrases d'exemple dans la page dictionnaire utilisent aussi `ExampleSentence` → oui, donc le changement dans `ExampleSentence.tsx` s'appliquera automatiquement

### Couleur
`text-amber-500` en clair, `text-amber-400` en dark — une teinte orangée visible sur les deux thèmes.

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `src/components/ExampleSentence.tsx` | Couleur amber au lieu de primary |
| `src/components/FlashcardReview.tsx` | Highlight du mot dans contextSentence |

