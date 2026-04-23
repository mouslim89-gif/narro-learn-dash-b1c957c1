

# Highlights mots connus + raffinement design (révisé)

## 1. Highlights des mots sauvegardés

**3 niveaux de couleur** (fond teinté doux) :
- **New** (mastery 0) → ambre `bg-amber-500/15 dark:bg-amber-400/20`
- **Learning** (mastery 1–2) → bleu ciel `bg-sky-500/15 dark:bg-sky-400/20`
- **Known** (mastery ≥ 3) → vert tendre `bg-emerald-500/15 dark:bg-emerald-400/20`

Style : `rounded-sm`, padding horizontal 1.5px, transition douce.

**Matching** : `Map<string, mastery>` mémoïsé depuis `useFlashcardStore`, indexé par `word` + `reading` normalisés (NFC + katakana→hiragana). Lookup O(1) par token (`token.b ?? token.t`).

## 2. Toggles dans le panneau Settings du reader

Nouvelle section "Highlights" sous "Display Mode" :

- **Master switch** : "Highlight saved words" (on/off global)
- **Quand activé**, 3 sous-toggles individuels :
  - ☑ Show **new** words (ambre)
  - ☑ Show **learning** words (bleu)
  - ☑ Show **known** words (vert)

Chaque sous-toggle accompagné d'une pastille de couleur (mini légende intégrée). Tous les 4 persistés localement dans `reading-progress` store, defaults : master `true`, sous-toggles `true/true/false` (known masqués par défaut — moins utile une fois maîtrisés).

**Compatibilité** : désactivé automatiquement en mode grammar (couleurs POS prennent le dessus). Cohabite avec le highlight de phrase audio.

## 3. Raffinement design (modéré)

### Library header + cartes
- Gradient radial très léger derrière "Tsundoku" (`accent/4%`)
- Kanji 「積」 en filigrane à droite du header (opacity 5%)
- Hairline divider sous le header
- Cartes Continue/Featured : `ring-border/40` + inner gradient top→bottom, ombre plus diffuse
- Section headers : mini bordure gauche 2px accent

### Reader header + chrome
- Header allégé : `bg-card/80` + `backdrop-blur-xl`, bordure `border-b/40`
- Settings panel : style drawer (slide-down avec ombre douce), padding aéré, bullets colorés sur section headers
- Barre de progression : 2px, gradient teal→accent, bouts arrondis
- Boutons icon header : background `muted/0` → `muted/60` au hover/active, scale 0.95 sur tap

### Switches & boutons
- Switch (Radix) : track h-5, thumb avec ombre interne légère, transition cubic-bezier
- Boutons primary : inner highlight subtil top edge (`inset 0 1px 0 white/10`)

## Fichiers

**Nouveaux**
- `src/lib/known-words.ts` → hook `useKnownWordsIndex()` retournant `Map<string, mastery>`. Utilitaire `getKnownLevel(token, index)` → `'new' | 'learning' | 'known' | null`.

**Modifiés**
- `src/components/ReaderToken.tsx` → nouvelle prop `knownLevel`, applique la classe de fond.
- `src/pages/Reader.tsx` → hook + passage de `knownLevel` filtré selon les toggles. Nouvelle section "Highlights" dans le settings panel (master + 3 sous-toggles avec pastilles).
- `src/stores/reading-progress.ts` → ajout `showKnownHighlights`, `highlightNew`, `highlightLearning`, `highlightKnown` (defaults `true/true/true/false`) + setters. Local-only.
- `src/components/ui/switch.tsx` → track h-5, ombre interne, transition affinée.
- `src/index.css` → classes `.known-new` / `.known-learning` / `.known-known` (light + dark), gradient header library, helpers chrome reader.
- `src/pages/Library.tsx` → gradient header, kanji filigrane, hairline divider, ring/gradient cartes, bullets section headers.

## Détails techniques

- **Filtrage** : dans `Reader.tsx`, `effectiveLevel = level && toggles[level] ? level : null` avant de passer à `ReaderToken`. Si master off → toujours `null`.
- **Performance** : Map recalculé seulement quand `savedWords` change (selector Zustand + `useMemo`). Aucun coût visible même 1000+ flashcards.
- **Matching strict** : on évite le matching kana-only pour ne pas highlighter les particules (の, は…). Match uniquement si `word` ou `reading` correspond exactement à `token.b` ou `token.t`.
- **Pas de migration DB** : 100% UI + store local.

