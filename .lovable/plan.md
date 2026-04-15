

## Page de review non-scrollable, carte scrollable

### Changements dans `src/components/FlashcardReview.tsx`

1. **Bloquer le scroll de la page** : remplacer le conteneur principal par `h-screen overflow-hidden` au lieu de `min-h-screen`
2. **Layout en flexbox vertical fixe** : header (boutons retour/delete + progress) en haut, carte au centre avec `flex-1 overflow-hidden`, boutons de réponse en bas
3. **Carte scrollable** : le verso garde `overflow-y-auto` avec une hauteur contrainte par le flex parent, pas de scroll sur le recto
4. **Retirer `pb-20`** et `min-h-screen` internes qui causent le débordement

### Structure finale

```text
┌─────────────────────────┐  h-screen overflow-hidden
│  ← Back        🗑 Delete │  flex-none
│  ═══════════ 3/10 ══════ │  flex-none (progress)
│                          │
│  ┌──────────────────┐    │
│  │                  │    │  flex-1 overflow-hidden
│  │   CARD CONTENT   │    │  carte: overflow-y-auto (verso only)
│  │                  │    │
│  └──────────────────┘    │
│                          │
│   [Again] [Hard] [Good]  │  flex-none
└─────────────────────────┘
```

### Fichier modifié
| Fichier | Changement |
|---------|-----------|
| `src/components/FlashcardReview.tsx` | Layout fixe viewport, carte scrollable |

