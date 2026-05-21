# Plan — Nouvelle UI pour la page Dictionary

Refonte purement visuelle de `src/pages/Dictionary.tsx` pour reprendre le langage UI introduit sur Flashcards / BottomNav (pills arrondies, ring-border/40, card-lift, gradients subtils). Aucune logique métier modifiée (Jisho, save, debounce restent identiques).

## 1. Masthead simplifié

- Remplacer l'en-tête actuel par un masthead aligné sur Flashcards mais sans sous-texte :
  - `<h1 class="font-serif text-[34px] font-bold leading-none tracking-tight">Dictionary</h1>`
  - Bouton Settings à droite : `h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40` (identique Flashcards).
- Wrapper : `header relative px-6 pt-10 pb-2 flex items-start justify-between`.

## 2. Barre de recherche — pill avec clear intégré

- Container `mt-5 px-6 relative`.
- Icône `Search` à `left-9`, input `h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-11`.
- Bouton `X` (quand `query` non vide) positionné `absolute right-9` dans un petit cercle muted : `h-7 w-7 rounded-full bg-background/70 ring-1 ring-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.94]`.

## 3. État loading / empty / placeholder

- Loading : centrer dans un petit chip pill `mt-6 inline-flex items-center gap-2 rounded-full bg-muted/60 px-3.5 py-1.5 ring-1 ring-border/40` avec spinner + "Searching…".
- Placeholder initial (pas de query) : bloc centré façon empty state Flashcards :
  - Cercle `h-20 w-20 rounded-full bg-primary/10 ring-1 ring-primary/20` + icône `Search` primary.
  - Titre serif `font-serif text-lg font-semibold` "Search the dictionary".
  - Sous-texte muted `text-sm` "Type a word in Japanese or English…".
- "No results" : même petit message centré, sans cercle.

## 4. Cartes de résultats — version "plus riche"

Pour chaque `JishoResult`, carte avec :

- Wrapper `relative rounded-2xl p-5 ring-1 ring-border/40 card-lift overflow-hidden`.
- Si `is_common` : gradient subtil au lieu de la bordure gauche.
  - `style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--card)) 55%)' }}`
  - Sinon : `bg-card`.
- Bouton Save (étoile) en cercle ring façon icône nav : `absolute top-4 right-4 h-9 w-9 rounded-full ring-1 ring-border/40 bg-background/70 backdrop-blur-md flex items-center justify-center` ; couleur étoile : `text-accent` quand saved (fill currentColor), `text-muted-foreground hover:text-accent` sinon.
- Ligne mot + reading + romaji + play : conserver le layout actuel (font-japanese 20px bold, reading muted, romaji italique).
- Tags pill (Common / JLPT / parts of speech) : harmoniser sur `rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1`
  - Common : `bg-primary/10 text-primary ring-primary/20` avec étoile ✦.
  - JLPT : `bg-accent/10 text-accent ring-accent/20 uppercase`.
  - POS : `bg-muted text-muted-foreground ring-border/40`.
- Meanings : conserver liste numérotée, espacement actuel.
- `ExampleSentence` et `ConjugationTable` : inchangés (séparés du contenu par `mt-3 pt-3 border-t border-border/40` si non vides — laisser les composants gérer leur propre marge interne).

## 5. Détails

- Padding global : passer le wrapper page à `pb-24 pt-2` (le masthead gère son propre `pt-10`), conserver `px-6` au niveau des sections.
- Liste résultats : `mt-5 flex flex-col gap-3 px-6` (sortir le padding du wrapper page pour pouvoir mettre le masthead full-width plus tard si besoin — facultatif, peut rester `px-6` sur le wrapper page).
- Aucun changement aux imports d'icônes (Search, Star, Loader2, X, Settings déjà présents).

## Fichiers modifiés

- `src/pages/Dictionary.tsx` (un seul fichier)

## Non concerné

- Logique Jisho, debounce, save flashcard, types.
- `ExampleSentence` / `ConjugationTable` (composants enfants conservent leur style actuel).
