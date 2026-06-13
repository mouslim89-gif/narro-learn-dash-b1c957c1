## Objectif
Remplacer le fond final scrollé (background opaque 85% + blur 16px) des 4 headers stickys par le voile glass du reader (`.glass-subtle` : 42% opacité, blur 6px saturate 180%, border-bottom soft). Le fond reste transparent en haut de page et monte progressivement vers le glass au scroll (comportement actuel conservé, juste la **cible** change).

## Pages modifiées
- `src/pages/Library.tsx`
- `src/pages/MyBooks.tsx`
- `src/pages/Dictionary.tsx`
- `src/pages/Flashcards.tsx`
- `src/pages/WordDetail.tsx`

## Changements

### 1. Library / MyBooks / Dictionary / Flashcards (sticky progressifs)
Dans le `style={{...}}` du `<header>`, remplacer :
```
backgroundColor: 'hsl(var(--background) / calc(var(--p, 0) * 0.85))'
backdropFilter:  'blur(calc(var(--p, 0) * 16px))'
borderBottom:    '1px solid hsl(var(--border) / calc(var(--p, 0) * 0.5))'
```
par les cibles du reader (`glass-subtle` : 0.42 / 6px / border 0.35) :
```
backgroundColor:      'hsl(var(--background) / calc(var(--p, 0) * 0.42))'
backdropFilter:       'blur(calc(var(--p, 0) * 6px)) saturate(180%)'
WebkitBackdropFilter: 'blur(calc(var(--p, 0) * 6px)) saturate(180%)'
borderBottom:         '1px solid hsl(var(--border) / calc(var(--p, 0) * 0.35))'
```
Le padding qui se réduit et l'effet de collapse ne changent pas.

### 2. WordDetail (sticky simple, non progressif)
Aujourd'hui : `bg-background/80 backdrop-blur-md` constant. Remplacer la classe par la classe utilitaire existante `glass-subtle` pour aligner le rendu sur le reader (voile constant ici puisqu'il n'y a pas de variable de scroll mise en place sur cette page).

## Hors scope
- Settings (header éditorial non-sticky avec `library-header-bg` + kanji watermark) — pas touché.
- BookDetail (header avec gradient teinté de la couverture du livre) — pas touché.
- Reader header — déjà la référence.
- Aucune modification de `.glass-subtle` dans `src/index.css`.

## Validation
Vérifier sur preview mobile (390×646) que :
- Au top de page, le header reste transparent (sauf WordDetail qui est constant).
- En scrollant, le voile arrive plus léger et plus naturel qu'avant, identique au reader.
- La border-bottom reste lisible mais discrète.
