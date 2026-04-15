
## Ajouter un bouton retour en haut à gauche

### Changements

**`src/components/FlashcardReview.tsx`**

1. **Importer l'icône `ArrowLeft`** depuis `lucide-react` (ligne 10)

2. **Ajouter un header fixe en haut** avec le bouton retour :
   - Remplacer la div `flex min-h-screen flex-col items-center justify-center` (ligne 55) par une structure à deux sections :
     - Header fixe en haut à gauche avec bouton retour
     - Zone principale centrée avec le contenu existant
   
3. **Structure proposée** :
```tsx
<div className="relative min-h-screen pb-20">
  {/* Header avec bouton retour */}
  <div className="absolute top-4 left-4 z-10">
    <Button variant="ghost" size="icon" onClick={onExit}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
  </div>
  
  {/* Contenu centré (existant) */}
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
    {/* Progress, card, buttons... */}
  </div>
</div>
```

4. **Supprimer la row du bas** (lignes 158-165) qui contient "Delete" et "Exit Review"
   - Le bouton Delete peut être déplacé en haut à droite (symétrique au bouton retour)
   - Ou supprimé si pas essentiel pendant la review

### Fichier modifié
| Fichier | Changement |
|---------|-----------|
| `src/components/FlashcardReview.tsx` | Bouton retour top-left + suppression footer |
