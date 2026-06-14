
## Objectif

Remplacer le header actuel de `src/pages/WordDetail.tsx` (compact, back+titre+star) par un header de type **page d'accueil** (Library/MyBooks/Dictionary), adapté au contexte japonais : le mot consulté devient le grand titre.

## Comportement visuel

Reproduire à l'identique le pattern de `Library.tsx` :

- `<header>` `sticky top-0 z-30` avec `library-header-bg`
- Watermark **adapté JP** : le caractère affiché en watermark devient le **premier kanji** du mot (fallback : premier caractère du mot) — au lieu de 積/漢
- Scroll-shrink piloté par `useScrollProgress(headerRef, 0, 64)` :
  - paddings, backdrop-blur, fond background/0.85 et border-bottom qui apparaissent à mesure que `--p` monte
  - `AnimatedTitle` qui rétrécit via `--title-scale: calc(1 - var(--p) * 0.429)` (42px → 24px)
- **Titre** = le mot japonais (`display`), rendu via `AnimatedTitle` avec :
  - `className="wordmark font-japanese font-bold tracking-tight leading-none text-foreground"`
  - `fontSize: '42px'`
  - `key={display}` pour rejouer l'animation lettre par lettre quand le mot change
- **Sous-ligne** sous le titre (dans le bloc `min-w-0`) : reading en `font-japanese text-muted-foreground` + romaji italique muted/70 — uniquement quand `result` est chargé et que `reading !== display`. Masquée progressivement avec `opacity: calc(1 - var(--p))`.

## Actions à droite/gauche

Conservé "intégrés dans le header" (pas de chip flottant) :

- **Gauche** : à l'intérieur du `<header>`, avant le bloc titre, bouton back rond `h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip` avec `<ArrowLeft />`. Garde la logique `handleBack` actuelle (reopen-word-popup → returnPath).
- **Droite** : star button en chip `header-chip` même style que Library (`h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40`), couleur `text-accent` quand `saved`, sinon `text-muted-foreground`. Affichée seulement si `result` est chargé (sinon placeholder invisible pour ne pas faire sauter le layout).

Layout du header : `flex items-center justify-between` avec back (gauche, z-10), bloc titre (centre flex-1 min-w-0, z-10), star (droite, z-10). Watermark en background.

## Hors header

Ne **rien changer** au contenu sous le header (card "Header card" avec tags + CTA, sections Kanji / Meanings / Examples / Conjugation). On supprime juste la duplication visuelle du titre dans la card du haut ? **Non** — on garde la card telle quelle, elle reste utile pour les tags, le PlayWordButton et le CTA "Add to flashcards". Le grand titre du header et le titre de la card coexistent comme dans Library (header "Tsundoku" + cards livres).

## Détails techniques

Fichier modifié : `src/pages/WordDetail.tsx` uniquement.

Nouveaux imports : `useRef` (react), `useScrollProgress` (`@/hooks/use-scroll-progress`), `AnimatedTitle` (`@/components/AnimatedTitle`), `toRomaji` déjà importé.

Calcul du watermark :
```ts
const watermarkChar = useMemo(() => {
  const kanji = extractKanji(display)[0];
  return kanji || display[0] || '?';
}, [display]);
```

Structure JSX du header (remplace lignes ~129-153) :
```tsx
<header
  ref={headerRef}
  className="library-header-bg sticky top-0 z-30 px-4 flex items-center gap-2 overflow-hidden"
  style={{ paddingTop, paddingBottom, backgroundColor, backdropFilter, borderBottom, transition }}
>
  <span className="library-kanji-watermark font-japanese" aria-hidden style={{ opacity: 'calc(1 - var(--p, 0))' }}>
    {watermarkChar}
  </span>
  <Button ... back chip ... className="... header-chip relative z-10 shrink-0" />
  <div className="relative z-10 flex-1 min-w-0">
    <AnimatedTitle key={display} text={display} className="wordmark font-japanese font-bold ..." style={{...}} />
    {result && reading && reading !== display && (
      <p className="font-japanese text-sm text-muted-foreground truncate mt-1" style={{ opacity: 'calc(1 - var(--p, 0))' }}>
        {reading} · <span className="italic text-muted-foreground/70">{toRomaji(reading)}</span>
      </p>
    )}
  </div>
  {result && <button ... star chip ... className="... header-chip relative z-10 shrink-0" />}
</header>
```

Padding initial similaire à Library : `calc(48px - var(--p) * 36px)` top, `calc(24px - var(--p) * 16px)` bottom. La marge `mt-2` du contenu actuel reste.

## Risques / arbitrages

- **Watermark JP** : `.library-kanji-watermark` est dimensionné pour un caractère unique — un kanji japonais s'y rend bien. Ajout de `font-japanese` pour assurer le rendu Noto.
- **AnimatedTitle sur du japonais** : l'animation letter-by-letter fonctionne avec `Array.from(text)`, donc chaque kanji/kana est animé individuellement. OK.
- **Largeur du titre 42px sur mots longs (3-4 kanji)** : truncate sur le wrapper `min-w-0` évite le débordement ; à l'extrême le titre passe en `text-overflow` car le `<span>` interne d'`AnimatedTitle` est `inline-block`. Si besoin, on scope `fontSize` à 36px quand `display.length > 4` (à confirmer après preview).
- **Scope** : aucun changement sur le contenu sous le header ni sur les autres pages.
