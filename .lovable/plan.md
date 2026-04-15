

## Page Paramètres — Plan simplifié

### Ce qu'on va faire
Créer une page **Settings** accessible via une icône ⚙️ dans le header, avec une seule section :

**Apparence**
- Dark mode (toggle switch)
- Taille de police par défaut (S / M / L)
- Furigana par défaut (toggle)

### Navigation
- Icône `Settings` (gear) ajoutée en haut à droite des pages Library, My Books, Flashcards, Dictionary
- Lien vers la route `/settings`

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `src/pages/Settings.tsx` | **Créer** — page avec section Apparence uniquement |
| `src/App.tsx` | Ajouter route `/settings` |
| `src/pages/Library.tsx` | Ajouter icône gear dans le header |
| `src/pages/MyBooks.tsx` | Ajouter icône gear dans le header |
| `src/pages/Flashcards.tsx` | Ajouter icône gear dans le header |
| `src/pages/Dictionary.tsx` | Ajouter icône gear dans le header |

