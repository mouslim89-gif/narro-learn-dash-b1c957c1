

## Mini Popup — Animation, drag-to-switch, toggle close

### 1. Animation d'apparition
Le popup utilise déjà `animate-in fade-in-0 zoom-in-95 duration-150` de tailwindcss-animate. Je vais l'améliorer avec une animation plus expressive : **slide depuis la phrase** (descend depuis le haut si popup en bas, monte depuis le bas si popup au-dessus) + fade + zoom subtil.

- Détecter la direction (popup au-dessus ou en-dessous de la phrase) et appliquer `slide-in-from-bottom-2` ou `slide-in-from-top-2`
- Durée 180ms, easing `ease-out`
- Origine du transform alignée vers la phrase pour un effet naturel

### 2. Drag pour changer de mot (maintenir + glisser)
Comportement type "loupe glissante" :
- Sur `pointerdown` d'un mot japonais → ouvre le mini popup ET active un mode "drag"
- Pendant `pointermove` (sans relâcher) → on fait `document.elementFromPoint(x, y)` pour détecter le mot survolé
- Si on survole un autre mot japonais (`data-word-token`), on met à jour `miniPopup` avec le nouveau mot/phrase/rect
- Sur `pointerup` → fin du mode drag, le popup reste ouvert sur le dernier mot

**Implémentation** :
- Ajouter `data-word-token`, `data-sentence-idx`, `data-token-idx`, `data-base-form`, `data-pos` sur chaque `<span>` de mot dans Reader.tsx
- Handler global `pointermove` actif uniquement quand `isDragging` est true
- Le popup ne se repositionne pas brutalement — on garde le même composant monté, juste les props changent (le `useEffect` de positionnement recalcule)

### 3. Tap sur mot déjà sélectionné = ferme
Dans le `onClick` du mot Reader.tsx :
```ts
if (miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i) {
  setMiniPopup(null);
  return;
}
```

### Détails techniques

| Fichier | Changement |
|---------|-----------|
| `src/pages/Reader.tsx` | Remplacer `onClick` par `onPointerDown`+`onPointerUp`+global `pointermove` ; ajouter data-attributes sur tokens ; toggle close si même mot |
| `src/components/WordMiniPopup.tsx` | Animation directionnelle (slide depuis la phrase) ; transition douce sur le repositionnement quand on drag d'un mot à l'autre |

### Subtilités UX
- **Threshold de drag** : on n'active le drag-switch qu'après 8px de mouvement, sinon un simple tap reste un tap (pas de switch accidentel)
- **Transition de position** : quand on switch de mot pendant le drag, ajouter `transition-[top,left] duration-150 ease-out` pour que le popup glisse vers la nouvelle position au lieu de sauter
- **Highlight suit le drag** : le surlignage du mot actif suit naturellement puisqu'il est lié à `miniPopup.sentenceIdx/tokenIdx`
- **Cleanup** : `pointercancel` et `pointerup` hors zone retirent les listeners globaux

### Question rapide

Une seule chose à clarifier sur le drag :

