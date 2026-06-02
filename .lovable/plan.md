## Problem

Pendant un changement d'onglet du menu, on voit brièvement le haut de la nouvelle page apparaître en bas de l'écran, le reste en blanc.

## Cause

Dans `src/App.tsx`, `AnimatePresence` est en `mode="sync"` : l'ancienne et la nouvelle page sont montées en même temps, **l'une après l'autre dans le flux normal**. Résultat :

- la page sortante occupe la hauteur du viewport en haut,
- la page entrante est poussée juste en dessous,
- on voit donc son haut "à mi-écran" pendant le fade.

En plus, `ScrollToTop` utilise `useEffect` + `window.scrollTo`, qui s'exécute après le paint, ce qui aggrave le flash quand on quitte une page scrollée.

## Fix

1. **`src/App.tsx`** — empiler les pages au lieu de les juxtaposer :
   - Wrapper l'`AnimatePresence` dans un conteneur `relative`.
   - Donner au `motion.div` la classe `absolute inset-x-0 top-0 w-full` pour que les deux pages se superposent pendant la transition (au lieu de s'enchaîner verticalement).
   - Garder `mode="sync"` (transitions plus fluides) — ou basculer en `mode="wait"` si on préfère; je propose de garder `sync` puisque l'empilement absolu suffit.

2. **`src/components/ScrollToTop.tsx`** — remettre le scroll à 0 **avant le paint** :
   - Remplacer `useEffect` par `useLayoutEffect` et utiliser `window.scrollTo(0, 0)` (sans `behavior: 'smooth'`), pour qu'au moment où la nouvelle page s'affiche, le scroll soit déjà en haut.

## Fichiers touchés

- `src/App.tsx` (structure du wrapper d'animation)
- `src/components/ScrollToTop.tsx` (timing du scroll)

## Hors scope

- Pas de changement des transitions du Reader, de la BottomNav ou des autres pages.
- Pas de modification des animations existantes (durée, easing).
