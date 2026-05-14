# Library & My Books — UI refresh

## Objectifs
- Library: supprimer **Featured** et le **badge JLPT**. Garder uniquement Continue Reading + carrousels horizontaux par genre.
- My Books: passer en **grille 2 colonnes** propre (3-4 colonnes en md+), garder les stats en haut.
- BookCard: enlever toute la meta (JLPT, durée, audio) — uniquement **titre EN + auteur** sous la couverture.
- Vibe: garder le style actuel mais **plus coloré** (couvertures plus vives, accents teal/coral/purple par genre, headers de section colorés).

## Library (`src/pages/Library.tsx`)
- Supprimer le bloc Featured (lignes 118–152) et l'import `jlptColors` / `Headphones` / `Clock` / `hasAnyAudio` devenus inutiles.
- Retirer `const featured = books[0]`.
- Simplifier le placeholder du search: « Search by title or author… ».
- Colorer les titres de section par genre: chaque genre reçoit une couleur d'accent (teal/coral/purple/amber/rose/indigo), la `section-bullet` prend cette teinte et le label passe d'`uppercase muted` à un titre plus vivant (Nunito bold, taille ~13px, couleur d'accent).
- Continue Reading: garder, mais accent plus marqué (gradient subtil teal→coral en background du card, bouton Resume en `variant="default"` coloré).

## My Books (`src/pages/MyBooks.tsx`)
- Passer la grille à `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4`.
- BookCard sans largeur fixe (voir plus bas) → s'étire sur la colonne.
- Stats: ajouter une touche de couleur (chaque tuile prend son accent: streak=coral, words=teal, saved=purple, done=amber) au lieu du `border bg-card` uniforme. Garder les valeurs/labels actuels.
- Sous chaque carte, garder la ligne `Difficulty · time ago` (utile ici pour la progression).

## BookCard (`src/components/BookCard.tsx`)
- Largeur: remplacer `w-36 md:w-44 flex-shrink-0` par un mode responsive: si utilisée dans un carrousel (Library), garder `w-36`; si dans grille (My Books), `w-full`. Solution: prop optionnelle `variant?: 'carousel' | 'grid'` (défaut `carousel`), ou simplement passer `className` override depuis le parent.
- Supprimer le bloc `jlptColors` badge + durée + l'import `Clock`.
- Garder l'icône audio (casque) en overlay sur la couverture — discrète, pas une meta texte. (Si tu préfères vraiment 0 meta, dis-le et on l'enlève aussi.)
- Sous la couverture: titre EN (medium 12px) + auteur (10px muted). Rien d'autre.
- Couvertures: pousser la saturation — ajouter un léger gradient diagonal coloré au-dessus de `coverColor` pour plus de vibrance.

## Détails techniques
- Pas de changement de data model, pas de migration.
- Pas de nouveau composant — tout en édition des 3 fichiers existants.
- Couleurs des genres: mapper `Genre → token CSS` dans `src/data/books.ts` (ajouter `genreAccents: Record<Genre, string>` en HSL via tokens existants `--primary`, `--accent`, `--secondary` + 3 nouveaux tokens `--genre-amber`, `--genre-rose`, `--genre-indigo` dans `index.css` & `tailwind.config.ts`).

## Question résiduelle
Sur la BookCard je garde l'**icône casque** discrète sur la couverture pour les livres avec audio (utile pour scanner visuellement) — OK ou je retire vraiment tout ?
