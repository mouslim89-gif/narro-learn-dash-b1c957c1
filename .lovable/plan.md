# Glass effect — Reader test (3 intensities, A/B/C switcher)

Goal: tester l'effet glass sur le header sticky du Reader et les `HeaderChip` (back + furigana + translations + grammar + settings), avec un toggle temporaire pour comparer 3 intensités. Si une variante plaît, on la généralise ensuite (BottomNav, sticky headers Library/MyBooks, popups).

## Scope (test uniquement)

- Header sticky du Reader (`src/pages/Reader.tsx` lignes 935-1025)
- Composant `HeaderChip` (lignes 113-133) — partagé par 5 boutons
- Aucun autre fichier touché tant que tu n'as pas validé

## Note importante

Le header actuel a déjà `backdrop-blur-xl` mais avec un `linear-gradient` opaque par-dessus (`book.coverColor` à 0x1f + `--background / 0.85`). Le blur ne se voit quasiment pas. Le vrai gain visuel viendra de réduire l'opacité du fond pour laisser passer le texte/contenu derrière le verre.

## Les 3 intensités (CSS utilities à ajouter dans `src/index.css`)

```css
/* A — Subtle (warm paper-friendly) */
.glass-subtle {
  background: hsl(var(--background) / 0.70);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid hsl(var(--border) / 0.5);
}

/* B — Standard iOS-like */
.glass-standard {
  background: hsl(var(--background) / 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid hsl(var(--border) / 0.4);
  box-shadow: 0 1px 0 hsl(0 0% 100% / 0.04) inset;
}

/* C — Heavy frosted */
.glass-heavy {
  background: hsl(var(--background) / 0.40);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border-bottom: 1px solid hsl(var(--border) / 0.35);
  box-shadow:
    0 1px 0 hsl(0 0% 100% / 0.06) inset,
    0 4px 16px -8px hsl(220 15% 8% / 0.10);
}

/* Variantes chips — même grain, padding identique au .reader-icon-btn */
.glass-chip-subtle   { background: hsl(var(--background) / 0.55); backdrop-filter: blur(12px) saturate(140%); }
.glass-chip-standard { background: hsl(var(--background) / 0.40); backdrop-filter: blur(18px) saturate(180%); }
.glass-chip-heavy    { background: hsl(var(--background) / 0.25); backdrop-filter: blur(24px) saturate(200%); }
```

Toutes les variantes gardent le `ring-1 ring-border/40` existant (le ring fait 90% du sentiment "verre" sur mobile).

## Le switcher temporaire

Petit segmented control flottant en haut-droit du Reader, visible uniquement en dev (ou toujours, à toi de voir), 3 boutons A / B / C. État local (`useState<'A'|'B'|'C'>`), pas persisté. Switche la classe appliquée au header **et** aux HeaderChips en temps réel.

```
┌─────────────────────────────┐
│ [←]   雲の糸 ▾    [A│B│C]   │  ← switcher en mini-pill
│ ─── progress ─────────────  │
└─────────────────────────────┘
```

Le switcher remplace temporairement aucun bouton — il s'ajoute à droite des chips existants, en petit (h-6, text-[10px]). Une fois la variante choisie, on retire le switcher et on fige la classe.

## Changements précis

### `src/index.css`
Ajouter le bloc CSS ci-dessus à la fin du fichier, sous un commentaire `/* Glass surfaces — experimental */`.

### `src/pages/Reader.tsx`

1. Ajouter `const [glassVariant, setGlassVariant] = useState<'A'|'B'|'C'>('A')` près des autres états UI.
2. `HeaderChip` : prop optionnelle `glass?: 'A'|'B'|'C'`. Si fournie, remplace `bg-background/70 backdrop-blur-md` par la `.glass-chip-*` correspondante. Reste rétro-compatible (les autres usages ne changent pas — il n'y en a pas hors Reader).
3. Header (ligne 935) :
   - Retirer le `style={{ backgroundImage: ... }}` (le gradient masque le glass).
   - Remplacer `backdrop-blur-xl` par la classe `glass-{subtle|standard|heavy}` selon `glassVariant`.
   - Garder un fin trait coloré du livre comme accent : repasser `book.coverColor` en `border-bottom` 2px à la place du tracker, OU laisser la progress bar 2px existante (déjà coloriée avec `book.coverColor`) — pas de changement à ce niveau.
4. Passer `glass={glassVariant}` à chaque `HeaderChip`.
5. Ajouter le mini-switcher segmented à droite du dernier chip (ou en absolu top-right si trop serré sur 360px).

## Aucun autre fichier modifié

Pas de BottomNav, pas de Library, pas de popups. Test isolé au Reader.

## Étape suivante (après validation)

Une fois que tu choisis A, B ou C :
1. Retirer le switcher.
2. Figer la classe glass dans le header + HeaderChip.
3. Te demander pour quels autres surfaces on l'applique (BottomNav, sticky headers Library/MyBooks/Dictionary, WordMiniPopup, settings panel reader, etc.).

## Risques / points d'attention

- `backdrop-filter` est OK partout sur iOS Safari 15+ / Android Chrome moderne — pas de fallback nécessaire pour ta cible.
- Sur le reader avec beaucoup de texte dense, la variante C (heavy) peut rendre le titre japonais derrière le chip illisible 1-2 frames pendant le scroll. À surveiller à l'œil.
- Le gradient retiré (`book.coverColor`) faisait office d'identité visuelle par livre. Si ça te manque, on peut le réintroduire en `::before` à opacité 0.10 derrière le glass, sans casser le blur.
