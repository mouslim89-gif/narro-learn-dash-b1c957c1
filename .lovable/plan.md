# Selection color → accent amber (global)

Tous les états sélectionnés/actifs des boutons (segments, toggles, tabs, icônes du reader) passent du gris/navy actuel à l'accent ambre (`hsl(var(--accent))`), avec un fond tinté léger + ring ambre pour rester subtil et cohérent avec la palette warm paper.

## Changements

### 1. `src/index.css` — token réutilisable + reader icon
Ajouter une classe utilitaire `.is-selected` et mettre à jour `.reader-icon-btn[data-active="true"]` :
```css
.reader-icon-btn[data-active="true"] {
  color: hsl(var(--accent));
  background-color: hsl(var(--accent) / 0.12);
}
```

### 2. `src/pages/Reader.tsx` — pills segmented (difficulty / font size / japanese font)
Ligne 906 : `pillActive` devient
```ts
'bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))] ring-1 ring-[hsl(var(--accent)/0.35)] shadow-sm'
```
Ligne 821 (toggle token-edit mode) : `bg-foreground/10 ring-1 ring-border/50` → `bg-[hsl(var(--accent)/0.12)] ring-1 ring-[hsl(var(--accent)/0.35)] text-[hsl(var(--accent))]`.
Ligne 1141 (token edit chip selected) : `bg-primary text-primary-foreground ring-primary/30` → `bg-accent text-accent-foreground ring-accent/40`.

### 3. `src/components/ui/tabs.tsx`
`TabsTrigger` active state : `data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm` → `data-[state=active]:bg-[hsl(var(--accent)/0.12)] data-[state=active]:text-[hsl(var(--accent))] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[hsl(var(--accent)/0.35)]`.

### 4. `src/pages/Flashcards.tsx`
Ligne 163 (card sélectionnée) : `border-primary/40 ring-1 ring-primary/30` → `border-accent/50 ring-1 ring-accent/40 bg-accent/5`.
Ligne 208 (icône check) : `text-primary` → `text-accent`.

### 5. `src/components/TokenEditFloatingBar.tsx` (admin)
Les 4 chips scope : `bg-primary text-primary-foreground` → `bg-accent text-accent-foreground` pour rester cohérent.

## Hors scope
- Boutons CTA primaires (Continue, Save…) : restent navy `bg-primary` — c'est l'action principale, pas un état sélectionné.
- Liens actifs de la `BottomNav` : déjà gérés séparément, à voir dans un second tour si tu veux aussi les passer en ambre.
- Couleurs SRS / known-words / JLPT levels : inchangées (sémantique distincte).

Confirme et je l'applique.