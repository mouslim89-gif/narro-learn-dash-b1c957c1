

# Améliorations SRS, page Cards, lecteur audio, MyBooks, fix card review

## 1. SRS — Algorithme SM-2 (Anki classique)

**Modèle de carte étendu** (compatible avec l'existant, migration douce) :
- `mastery: number` → conservé pour rétro-compat (= reps)
- **Nouveaux champs** dans `SavedWord` :
  - `easeFactor: number` (default 2.5, min 1.3)
  - `interval: number` (jours, default 0)
  - `reps: number` (nombre de réussites consécutives, default 0)
  - `lapses: number` (nb de "Again", default 0)

**Algorithme SM-2** (dans `src/lib/srs.ts` — nouveau) :
```
applyReview(card, quality)  // quality ∈ {0=Again, 3=Hard, 4=Good, 5=Easy}

if quality === 0 (Again):
  reps = 0; interval = 0 (review again today); lapses += 1
  ease = max(1.3, ease - 0.20)
else:
  if reps === 0: interval = 1
  elif reps === 1: interval = quality === 3 ? 3 : (quality === 4 ? 4 : 6)
  else: interval = round(prev_interval * intervalFactor(quality, ease))
  reps += 1
  // ease adjustment per SM-2 formula
  ease = max(1.3, ease + (0.1 - (5-q)*(0.08 + (5-q)*0.02)))

intervalFactor:
  Hard (3) → ease * 0.6 (slows down)
  Good (4) → ease (standard)
  Easy (5) → ease * 1.3 (boosts)

nextReviewAt = now + interval days
mastery = reps  // retro-compat for the highlight system (new/learning/known)
```

**Mapping mastery (pour highlights existants — inchangé)** :
- mastery 0 → new (ambre)
- mastery 1-2 → learning (bleu)
- mastery ≥ 3 → known (vert)

**Migration douce** : si une carte n'a pas `easeFactor`/`interval`/`reps`, on les calcule depuis `mastery` au premier accès (ease=2.5, reps=mastery, interval dérivé du SRS_INTERVALS actuel).

## 2. Bouton "Easy" (4 boutons)

`FlashcardReview.tsx` :
- 4 boutons en bas : **Again** (rouge), **Hard** (ambre), **Good** (vert), **Easy** (teal/primary)
- Sous chaque bouton, mini-label avec l'intervalle prédit (ex: "1d", "3d", "7d") — calculé via `previewInterval(card, q)`
- Layout responsive : 4 boutons en grille 2x2 sur mobile très étroit (<360px), sinon 1x4
- Couleurs cohérentes avec le système de highlights (ambre/sky/emerald)

## 3. Fix carte review qui scrolle

**Problème actuel** : la back face a `overflow-y-auto` + une copie invisible avec `max-h-[50vh]`. Le contenu peut déborder et la carte scroll en interne.

**Solution** : 
- Carte à hauteur **fixe** = `flex-1` du parent (occupe tout l'espace dispo entre header progress et boutons)
- Contenu de la back face : si trop long → on **réduit** dynamiquement via classes responsive (text-sm au lieu de text-base, espacements compressés)
- **Suppression** d'`overflow-y-auto` sur la back face → `overflow-hidden`
- Réduction du contenu affiché par défaut sur la back :
  - Meanings : max 3 affichés, "+N more" si plus
  - Example sentence : tronqué à 2 lignes avec `line-clamp-2` (l'utilisateur peut voir le détail dans la page Flashcards)
  - Context sentence : `line-clamp-2`
- Si l'utilisateur veut voir tout → tap long ou icône "expand" qui ouvre un drawer (optionnel — on garde simple pour l'instant : juste tronquer proprement)

## 4. Page Flashcards — Header & stats redesign + visuel cartes liste

### Header & stats
- **Hero header** : titre "Flashcards" + sous-titre "X cartes · Y dues aujourd'hui"
- **Bouton Review en hero** : grand bouton primary pleine largeur si dues > 0, avec compteur dues intégré et icône. Sinon bouton compact "Review all".
- **4 tuiles stats** (au lieu de 3) : Due, New, Learning, Known
  - Chaque tuile : pictogramme + chiffre + label
  - Couleurs cohérentes : Due = accent/coral, New = ambre, Learning = sky, Known = emerald
  - Gradient subtil dans chaque tuile (`bg-gradient-to-br from-X/10 to-X/5`)
  - Tap sur une tuile → applique le filtre correspondant
- Mini-graphique sparkline ou ring de progression globale (% known) — *optionnel, à voir si pas trop chargé*

### Cartes liste
- Carte plus aérée : padding 4, rounded-xl, ring subtil
- **Barre de progression mastery** sur chaque carte (mini bar fine en bas) montrant les 5 paliers
- **Pastille colorée plus visible** : remplace le dot 2x2 par un petit indicateur vertical épais (3px de large, full height de la carte) à gauche
- **Due badge** : si carte due, petit chip "Due" en haut à droite (accent/15)
- Hover : `hover:bg-muted/30 hover:border-primary/30 transition-all`
- Press feedback : `active:scale-[0.98]`
- Indication next review : "Next: in 3d" en mini-texte sous les meanings (calculé depuis `nextReviewAt`)

## 5. Lecteur audio — Premium + temps

**`AudioPlayer.tsx`** :
- **Affichage temps** : MM:SS courant à gauche du slider, MM:SS total/restant à droite (tap sur le total pour basculer entre "total" et "restant -MM:SS")
- **Design premium** :
  - Container : padding plus généreux (py-3 px-5), `bg-card/85 backdrop-blur-2xl`, `border-t border-border/50`
  - Bouton play : 40x40 (au lieu de 32x32), rounded-full (au lieu de rounded), gradient `from-primary to-primary/80`, ombre `shadow-lg shadow-primary/30`
  - Slider : track plus épais (h-1.5), gradient teal→accent sur la portion remplie, thumb visible (h-3.5 w-3.5, border-2 white, shadow)
  - Bouton speed : pill rounded-full, font-bold, hover scale légère
  - Suppression de l'icône Volume2 (peu utile sur mobile, libère de la place pour les temps)
- Layout : `[play] [time-current] [slider flex-1] [time-total] [speed]` — sur très petit écran, time-total cache (juste current visible)

**Helper** : `formatTime(sec)` → "M:SS" ou "MM:SS"

## 6. Retirer "Last 30 days" de MyBooks

`src/pages/MyBooks.tsx` :
- Suppression du composant `StreakCalendar` et son rendu
- Le bloc stats reste (4 tuiles)

## Fichiers

**Nouveaux**
- `src/lib/srs.ts` — `applyReview(card, quality)`, `previewInterval(card, quality)`, `migrateCard(card)`, types `Quality = 0|3|4|5`
- `src/components/SrsButtons.tsx` — composant des 4 boutons avec preview d'intervalle (réutilisable)

**Modifiés**
- `src/stores/flashcards.ts` :
  - Ajout `easeFactor`, `interval`, `reps`, `lapses` dans `SavedWord`
  - Refacto `adjustMastery(id, quality)` → utilise `applyReview` de `srs.ts` ; `quality` devient `'again' | 'hard' | 'good' | 'easy'`
  - Migration douce dans `addWord` (defaults) + helper interne `ensureMigrated(w)` appelé au push
  - `getDueWords` inchangé (utilise toujours `nextReviewAt`)
- `src/components/FlashcardReview.tsx` :
  - Carte non-scrollable : `overflow-hidden` partout, `flex-1` sur le container, `line-clamp-2` sur les longs textes, max 3 meanings affichés
  - 4 boutons via `<SrsButtons>` avec preview d'intervalles
  - Suppression de la copie invisible (plus utile car hauteur fixée par flex)
- `src/pages/Flashcards.tsx` :
  - Hero header refondu avec sous-titre due-count
  - Bouton Review pleine largeur si dues > 0
  - Grid 4 tuiles (Due/New/Learning/Known) avec gradients + tap=filter
  - Cartes liste : barre verticale colorée, due badge, mini progress bar mastery, "Next: Xd"
  - Ajout filtre `'due'` dans `StatusFilter`
- `src/components/AudioPlayer.tsx` :
  - Affichage temps current + total (clic toggle restant)
  - Design premium (bouton play 40px gradient, slider épais teal→accent, container blur+padding)
  - Suppression Volume2
- `src/pages/MyBooks.tsx` :
  - Suppression `StreakCalendar` + son rendu et import `subDays`/`format`/`startOfDay` non utilisés
- `src/lib/sync/cloud-sync.ts` :
  - `pushFlashcard` envoie aussi les nouveaux champs (en JSON metadata si pas de colonnes dédiées) — *voir détails*

## Stockage des nouveaux champs SRS

**Option A (zéro migration DB)** : stocker `easeFactor`, `interval`, `reps`, `lapses` dans le JSON `meanings` ? Non, hack.

**Option B (recommandée)** : ajouter colonnes via migration. Mais le user n'a pas demandé de migration et les champs sont stockés en local via `persist` Zustand de toute façon. Le cloud sync existant ne pousse que `mastery`/`next_review_at`/`last_reviewed_at` — c'est suffisant pour la rétro-compat et le multi-device.

**Option C choisie** : 
- **Local-first** : les champs SRS (`easeFactor`, `interval`, `reps`, `lapses`) vivent en localStorage (déjà persisté). Au pull cloud, on reconstruit ces valeurs depuis `mastery` + `lastReviewedAt`/`nextReviewAt` via `migrateCard`. C'est légèrement moins précis cross-device mais évite toute migration DB.
- À terme, on pourra ajouter une migration. Pour l'instant : **rien à toucher en DB**.

## QA

Après implémentation, je vérifie :
- Build OK (pas d'erreur TS)
- Mode review : carte ne scroll plus, 4 boutons visibles avec intervalles
- Page Flashcards : 4 tuiles cliquables filtrent, cartes ont la barre verticale
- Audio player : temps affichés, design premium
- MyBooks : plus de calendrier 30j

