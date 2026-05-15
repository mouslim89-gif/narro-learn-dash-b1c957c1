## Objectif
Aligner la BottomNav sur l'esthétique éditoriale de la page Library (Tsundoku) : capsule flottante, typographie serif sur l'actif, indicateur "section-bullet".

## Changements

### `src/components/BottomNav.tsx`
- Remplacer la barre edge-to-edge par une **pill flottante** :
  - Conteneur fixé en bas, centré, `max-w-sm`, marges latérales (`mx-4`), `mb-[calc(env(safe-area-inset-bottom)+12px)]`.
  - Capsule : `rounded-full bg-card/85 backdrop-blur-xl ring-1 ring-border/40 shadow-[0_8px_30px_-8px_hsl(var(--foreground)/0.18)]`.
  - Padding interne réduit, items répartis `justify-around`.
- **Items** :
  - Icône légèrement plus petite, `strokeWidth` 1.8 / 2.2 (déjà en place).
  - Label : `font-serif` + `tracking-tight` quand actif ; sinon masqué ou en `text-[10px] text-muted-foreground` (à confirmer mais on garde toujours visible pour cohérence).
  - Actif : couleur `text-foreground` (pas primary teal — Library est neutre/éditorial), petite **`section-bullet`** (point coloré déjà défini en CSS) sous l'icône à la place du trait `layoutId="bottom-nav-indicator"`.
- **Animation** : conserver `motion.div` scale sur icône active ; remplacer l'indicateur trait par un `motion.span` rond (4px) avec `layoutId` pour transition fluide entre items.
- Badge "due cards" : conserver, ajuster position pour la nouvelle taille.
- Sync indicator : repositionner discrètement au-dessus à droite de la capsule (petit dot flottant).

### `src/index.css` (si besoin)
- Vérifier que `.section-bullet` est utilisable hors Library ; sinon extraire variante `.nav-bullet` (même style : dot 4px, accent color).
- Ajuster padding bas global (les pages utilisent `pb-20` → garder, la pill flottante reste dans cette zone).

### Aucun changement
- Routes, logique de navigation, store, `App.tsx`.
- Autres pages (le `pb-20` existant suffit pour la pill flottante).

## Détails techniques
- La pill est plus étroite que la barre actuelle ; vérifier sur 390px de large que les 4 items + labels tiennent (icône 18px + label 10px serif). Si trop serré, masquer le label des items inactifs et n'afficher que sur l'actif (option éditoriale plus propre).
- `font-serif` est déjà défini dans Tailwind config (utilisé par Library wordmark).
- Garder `tap-scale-sm` et `smooth-colors` pour la cohérence des micro-interactions.

## Résultat visuel
Capsule blanche translucide flottante en bas, icônes minimalistes neutres, point coloré sous l'item actif, label serif en italique-feeling sous l'actif uniquement — exactement le langage visuel de la Library.