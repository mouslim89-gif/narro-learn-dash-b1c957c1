## Goal

Transformer la pilule active de la BottomNav en effet **liquid glass + lentille radiale** (CSS only). Pas d'animation de reflet, pas de changement de centrage.

## Changements

### 1. `src/index.css` — refonte de `.nav-pill-active`

Remplacer la définition actuelle par un empilement de couches glass + lentille :

- **Base translucide** : `hsl(var(--card) / 0.55)` au lieu du `foreground/0.08` actuel — vrai feeling verre, pas un gris terne.
- **Backdrop-filter** : `blur(10px) saturate(180%)` → reprend le contenu derrière (utile car le dock est déjà flouté, ça crée un second niveau de réfraction).
- **Lentille radiale** (effet bombé sans SVG) via `background-image` empilés :
  - Highlight haut bombé : `radial-gradient(ellipse 80% 90% at 50% 30%, hsl(0 0% 100% / 0.35), transparent 60%)`.
  - Ombre douce du bas : `radial-gradient(ellipse 70% 50% at 50% 100%, hsl(var(--foreground) / 0.05), transparent 70%)`.
- **Bord cristallin** : `border: 1px solid hsl(0 0% 100% / 0.28)`.
- **Insets** affinés : top highlight `0.6`, bottom shadow `0.08`, + ombre externe minimale `0 1px 2px`.
- **Variante dark** : base `hsl(var(--card) / 0.4)`, highlight top `0.12`, border `hsl(0 0% 100% / 0.10)`.

Aucun pseudo-élément, aucune animation — le slide entre tabs reste géré par Framer Motion (`layoutId`).

### 2. `src/components/BottomNav.tsx` — ajustement mineur

- Ajouter `overflow-hidden` au `motion.span` actif pour que les gradients respectent le `rounded-full`.

## Détails techniques

```css
.nav-pill-active {
  background:
    radial-gradient(ellipse 80% 90% at 50% 30%, hsl(0 0% 100% / 0.35), transparent 60%),
    radial-gradient(ellipse 70% 50% at 50% 100%, hsl(var(--foreground) / 0.05), transparent 70%),
    hsl(var(--card) / 0.55);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid hsl(0 0% 100% / 0.28);
  box-shadow:
    inset 0 1px 0 hsl(0 0% 100% / 0.6),
    inset 0 -1px 1px hsl(var(--foreground) / 0.08),
    0 1px 2px hsl(210 22% 15% / 0.06);
}
.dark .nav-pill-active {
  background:
    radial-gradient(ellipse 80% 90% at 50% 30%, hsl(0 0% 100% / 0.12), transparent 60%),
    radial-gradient(ellipse 70% 50% at 50% 100%, hsl(0 0% 0% / 0.20), transparent 70%),
    hsl(var(--card) / 0.40);
  border: 1px solid hsl(0 0% 100% / 0.10);
  box-shadow:
    inset 0 1px 0 hsl(0 0% 100% / 0.10),
    inset 0 -1px 1px hsl(0 0% 0% / 0.30),
    0 1px 2px hsl(0 0% 0% / 0.30);
}
```

## Hors scope

- Pas de centrage modifié.
- Pas d'animation de reflet / shimmer.
- Pas de SVG filter.
- Pas de modification du `.nav-dock`.
