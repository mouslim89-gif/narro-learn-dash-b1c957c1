## Goal

1. Refondre le panneau **Settings du Reader** pour utiliser exactement le style "paper UI" de la page `Settings.tsx` (cards `rounded-2xl bg-card ring-1 ring-border/30 shadow-sm`, `SectionLabel` serif uppercase avec hairline, contrôles pill-segmented dans `rounded-full bg-muted p-1`, rangées séparées par `divide-y divide-border/40`).
2. Supprimer le toggle **Display Mode** (Normal / Grammar) du panneau.

## Changes — `src/pages/Reader.tsx`

### Settings panel (lignes ~731–863)

Garder le pattern actuel (Sheet bottom sur mobile, sticky panel sur desktop) — c'est juste le **contenu** qui change. Réécrire `settingsBody` en suivant Settings.tsx :

- Composant local `SectionLabel` identique à celui de Settings.tsx : `font-serif text-[13px] tracking-[0.14em] uppercase text-muted-foreground` + hairline `flex-1 h-px bg-border/60`.
- Chaque section dans une card `rounded-2xl bg-card ring-1 ring-border/30 shadow-sm`, rangées séparées par `divide-y divide-border/40`, padding `px-4 py-4`, label gauche / contrôle droite.
- Sections, dans cet ordre :
  1. **Reading** (card) → Reading Level (3 pills), Font Size (pills S/M/L dans `rounded-full bg-muted p-1`), Japanese Font (pills Sans/Serif/Hand avec sample あ).
  2. **Display** (card) → Dark mode (Switch), Show furigana (Switch), Theme accent si pertinent — Display Mode supprimé.
  3. **Highlights** (card) → Highlight saved words (Switch). Quand activé : 3 sous-rangées indentées avec dot couleur + Switch (New, Learning, Known), séparées par hairline.
- Sheet wrapper : changer `bg-background` du SheetContent pour `bg-background` neutre + spacing `space-y-7` entre sections, comme la page Settings.
- Conserver `useBodyScrollLock` via le composant Sheet existant (déjà géré par Radix).

### Suppression Display Mode

- Retirer la sous-section "Display Mode" (lignes 789–803).
- Retirer la bannière `displayMode === 'grammar'` (lignes ~869+) avec sa légende POS.
- Retirer les branches `displayMode === 'grammar'` qui pilotent `getPosColorClass` et désactivent les highlights (lignes ~950, ~958).
- Retirer `displayMode`, `setDisplayMode`, `DisplayMode` de la destructuration + import.
- Retirer `Palette` de l'import lucide.
- Le store garde le champ `displayMode` pour compat (aucune migration nécessaire) — juste plus utilisé côté UI.

### Hors scope
- `GrammarPanel` et le bouton 文 dans le header restent (suppression = juste le toggle Display Mode).
- Aucune modification à `src/pages/Settings.tsx`, au store, ou ailleurs.

## Technical notes

- Réutiliser exactement les classes/tokens de Settings.tsx pour cohérence visuelle parfaite — pas de variations.
- Les pills segmentées (Font Size, Japanese Font, Reading Level) suivent le pattern Settings.tsx : container `rounded-full bg-muted p-1`, item actif `bg-card text-foreground shadow-sm ring-1 ring-border/40`, inactif `text-muted-foreground`.
- Le header sheet mobile peut accueillir un petit titre serif "Reader Settings" en haut, suivi du contenu en sections paper UI.
