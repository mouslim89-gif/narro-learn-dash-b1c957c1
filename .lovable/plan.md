# Onboarding refonte: showcase animé des fonctionnalités

L'onboarding actuel est une carte modale générique (icônes Lucide sur pastilles bleu/vert/violet, texte centré). Il ne montre rien de ce que l'app sait faire et sort du thème Tsundoku.

Nouveau principe: chaque écran est plein écran, sur fond papier, et **montre** la fonctionnalité avec une mini-démo animée plutôt que de la décrire avec une icône.

## Les écrans

1. **Welcome — Tsundoku**
   Wordmark Merriweather animé lettre par lettre (même esprit que le splash), sous-titre "Learn Japanese by reading real literature", et une pile de 3 couvertures de livres qui se déploient en éventail.

2. **Tap any word** (démo interactive)
   Une vraie phrase japonaise avec furigana. Un doigt/curseur animé vient taper un mot, le mot s'illumine en ambre, et une mini popup de définition monte du bas exactement comme dans le Reader. L'utilisateur peut aussi taper le mot lui-même.

3. **Three difficulty levels**
   La même phrase se réécrit en boucle: Simplified → Intermediate → Original, avec le segmented pill de difficulté qui glisse. Montre qu'on peut lire au-dessus de son niveau.

4. **Grammar, explained**
   Une carte de grammar note qui se retourne: pattern (ex. `Dictionary form + のだ`) puis l'explication qui apparaît.

5. **Remember what you read**
   Une flashcard qui se retourne recto/verso puis part sur le côté, avec les 4 boutons SRS et une demi-jauge d'objectif quotidien qui se remplit.

6. **Listen and follow**
   Ligne de texte avec surlignage progressif synchronisé et une petite waveform qui pulse.

7. **Ready** — CTA "Start reading" pleine largeur (`btn-tsundoku-premium`), qui ferme l'onboarding.

## Navigation et look

- Plein écran, fond `background` avec le dégradé radial `library-header-bg`, pas de carte modale ni de backdrop flou.
- Swipe horizontal (drag Framer Motion) + tap sur la moitié droite/gauche pour avancer/reculer; bouton "Next" en pill en bas, "Skip" discret en haut à droite.
- Indicateur de progression: barres fines qui se remplissent (style stories), pas des points.
- Chaque démo se rejoue à l'entrée de son écran et se met en pause quand l'écran n'est pas actif.
- Palette strictement thème: paper background, navy `primary`, ambre `accent`. Aucune pastille bleu/vert/violet.
- Respecte `disableAnimation` (admin): dans ce cas les démos s'affichent dans leur état final, sans mouvement.
- Respecte aussi `prefers-reduced-motion`.

## Détails techniques

- `src/components/onboarding/OnboardingCarousel.tsx` réécrit: coquille plein écran, gestion des slides, swipe, progression, skip. Garde intactes la logique existante (`hasCompletedCarousel`, `alwaysReplayOnboarding`, `dismissed` local, exclusion `/reader/*` et pages légales) et le store `onboarding-storage`.
- Nouveau dossier `src/components/onboarding/demos/` avec un composant par démo (`WordTapDemo`, `DifficultyDemo`, `GrammarDemo`, `FlashcardDemo`, `AudioDemo`, `BooksFanDemo`), chacun recevant `active: boolean`.
- Les démos sont **statiques et autonomes**: phrase et tokens en dur dans le composant, zéro appel réseau, zéro requête IA, zéro dépendance au dictionnaire ou à Supabase. Aucun coût.
- Réutilise `FuriganaWord` pour le rendu japonais et `HalfGauge` pour la jauge; le reste est du markup local calqué visuellement sur `WordMiniPopup`, `GrammarPanel` et `FlashcardReview` (pas d'import de ces composants, pour ne pas traîner leur état).
- Animations en Framer Motion avec l'easing maison `[0.22, 1, 0.36, 1]`.
- Aucune modification du Reader, du store, ni du tutoriel in-reader (`ReaderTutorial`) qui reste tel quel.
