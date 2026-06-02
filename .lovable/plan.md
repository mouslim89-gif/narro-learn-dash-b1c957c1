# Plan — Rendre la progression fiable et reprendre exactement au bon endroit

Objectif : la progression doit se sauvegarder de manière robuste, ne pas être écrasée par une ancienne valeur cloud, et le bouton Continue doit reprendre au bon chapitre/à la bonne phrase.

## 1. Sauvegarde plus fiable

- Remplacer le modèle actuel « sauvegarde cloud debounce 1.5s uniquement » par un système plus robuste :
  - sauvegarde locale immédiate à chaque progression significative ;
  - envoi cloud debounced pour économiser les requêtes ;
  - flush immédiat quand l’utilisateur quitte la page, change de chapitre, masque l’app ou ferme l’onglet.
- Empêcher les régressions de progression :
  - ne jamais remplacer une progression locale plus récente par une progression cloud plus ancienne ;
  - garder `updated_at`/timestamp côté local pour comparer proprement ;
  - si un chapitre est déjà à 80%, ne pas le ramener à 20% à cause d’une hydratation tardive.
- Réduire les writes inutiles :
  - ne pousser au cloud que si la progression a vraiment changé ;
  - arrondir/stabiliser le pourcentage ;
  - éviter d’écrire en boucle pendant une restauration automatique de scroll.

## 2. Reprise exacte à la phrase

- Ajouter un champ `sentence_idx` à la progression de lecture.
- Dans le Reader, suivre la phrase courante avec les refs de phrases déjà présentes.
- Sauvegarder :
  - `progressPercent` pour la barre/progression visuelle ;
  - `sentenceIdx` pour la reprise précise.
- À l’ouverture d’un chapitre :
  - si `sentenceIdx` existe, scroller vers cette phrase ;
  - sinon fallback sur l’ancien `%` de scroll ;
  - si le chapitre est terminé, repartir du haut.

## 3. Continue qui avance au chapitre suivant

- Sur la page du livre, si le dernier chapitre lu est terminé à 100%, le bouton Continue doit ouvrir automatiquement le chapitre/part suivant.
- Si aucun chapitre suivant n’existe :
  - reprendre le premier chapitre non terminé s’il en reste ;
  - sinon afficher un comportement de restart propre.
- Garder les labels de l’app en anglais : `Continue Chapter N`, `Start Chapter N`, `Restart`.

## 4. Sync cloud plus sûre

- Modifier le store `reading-progress` pour conserver une progression locale optimiste et fiable.
- Lors du pull cloud : fusionner au lieu de remplacer brutalement.
- Lors du push cloud : envoyer `sentence_idx` et `last_read_at`/timestamp actuel.
- En cas d’échec réseau : conserver la progression locale, puis retenter lors de la prochaine modification/session.

## 5. Fichiers concernés

- `src/stores/reading-progress.ts`
- `src/lib/sync/cloud-sync.ts`
- `src/hooks/use-cloud-sync.ts`
- `src/pages/Reader.tsx`
- `src/pages/BookDetail.tsx`
- Migration Lovable Cloud : ajouter `sentence_idx` à `reading_progress`

## Validation prévue

- Ouvrir un chapitre, scroller, quitter/revenir : reprise à la même phrase.
- Changer rapidement de page : la progression reste sauvegardée.
- Revenir après hydratation cloud : la progression locale récente n’est pas écrasée.
- Finir un chapitre : Continue ouvre le chapitre suivant.
- Anciennes progressions sans `sentence_idx` continuent de fonctionner avec le fallback `%`.
