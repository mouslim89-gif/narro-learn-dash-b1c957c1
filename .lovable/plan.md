## Refonte du bouton Save (WordMiniPopup)

Bouton compact icône-seule, inline dans le header, avec changement clair de couleur + icône entre les deux états.

### Design
- **Forme** : bouton rond 28×28px (`h-7 w-7 rounded-full`), centré, à côté du PlayWordButton.
- **Non sauvegardé** :
  - Fond : `bg-muted/60` avec ring subtil `ring-1 ring-border`
  - Icône : `BookmarkPlus` en `text-muted-foreground`
  - Hover : fond passe à `bg-primary/10`, icône `text-primary`, légère scale `hover:scale-110`
- **Sauvegardé** :
  - Fond plein : `bg-primary` (teal)
  - Icône : `Check` en `text-primary-foreground`
  - Ring `ring-2 ring-primary/30` pour le faire ressortir
  - Petit pulse à la transition (animation `animate-in zoom-in`)
- **Feedback tactile** : `active:scale-90 transition-all duration-200`
- `aria-label` dynamique : "Add to flashcards" / "Remove from flashcards"
- Texte "Save"/"Saved" supprimé (icône seule).

### Détails techniques
- Fichier : `src/components/WordMiniPopup.tsx`
- Imports : remplacer `BookmarkPlus, BookmarkCheck` par `BookmarkPlus, Check`
- Remplacer le `<button>` actuel (la grande pill gradient) par le nouveau bouton rond
- Logique `handleSave` / `saved` inchangée
- Position inchangée (entre PlayWordButton et le `flex-1`)

### Hors scope
- `WordPopup.tsx` (popup détaillé) reste tel quel sauf si tu veux la même refonte là aussi — dis-moi.
