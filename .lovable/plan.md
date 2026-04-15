
## Plan : Ajouter suppression de flashcard avec confirmation

### Contexte
Actuellement, il n'y a aucun moyen de supprimer une flashcard pendant le mode review. Le bouton de suppression existe seulement dans la liste (`src/pages/Flashcards.tsx`).

### Solution
Ajouter un bouton **Trash** (icône poubelle) en mode review qui ouvre un dialog de confirmation avant de supprimer la carte.

### Changements

**1. `src/components/FlashcardReview.tsx`**
- Importer `AlertDialog` et ses composants depuis `@/components/ui/alert-dialog`
- Importer icône `Trash2` de lucide-react
- Ajouter state `[showDeleteDialog, setShowDeleteDialog]`
- Ajouter un bouton "Delete" (icône Trash2, variant ghost/destructive) en bas à gauche (opposé au bouton "Exit Review")
- Ouvrir le dialog de confirmation au clic
- Dans le dialog : titre "Delete flashcard?", description "This card will be permanently removed", boutons Cancel + Delete (destructive)
- Au clic sur Delete : appeler `removeWord(card.id)`, fermer dialog, et avancer à la carte suivante

**2. Import du store**
- Le `removeWord` existe déjà dans `useFlashcardStore`, pas besoin de le modifier

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `src/components/FlashcardReview.tsx` | Bouton delete + AlertDialog confirmation |
