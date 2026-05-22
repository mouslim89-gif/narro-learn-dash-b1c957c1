# Habiller Settings et Auth dans le thème éditorial

## Objectif
Aligner `Settings`, `Auth` et `ResetPassword` sur le langage visuel de Library / MyBooks / BookDetail : fond papier chaud, wordmark serif, kanji watermark, chips flottants `rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40`, cartes `rounded-2xl bg-card ring-1 ring-border/30 shadow-sm`.

## Settings (`src/pages/Settings.tsx`)

Header éditorial cohérent avec Library/MyBooks :
- Bandeau `library-header-bg` avec kanji watermark `設` (settings) en filigrane.
- Titre en serif `wordmark font-serif`, sous-titre fin gris avec liseré.
- Bouton retour en chip rond flottant (`rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40`), aligné sur le pattern Library.

Sections :
- Remplacer les rangées plates par des cartes `rounded-2xl bg-card ring-1 ring-border/30 shadow-sm` regroupant Account / Appearance / Reading.
- Titres de section : petite étiquette serif + filet horizontal (au lieu du `uppercase tracking-wider` actuel).
- Carte "Signed in as" : avatar circulaire avec initiale, email tronqué, accent doré subtil.
- Boutons Sign out / Delete : Sign out en `variant="outline"` arrondi (`rounded-xl`), Delete déplacé en bas, plus discret (lien `text-destructive`).

Améliorations possibles tant qu'on y est :
- Regrouper les 3 réglages d'apparence (dark mode, font size, furigana) dans une seule carte avec séparateurs `border-border/40`.
- Le sélecteur de taille de police passe en segmented control `rounded-full bg-muted p-1` (option active = `bg-card shadow-sm`).
- Ajouter une carte "About" en bas avec version de l'app et lien GitHub (placeholder), pour donner de la matière.

## Auth (`src/pages/Auth.tsx`)

Fond et structure :
- Remplacer `bg-background` plat par le même fond papier que Library (`library-header-bg` en plein écran ou variante simplifiée), avec kanji watermark `読` (lire) très discret en arrière-plan.
- Carte centrale : `rounded-3xl bg-card/95 backdrop-blur-md ring-1 ring-border/40 shadow-lg p-8` au lieu d'un bloc nu sur fond uni — donne le côté "page éditoriale".

Wordmark :
- Titre "Tsundoku" en `wordmark font-serif` (cohérent avec Library) au lieu de `font-bold` Inter.
- Sous-titre avec petit liseré comme dans Library.

Champs et boutons :
- Inputs en `h-12 rounded-xl bg-muted/50 border-transparent` avec focus ring doré (`focus-visible:ring-primary/40`), même esprit que la barre de recherche Library.
- Boutons OAuth : `rounded-xl h-12` avec hover `bg-muted/60`.
- Bouton principal : `rounded-xl h-12 bg-primary` avec micro-anim `tap-scale-sm`.
- Séparateur "or" : remplacer le texte uppercase par un filet fin + petit caractère japonais `・` au centre (touche éditoriale).

Switcher signin/signup/forgot :
- Garder en l'état mais styliser les liens en `text-accent` (doré) plutôt que `text-primary`.

## ResetPassword (`src/pages/ResetPassword.tsx`)
- Même habillage que Auth : fond papier + carte `rounded-3xl ring-1 shadow-lg`, wordmark serif, mêmes styles d'inputs/boutons.
- Sous-titre court et liseré identique.

## Hors scope
- Pas de changement de logique (auth, profile, RLS, navigation).
- Pas de modification des composants UI partagés (`Input`, `Button`, etc.) — uniquement classNames au site d'utilisation.
- Pas de nouveau token de couleur ; on réutilise `--card`, `--accent`, `--muted` et les utilitaires existants (`library-header-bg`, `library-kanji-watermark`, `wordmark`, `tap-scale-sm`, `smooth-colors`).

## Fichiers modifiés
- `src/pages/Settings.tsx`
- `src/pages/Auth.tsx`
- `src/pages/ResetPassword.tsx`
