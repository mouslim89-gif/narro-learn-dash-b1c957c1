# Plan — Harmoniser les barres de recherche + nettoyer Dictionary

## Constat

- **Library** (`src/pages/Library.tsx` l.65-70) : `h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background` — avec ombre intérieure et focus ring teal. Clear button = simple icône ghost.
- **Flashcards** (`src/pages/Flashcards.tsx` l.183-188) : `h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10` — pas d'ombre, pas de focus ring custom. Pas de clear button.
- **Dictionary** (`src/pages/Dictionary.tsx`) : même base que Flashcards + bouton clear stylé en cercle ring.

→ La référence visuelle (Library) a `shadow-inner-sm` + `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background`. C'est ce qui fait la différence ressentie.

## Changements

### 1. Style d'input unifié (référence = Library)

Appliquer la même className sur les trois pages :

```
h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm
shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background
```

- `src/pages/Library.tsx` : inchangé (référence).
- `src/pages/Flashcards.tsx` l.187 : ajouter `text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background`.
- `src/pages/Dictionary.tsx` : remplacer la className actuelle de l'`Input` par la même.

### 2. Bouton clear unifié (référence = Library, plus discret)

Dans Dictionary, remplacer le cercle ring actuel par le style ghost simple de Library :

```tsx
<button
  onClick={clearQuery}
  aria-label="Clear search"
  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
>
  <X className="h-3.5 w-3.5" />
</button>
```

(Flashcards n'a pas de clear button — on ne l'ajoute pas, l'utilisateur ne l'a pas demandé.)

### 3. Retirer le gradient des mots "Common" dans Dictionary

Dans `src/pages/Dictionary.tsx`, sur la carte de résultat :
- Supprimer le `style={ backgroundImage: 'linear-gradient(...)' }` conditionnel.
- Supprimer le `<div className="absolute inset-0 bg-card -z-10" />` palliatif.
- Mettre simplement `bg-card` sur le wrapper de toutes les cartes.
- Garder le **tag** "✦ Common" (pill primary) — c'est lui qui signale le statut common, pas besoin du fond gradient.

## Fichiers modifiés

- `src/pages/Dictionary.tsx`
- `src/pages/Flashcards.tsx`
