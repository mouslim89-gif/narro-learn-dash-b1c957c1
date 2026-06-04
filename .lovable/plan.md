## Correctifs

**Problème 1 — BottomNav touchée**
`.tap-scale-sm` est utilisée par les liens de la BottomNav. En changeant son `:active` background en ambré, j'ai indirectement modifié le feedback de la nav. → Revert `.tap-scale-sm:active` au gris d'origine (`hsl(var(--foreground) / 0.08)`).

**Problème 2 — Couleur trop discrète**
Bump l'opacité ambrée de `0.17` → `0.25` sur les variantes de bouton et `.press-flash`.

## Changements

### `src/index.css`
- `.tap-scale-sm:active` → revert `background-color: hsl(var(--foreground) / 0.08)` (état initial).
- `.press-flash::after` radial gradient → `hsl(var(--accent) / 0.28)`.

### `src/components/ui/button.tsx`
- `outline` : `active:bg-[hsl(var(--accent)/0.17)]` → `active:bg-[hsl(var(--accent)/0.25)]`
- `secondary` : idem → `/0.25`
- `ghost` : idem → `/0.25`

## Hors scope
- `BottomNav.tsx` non modifié (revert via `.tap-scale-sm`).
- `default`/`destructive`/`link` inchangés.

## Vérif
Tap sur un onglet de la BottomNav → flash gris discret comme avant. Tap sur un bouton outline/ghost/secondary (Settings rows, Flashcards SrsButtons, Reader chrome) → flash ambré clairement visible.
