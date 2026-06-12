## 3 fixes ciblés

### 1. Teinte dans le verre (dark mode)

**Cause** : `.glass-subtle` utilise `background: hsl(var(--background) / 0.38)`. En dark, `--background` (220 15% 8%) est posé par-dessus l'article (`--card` 220 15% 12%) → le header apparaît plus sombre/bleuté que ce qui est derrière. C'est ce "filtre couleur" qu'on voit.

**Fix** dans `src/index.css` `.glass-subtle` :
- Remplacer `background: hsl(var(--background) / 0.38)` par une teinte **neutre** alignée avec la luminance derrière, et beaucoup plus faible :
  - Light mode : `background: hsl(0 0% 100% / 0.25)` (blanc pur très léger)
  - Dark mode (via `.dark .glass-subtle`) : `background: hsl(0 0% 0% / 0.18)` (noir pur très léger)
- Le verre ne réinjecte plus la couleur du token `--background` → plus de cast bleuté.
- Garder `inset 0 1px 0 hsl(0 0% 100% / 0.22)` pour le highlight (c'est l'effet "verre", pas un cast couleur).

### 2. Chips : transparence légère + flou + relief (sans liquid glass)

**Cause** : on est revenu à `bg-card shadow-sm` opaque → trop massif et plus de relief verre.

**Fix** :
- Recréer la classe `.glass-chip` dans `index.css` :
  ```css
  .glass-chip {
    background: hsl(0 0% 100% / 0.55);              /* light */
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
    box-shadow:
      inset 0 1px 0 hsl(0 0% 100% / 0.35),          /* relief haut */
      inset 0 -1px 0 hsl(0 0% 0% / 0.06),
      0 1px 2px hsl(0 0% 0% / 0.06);                /* shadow externe douce */
  }
  .dark .glass-chip {
    background: hsl(0 0% 0% / 0.30);
    box-shadow:
      inset 0 1px 0 hsl(0 0% 100% / 0.10),
      inset 0 -1px 0 hsl(0 0% 0% / 0.4),
      0 1px 2px hsl(0 0% 0% / 0.3);
  }
  ```
- Dans `src/pages/Reader.tsx`, `HeaderChip` : remplacer `bg-card shadow-sm` par `glass-chip`. Garder `ring-1`/`ring-border/40` et le `tap-scale-sm`.
- Pas de SVG filter sur les chips → pas d'effet "centre de déformation" parasite, juste flou + relief.

### 3. Distorsion non uniforme (faux "centre" sur le titre)

**Cause** : `baseFrequency="0.006 0.014"` produit des **grosses bosses** de bruit basse fréquence — ça crée des zones de déplacement très différentes (une grosse "lentille" au milieu), d'où l'impression d'un verre bombé localisé.

**Fix** dans `index.html` filtre `#liquid-glass` :
- Monter `baseFrequency` à `"0.018 0.024"` (bruit plus fin, plus dense) → la distorsion devient un grain régulier sur toute la surface, comme du verre dépoli homogène.
- Baisser `scale` de `32` à `18` pour compenser (sinon ça devient agressif avec une fréquence + haute).
- Garder `numOctaves="2"`, `stdDeviation="2"`, `seed="4"`.
- Étendre la zone du filtre pour éviter les artefacts de bord : `x="-20%" y="-20%" width="140%" height="140%"`.

### Validation

1. Ouvrir Reader en dark : header doit avoir la même luminance que l'article derrière, sans cast bleu.
2. Vérifier en light que ça marche aussi.
3. Chips : flou visible, légère transparence, petit highlight en haut (relief).
4. Scroller doucement : la distorsion doit paraître uniforme sur toute la largeur du header, sans "lentille" autour du titre.

### Fichiers touchés

- `src/index.css` — `.glass-subtle` (neutralise teinte) + nouvelle classe `.glass-chip`
- `src/pages/Reader.tsx` — `HeaderChip` : swap classes
- `index.html` — paramètres du filtre `#liquid-glass`
