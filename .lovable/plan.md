# Uniformiser les transitions & animations

## Constat — incohérences relevées

L'app a un bon design system d'animation dans `index.css` (`--ease-out-soft`, `tap-scale`, `card-lift`, `animate-fade-in-up`, `smooth-colors`...) mais il n'est pas appliqué uniformément. Audit :

### 1. Transitions de page (App.tsx)
- Aujourd'hui : fade opacity 0.28s + mode dynamique `wait`/`popLayout`. OK.
- Mais chaque page ajoute en plus son propre `animate-fade-in-up` sur le header → **double animation** (fade Framer + fade-up CSS) qui rend les transitions un peu "molles".
- Auth/ResetPassword utilisent en plus leur propre `motion.div` interne → triple couche.

### 2. Tap feedback (scale on press)
Cinq magnitudes différentes utilisées :
- `tap-scale` (0.965) — standard
- `tap-scale-sm` (0.92) — petits boutons
- `active:scale-95` (PlayWordButton, FlashcardReview, GrammarPanel)
- `active:scale-[0.94]` (Reader HeaderChip, Reader chevrons)
- `active:scale-[0.97]` (Reader SegmentedRow, SrsButtons, Flashcards filtres)

### 3. Color transitions
Trois variantes mélangées : `transition-colors`, `transition-all`, `smooth-colors`. Souvent `transition-all` est utilisé là où seules les couleurs changent (perf + cohérence).

### 4. Durées hétérogènes
`duration-200`, `duration-300`, `duration-500` (FlashcardReview flip 500ms vs reste 200-300ms), sans easing partagé.

### 5. Entrée des pages — stagger
- Library/Dictionary/Flashcards/Settings : `animate-fade-in-up` + `style={{ animationDelay: '0.05s' }}` inline répétés manuellement
- L'utilitaire `.stagger-children` existe déjà mais n'est jamais utilisé
- Reader mélange `animate-fade-in`, `animate-fade-in-up`, `animate-fade-in-soft` au même endroit

### 6. Pulses
`animate-pulse` (Tailwind brut, harsh) utilisé dans PlayWordButton et Reader skeleton, alors que `animate-soft-pulse` (1.8s, easing soft) existe et est utilisé dans BottomNav.

### 7. Boutons primaires Reader (nav prev/next)
Hover utilise `transition-shadow` / `transition-transform` séparés au lieu du combo `smooth-colors` + `tap-scale`.

---

## Plan d'uniformisation

### A. Tokens de tap (1 règle)
- **Surfaces standard** (cartes, boutons larges, chips ≥40px) → `tap-scale` (0.965)
- **Petites icônes / chips ≤36px** → `tap-scale-sm` (0.92)
- Supprimer tous les `active:scale-95` / `[0.94]` / `[0.97]` au profit de ces deux classes.

Fichiers touchés : Reader.tsx (HeaderChip, SegmentedRow), PlayWordButton, FlashcardReview, SrsButtons, ConjugationTable, Flashcards (filtres), GrammarPanel.

### B. Color transitions
Remplacer `transition-colors` et `transition-all` (quand seuls couleurs/opacité changent) par la classe `smooth-colors` déjà définie. Garder `transition-all` seulement quand transform/shadow change aussi (FlashcardReview flip, progress bar).

### C. Page entrance — supprimer le doublon
Le fade Framer Motion d'App.tsx gère déjà l'entrée. Deux options :

1. **Option recommandée** — Retirer les `animate-fade-in-up` sur les headers de page (Library, MyBooks, Flashcards, Dictionary, Settings, BookDetail). Garder la stagger seulement sur les contenus en dessous via `.stagger-children` sur le parent, sans `style={{ animationDelay }}` inline.
2. Option alternative — Garder le fade-up CSS mais retirer la transition Framer Motion (revenir à fade pur sans wrapper).

→ Je propose **Option 1** : une seule source de vérité pour l'entrée de page (Framer), et `.stagger-children` pour les sections internes.

### D. Reader — unifier les fade
Choisir **un seul** keyframe d'entrée pour le Reader :
- Chapter heading + nav + sentinel sticky → tous en `animate-fade-in-soft` (0.3s, pas de translation, pour ne pas perturber la lecture).
- Retirer `animate-fade-in-up` du chapter heading et `animate-fade-in` du sticky.

### E. Pulses
- Remplacer `animate-pulse` par `animate-soft-pulse` dans PlayWordButton (badge "playing") et Reader skeleton lines.

### F. Durées & easing
- Standard interactions courtes : 180ms `var(--ease-out-soft)` (déjà encapsulé par `tap-scale`/`smooth-colors`)
- Progress bars : garder 200-500ms `ease-out` (différentes selon contexte de feedback) — OK
- Flashcard flip 3D : 500ms — OK (visuellement nécessaire)

### G. Auth/ResetPassword
Retirer les `motion.div` internes — la transition de page d'App.tsx suffit. Garder un simple `animate-fade-in-soft` si besoin d'un soft-in du formulaire.

---

## Détails techniques (fichiers à modifier)

```
src/App.tsx                          — (rien, déjà OK)
src/pages/Library.tsx                — retirer animate-fade-in-up + animationDelay inline, utiliser stagger-children
src/pages/MyBooks.tsx                — idem
src/pages/Flashcards.tsx             — idem + active:scale-[0.97/0.94] → tap-scale-sm
src/pages/Dictionary.tsx             — idem
src/pages/Settings.tsx               — idem
src/pages/BookDetail.tsx             — retirer animate-fade-in-up du hero, normaliser transitions
src/pages/Reader.tsx                 — HeaderChip/SegmentedRow → tap-scale-sm/tap-scale; transition-colors → smooth-colors; unifier fade-in; animate-pulse → animate-soft-pulse
src/pages/Auth.tsx                   — retirer motion.div interne
src/pages/ResetPassword.tsx          — idem
src/components/PlayWordButton.tsx    — active:scale-95 → tap-scale-sm; animate-pulse → animate-soft-pulse; transition-colors → smooth-colors
src/components/FlashcardReview.tsx   — active:scale-95 → tap-scale-sm; transition-all (boutons) → smooth-colors
src/components/SrsButtons.tsx        — active:scale-[0.97] → tap-scale; transition-all → smooth-colors
src/components/ConjugationTable.tsx  — transition-colors → smooth-colors
src/components/GrammarPanel.tsx      — (déjà OK pour la plupart)
src/components/BookCard.tsx          — (déjà OK)
```

## Hors scope
- `src/components/ui/*` (shadcn) — pas touché, ce sont des composants vendor.
- Animations Framer Motion existantes (BottomNav indicator, page transitions) — conservées telles quelles.

## Résultat attendu
- 2 magnitudes de tap-scale seulement (au lieu de 5)
- 1 utilitaire `smooth-colors` pour toutes les transitions de couleur
- 1 source d'entrée de page (Framer Motion) + `.stagger-children` pour le contenu
- Reader : un seul style de fade
- Plus aucun `animate-pulse` brut
