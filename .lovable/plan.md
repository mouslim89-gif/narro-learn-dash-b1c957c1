## Redesign GrammarPanel — Bottom sheet coloré (mix A+C)

Refonte visuelle de `src/components/GrammarPanel.tsx` uniquement. Comportement conservé : accordéon (1 seul ouvert), fallback edge function `grammar-notes`, pas de tracking de progression.

---

### Ce qui change visuellement

**Conteneur**
- Bottom sheet plein largeur sur mobile, modale centrée arrondie sur sm+
- Backdrop : `backdrop-blur-sm bg-foreground/30` au lieu du `bg-black/40` plat
- Handle d'arrastre gris arrondi en haut (visuel uniquement, pas de drag pour rester simple)
- Animation : slide-up depuis le bas + fade du backdrop
- Hauteur max 85vh, scroll interne fluide

**Header**
- Sticky avec léger gradient en bas pour démarquer du scroll
- Icône `Sparkles` dans une pastille colorée primaire arrondie
- Titre "Grammar Notes" en Nunito bold
- Compteur discret à droite : "7 patterns"
- Bouton close en cercle muted

**Cartes (état replié)**
- Bord gauche épais (4px) coloré selon le niveau JLPT (`hsl(var(--n3))` etc.)
- Fond `bg-card` avec `hover:bg-muted/40`
- Layout : badge JLPT rond à gauche + pattern (Klee One, plus grand) + meaning muted en dessous + chevron à droite
- Badge JLPT : pastille ronde 28px avec lettre+chiffre blanc, fond couleur JLPT
- Coins arrondis `rounded-xl`, ombre légère, espacement plus aéré (`gap-3`)

**Cartes (état déplié)**
- Animation hauteur + fade (Tailwind `animate-accordion-down`)
- Bloc "Example from text" : fond crème `bg-muted/40`, label en uppercase tracking-widest petit, texte japonais en Klee One taille `text-base`
- Bloc "Tip" : fond pastel teinté de la couleur JLPT (`bg-[hsl(var(--n3)/0.08)]`), bord gauche fin coloré, icône Lightbulb en début de ligne
- Padding plus généreux

**États**
- Loading : 3 skeletons aux mêmes dimensions que les cartes finales (avec bord gauche teinté primary), texte centré "Analyzing grammar patterns…" en italic muted
- Error : carte rouge pâle avec icône AlertCircle + bouton Retry stylé en outline
- Vide : icône BookOpen large muted + "No grammar notes for this passage" centré

---

### Détails techniques

- Utilise les variables CSS JLPT déjà définies dans `src/index.css` (`--n5`…`--n1`) plutôt que l'objet `jlptColors` en dur — couleurs cohérentes avec le reste de l'app et theme-aware
- Polices : `font-japanese` pour les patterns/exemples (déjà mappé Klee One), Nunito pour titres EN
- Animations : ajouter au besoin `accordion-down/up` dans `tailwind.config.ts` si pas déjà présent (déjà standard shadcn — à vérifier au moment de l'impl)
- Aucun changement à `bookGrammar`, `GrammarNote`, ou à l'edge function
- Aucun changement à `Reader.tsx` qui consomme le composant (props identiques)
- Composant reste un seul fichier, pas de découpe en sous-composants nécessaire

---

### Fichiers touchés

- **edited** : `src/components/GrammarPanel.tsx` (refonte JSX + classes, logique inchangée)
- **edited (si besoin)** : `tailwind.config.ts` pour s'assurer que `accordion-down/up` keyframes existent

Aucun autre fichier impacté, aucune migration DB.