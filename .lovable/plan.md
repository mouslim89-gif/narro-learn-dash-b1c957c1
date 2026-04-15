

## Améliorer le mode Flashcards

### 1. Review mode : 3 niveaux de difficulté

**Store (`src/stores/flashcards.ts`)**
- Ajouter `adjustMastery(id, quality: 'again' | 'hard' | 'good')` :
  - `again` → reset mastery à 0
  - `hard` → mastery reste pareil, mais reschedule à demain
  - `good` → mastery +1 (comportement actuel)
- Adapter les intervalles SRS en conséquence

**Review UI (`src/pages/Flashcards.tsx`)**
- Remplacer les 2 boutons par 3 : Again (rouge), Hard (orange), Good (vert)
- Icônes : X, AlertTriangle, Check

### 2. Review mode : animation de transition

- Quand on passe à la carte suivante, animer la carte sortante en slide-out + fade, et la nouvelle en slide-in + fade
- Utiliser un state `animating` pour déclencher les classes CSS `animate-slide-out-right` puis `animate-slide-in-right`
- Ajouter les keyframes nécessaires dans `src/index.css` (slide-left variantes)

### 3. Section flashcards : filtres, tri, recherche

**Filtres par statut**
- Row de chips cliquables : All / New / Learning / Known
- Filtrer `savedWords` selon le mastery

**Recherche**
- Input de recherche en haut, filtre par mot, reading, ou meanings

**Options de tri**
- Petit dropdown ou toggle : Date ajoutée (défaut), JLPT, Mastery
- Tri ascendant/descendant

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/stores/flashcards.ts` | Ajouter `adjustMastery` avec 3 niveaux |
| `src/pages/Flashcards.tsx` | 3 boutons, animation transition, filtres/tri/recherche |
| `src/index.css` | Keyframes slide-left pour animation cartes |

