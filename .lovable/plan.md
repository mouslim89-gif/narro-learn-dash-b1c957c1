## Objectif

1. **Glass plus clair** : baisser de 16px/70% → **12px blur / 78% bg** sur la variante A (qu'on va garder).
2. **Stabiliser le flou pendant le scroll** : éliminer le "tremblement frame-to-frame" causé par le redimensionnement du header pendant que `backdrop-filter` est actif.

---

## Diagnostic du tremblement

Le flou (`blur(16px)`) est constant. Ce qui change à chaque frame, c'est la **taille et le padding du header** (animés via `--p`). Comme `backdrop-filter` ré-échantillonne la zone derrière le header à chaque frame, et que cette zone bouge en sous-pixels (le lissage exponentiel produit des deltas non-uniformes : 0.35 × diff → grandes variations au début, microscopiques à la fin), on perçoit le verre comme "vivant".

Combiné à iOS Safari qui re-compose le layer floutant à chaque sub-pixel change → shimmer.

---

## Changements

### 1. `src/index.css` — Glass plus clair + stabilisation

**`.glass-subtle`** (la variante qu'on garde) :
- `blur(16px) saturate(140%)` → **`blur(12px) saturate(135%)`**
- `bg hsl(var(--background) / 0.70)` → **`/ 0.78`**
- Ajouter : `transform: translateZ(0); will-change: backdrop-filter; isolation: isolate;` → force un layer GPU dédié, le navigateur ne recompose plus la couche à chaque sub-pixel.

**`.glass-chip-subtle`** :
- `blur(12px)` → **`blur(10px)`**, bg `0.55` → **`0.65`**
- Mêmes propriétés GPU.

(Variantes B et C : on les supprime puisqu'on a tranché sur A.)

### 2. `src/hooks/use-scroll-progress.ts` — Quantisation + arrondi pixel-aware

Le lissage actuel écrit `--p` avec `toFixed(4)` → trop de granularité. Le header se redimensionne en fractions de pixel → backdrop-filter shimmer.

- **Quantiser `--p` à 2 décimales** (`toFixed(2)`) : limite les redraws du backdrop à ~100 valeurs distinctes maximum sur toute la course.
- **Snap quand on est proche de la cible** : si `|diff| < 0.01`, snap direct à `target` (au lieu de continuer à lerp en sous-pixels).
- **Snapper le scroll au pixel** : `Math.round(...)` la position scroll utilisée pour calculer `target`, pour que des wheel events fractionnaires ne génèrent pas de micro-variations.

```ts
const SMOOTH = 0.35;       // inchangé
const EPS = 0.01;          // plus tolérant (était 0.0005)

const computeTarget = () => {
  const y = Math.round(window.scrollY);   // snap pixel
  target = Math.min(1, Math.max(0, (y - start) / range));
};

const write = (v: number) => {
  el.style.setProperty(varName, v.toFixed(2));  // 2 décimales
};
```

### 3. `src/pages/Reader.tsx` — Cleanup post-test

- Retirer le switcher A/B/C (les 3 boutons sticky en haut).
- Retirer le state `glassVariant`, le type `GlassVariant`, les maps `glassChipClass`/`glassHeaderClass`.
- `HeaderChip` : prop `glass` → simple booléen (ou retirer la prop et coder en dur `glass-chip-subtle` puisqu'il n'y a plus qu'une variante).
- Header : `className="... glass-subtle ..."` en dur.

---

## Détails techniques

- `isolation: isolate` crée un nouveau stacking context → le backdrop-filter n'échantillonne que ce qui est derrière le header dans son propre contexte de composition.
- `translateZ(0)` force la promotion en couche GPU. Ça coûte un peu de mémoire vidéo mais c'est négligeable pour un header.
- La quantisation à 2 décimales ne sera pas visible à l'œil (la hauteur header passe de ~120px à ~64px, soit ~56px de course → 56/100 = 0.56px par step, en dessous du seuil de perception).

---

## Risques

- Sur Android Chrome très bas de gamme, `will-change: backdrop-filter` peut augmenter l'usage mémoire. Acceptable, c'est juste un élément.
- Si après ces 3 changements il reste un léger shimmer, il faudra envisager l'option **B** précédente (header taille fixe, n'animer que le contenu intérieur).

---

## Validation

1. Scroller lentement et rapidement sur Reader (mobile preview 390px).
2. Vérifier que :
   - Le flou est visiblement plus clair (texte derrière mieux lisible).
   - Plus de shimmer/tremblement pendant le scroll.
   - L'animation de rétrécissement du header reste fluide.
3. Puis on décide si on généralise (BottomNav, Library, popups).
