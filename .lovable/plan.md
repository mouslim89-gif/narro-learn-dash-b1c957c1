# Reader onboarding — refonte fluide

Refonte du tutoriel du reader : spotlight doux, transitions en spring, tap n'importe où pour avancer, et une première étape réellement interactive.

## Ce qui change

**1. Spotlight animé**
- Overlay sombre percé d'un trou arrondi (radius suivant l'élément visé) au lieu du `clip-path` rectangulaire actuel.
- Le trou se déplace en douceur d'une étape à l'autre (spring), avec un anneau ambre discret qui pulse autour de la cible.
- Léger flou sur l'overlay pour un rendu plus soigné.

**2. Bulle plus fluide**
- La bulle ne disparaît plus entre les étapes : elle glisse vers la nouvelle position (spring, easing Tsundoku).
- Le texte à l'intérieur fait un cross-fade rapide.
- Style aligné à l'app : carte `rounded-2xl`, titre `font-serif`, label d'étape en petites capitales trackées, bouton pill.
- Flèche correctement recalée sur le centre de la cible, et bulle placée au-dessus ou en dessous automatiquement selon la place disponible.
- Points de progression (dots) au lieu du texte « Step 1/5 ».

**3. Navigation**
- Tap n'importe où sur l'overlay = étape suivante (avec un indice discret « Tap to continue »).
- Bouton Continue conservé + Skip en haut à droite.
- Retour arrière possible via un chevron discret.

**4. Étape 1 interactive**
- L'étape « tap a word » attend un vrai tap sur un mot : le trou du spotlight laisse passer le clic sur le token visé, et le tutoriel passe à l'étape suivante dès que le mini-popup s'ouvre.
- Fallback : si l'utilisateur ne tape pas après ~6 s, un bouton « Skip this step » apparaît, pour ne jamais bloquer.

**5. Corrections de fluidité**
- Suppression du `setInterval` à 500 ms (repositionnement via `requestAnimationFrame` uniquement pendant les transitions + listeners resize/scroll).
- Le `scrollIntoView` ne se déclenche que si la cible est hors écran, ce qui supprime les remontées de page intempestives.
- Respect de `prefers-reduced-motion` : transitions instantanées.

## Détails techniques

- Fichier principal : `src/components/onboarding/ReaderTutorial.tsx` (réécriture).
- Spotlight : overlay SVG avec `mask` (rect plein + rect arrondi noir) pour un trou aux coins arrondis, animé via `motion` sur x/y/width/height.
- Interactivité étape 1 : `pointer-events-none` sur la zone du trou, détection de la progression en observant l'ouverture du mini-popup (attribut/événement custom émis par le token déjà marqué `data-tutorial="token"`), sinon fallback sur un `click` capturé sur la cible.
- Aucun changement de logique métier ; `src/stores/onboarding.ts` inchangé. Un seul petit ajout possible dans `src/pages/Reader.tsx` : émettre un événement quand un mot est tapé, si aucun signal exploitable n'existe déjà.
