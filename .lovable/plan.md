# Plan — Étendre le thème éditorial au Reader

Refonte purement visuelle. Aucune modif sur la logique de lecture, la tokenization, l'audio sync, les stores ou les data shapes.

## Règles cardinales

- Le confort de lecture prime : aucune teinte/gradient ne touche le corps du texte japonais.
- `book.coverColor` est l'ancre visuelle de la page (header, marker chapitre, états sélectionnés du panneau settings, slider audio).

---

## 1. Header — chips flottants + teinte cover-color

Dans `src/pages/Reader.tsx` (l.571–626) :

- Remplacer le `border-b border-border/40 bg-card/80` par un wrapper sticky avec gradient cover-color + `backdrop-blur-xl`.
- Bouton back : chip `h-10 w-10 rounded-full bg-background/70 ring-1 ring-border/40 backdrop-blur-md`.
- Bloc central condensé : titre japonais (font-japanese, gras, tronqué) + sous-ligne discrète `{difficultyConfig[difficulty].label} · ~{minutesLeft}m left` (pas de `shortLabel` — n'existe pas, on utilise `label`).
- Cluster d'actions à droite : composant inline `HeaderChip` (forwardRef sur button) — tous identiques `h-10 w-10 rounded-full ring-1` ; état `active` → tinted primary (`bg-primary/15 text-primary ring-primary/25`), sinon `bg-background/70 text-foreground/70 ring-border/40`.
  - Furigana toggle (Eye / EyeOff)
  - Grammar notes (BookOpen)
  - Settings (Settings)
  - Edit mode (admin uniquement) (Pencil)
- **Hairline de progression de lecture** dans la couleur du livre, juste sous le header :
  ```tsx
  <div className="h-[2px] w-full bg-border/30">
    <div style={{ width: `${readingPct}%`, backgroundColor: book.coverColor }} className="h-full transition-[width]" />
  </div>
  ```
  Le `readingPct` est déjà calculé pour la barre existante — réutiliser la même valeur.

---

## 2. Corps de l'article — feel "page" + marker de chapitre

Article wrapper (l.780–932) — garder `bg-card` pour ne pas perturber le contraste du texte. Trois touches :

- Ajouter `ring-1 ring-border/30 overflow-hidden` au wrapper article.
- Ajouter en haut de l'article un fade `h-3` en teinte cover-color :
  ```tsx
  <div className="h-3 w-full" style={{ backgroundImage: `linear-gradient(to bottom, ${book.coverColor}1f, transparent)` }} aria-hidden />
  ```
- Marker de chapitre (uniquement si `book.chapters && book.chapters.length > 1`) :
  ```tsx
  <div className="px-6 pt-6 pb-2 text-center">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Chapter {chapterIndex + 1}</p>
    <p className="mt-1 font-serif text-lg font-bold">{chapter.title}</p>
    <div className="mx-auto mt-3 h-px w-12 bg-border/60" />
  </div>
  ```
- **Aucune modification** de `ReaderToken`, `FuriganaWord`, des règles `.reader-text` dans `src/index.css`, ni du rendering des paragraphes/sentences.

---

## 3. Popups d'interaction

### 3a. `src/components/WordMiniPopup.tsx`

- **Supprimer le bloc JLPT badge** (l.210–212).
- Container : remplacer le fond par un gradient subtil
  `style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 50%)' }}` ; conserver `rounded-2xl shadow-xl ring-1 ring-border/50`.
- Bouton save (étoile) : `rounded-full h-8 w-8 flex items-center justify-center` — saved `bg-amber-500/15 text-amber-700 dark:text-amber-300`, sinon `bg-muted/60 text-muted-foreground hover:text-amber-600`.
- Mot : `font-japanese text-base font-bold` ; reading : `font-japanese text-[11px] text-muted-foreground`.
- POS : `font-serif italic text-[11px] text-muted-foreground` (au lieu d'un pill coloré).
- Bouton "More" : `rounded-full text-[11px] font-semibold text-primary px-2.5 py-1 hover:bg-primary/10`, pas de border.

### 3b. `src/components/WordPopup.tsx`

- **Supprimer le badge JLPT** (l.297–300).
- Header drawer :
  - Mot `font-japanese text-3xl font-bold`
  - Reading `font-japanese text-base text-muted-foreground`
  - Romaji `text-xs italic text-muted-foreground/70`
- Sections (Meanings, Conjugations, Examples) : label
  `<p className="font-serif text-[13px] font-semibold text-foreground/80">…</p>`
  + `<div className="mt-1 h-px w-8 bg-border/60" />`.
- Meanings : `<p className="font-serif text-sm"><span className="text-muted-foreground tabular-nums mr-1">{i+1}.</span>{m}</p>`.
- Phrases d'exemple : carte tintée
  ```tsx
  <div className="relative rounded-xl bg-muted/40 ring-1 ring-border/30 px-4 py-3">
    <span className="absolute left-1.5 top-1 font-serif text-2xl text-muted-foreground/40 select-none">"</span>
    <p className="font-japanese text-[15px] leading-relaxed pl-3">{jp}</p>
    <p className="mt-1 text-[12px] text-muted-foreground pl-3">{en}</p>
  </div>
  ```
- Bouton save-to-flashcards : `size="sm" className="rounded-full px-4 shadow-md"`.
- Table de conjugaison : wrapper `rounded-xl bg-muted/30 p-3 ring-1 ring-border/30`, header row `font-serif text-[12px] uppercase tracking-wider text-muted-foreground`, cellules `font-japanese tabular-nums text-[13px]`.

### 3c. `src/components/SentenceTranslationPopup.tsx`

- Wrapper de la phrase traduite : même style "quote card" tintée que les exemples ci-dessus (`bg-muted/40 ring-1 ring-border/30`, guillemet serif en filigrane, JP japonais + EN muted). Pas de changement de structure.

---

## 4. Audio player — `src/components/AudioPlayer.tsx`

Convertir le bar sticky plein-largeur en pill flottante au-dessus de la bottom nav :

- Wrapper extérieur :
  ```tsx
  <div className="fixed inset-x-0 bottom-[88px] z-30 px-4 pointer-events-none">
    <div className="mx-auto max-w-md pointer-events-auto rounded-2xl bg-background/85 backdrop-blur-xl ring-1 ring-border/40 shadow-lg">
      …
    </div>
  </div>
  ```
  (Le `bottom-[88px]` ≈ hauteur de la nav pill + gap ; à ajuster visuellement après merge si décalé.)
- Layout intérieur : `flex items-center gap-3 px-3 py-2`
  - Play/pause : conserver gradient `bg-gradient-to-br from-primary to-primary/80 h-10 w-10 rounded-full shadow-md`.
  - Temps courant : `text-[11px] tabular-nums text-muted-foreground` (3 chars min).
  - Slider : `flex-1 h-1.5`. Garder le token primary par défaut (l'override `--audio-fill` via coverColor est optionnel — on saute pour ne pas toucher au composant Slider).
  - Temps restant : `text-[11px] tabular-nums text-muted-foreground`.
  - Speed selector : remplacer le select inline par un chip `rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-border/40` qui ouvre un `Popover` shadcn listant 0.75× / 1.0× / 1.25× / 1.5× (mêmes valeurs qu'aujourd'hui).
- Aucune modification des callbacks (`onTimeUpdate`, `onScrub`, `onPlay/Pause`).

---

## 5. Panneau Settings (Reader.tsx:628–755)

- Wrapper : `rounded-2xl bg-card ring-1 ring-border/40 p-5 space-y-5` (au lieu d'une carte plate).
- Helpers inline dans `Reader.tsx` :
  - `SettingsSection({label, children})` : label en serif uppercase `text-[10px] font-semibold tracking-[0.18em] text-muted-foreground` + hairline `h-px w-8 bg-border/60` + contenu.
  - `SegmentedRow({value, options, labels, onChange, coverColor})` : grille `grid gap-2` avec `gridTemplateColumns: repeat(N, minmax(0,1fr))`. Chaque bouton :
    - Sélectionné : `ring-2 ring-primary/40 border-transparent shadow-sm text-foreground` + `style={{ backgroundImage: \`linear-gradient(140deg, ${coverColor}26 0%, hsl(var(--card)) 70%)\` }}`.
    - Non sélectionné : `border-border/40 bg-background text-muted-foreground hover:border-border`.
- Sections appliquées :
  - Font size : S / M / L
  - Japanese font : Sans / Serif / Hand
  - Difficulty : valeurs existantes
  - Theme : Light / Dark (2 colonnes)
  - Display mode : valeurs existantes
  - Highlights : conserver les toggles mastery-tint actuels, mais restylés en chips `rounded-full` avec le même pattern tinted-selected.

---

## Fichiers touchés

- `src/pages/Reader.tsx`
- `src/components/WordMiniPopup.tsx`
- `src/components/WordPopup.tsx`
- `src/components/SentenceTranslationPopup.tsx`
- `src/components/AudioPlayer.tsx`

## Fichiers explicitement non touchés

- `src/components/ReaderToken.tsx`, `src/components/FuriganaWord.tsx`
- `src/components/GrammarPanel.tsx`, `src/components/TokenEditPanel.tsx`, `src/components/TokenEditFloatingBar.tsx`
- Tous les stores, toutes les data, tous les helpers de tokenization
- Les règles `.reader-text` dans `src/index.css`

## Notes d'implémentation

- `difficultyConfig` n'a pas de `shortLabel` — on utilise `label` directement.
- `HeaderChip` et les helpers Settings sont définis **inline** dans `Reader.tsx`, pas de nouveau fichier composant.
- Le hairline de progression réutilise le même `%` que la barre existante (pas de nouveau calcul).
- Le marker chapitre n'apparaît que si `book.chapters.length > 1`.
