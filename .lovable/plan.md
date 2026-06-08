## Plan

Header : aucun changement (demandé).

Suppression de **Convenience Store Woman** (`konbini-ningen`) :

1. `src/data/books.ts` — retirer l'import `konbiniChapters`, la const `konbiniCh1`, et l'entrée du livre dans le tableau `books`.
2. `src/data/book-tokens/word-counts.ts` — retirer les 7 entrées `konbini-ningen*`.
3. Supprimer les fichiers :
   - `src/data/books/konbini-ningen.ts`
   - `src/data/book-tokens/books/konbini-ningen.ts`
   - dossier `.lovable/generated/konbini-ningen/` (textes générés)
4. Vérifier qu'aucune référence ne reste (grep `konbini`) — le commentaire dans `scripts/generate-dictionary-shards.ts` est juste un exemple, on peut le laisser ou changer l'exemple.

Pas de migration DB nécessaire (catalogue côté client).