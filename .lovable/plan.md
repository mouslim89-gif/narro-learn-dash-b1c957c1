

## Ajout des tables de déclinaison pour les adjectifs en -i

### Objectif
Quand un adjectif en -i conjugué (ex: 暑かった, 大きくない) est cliqué, afficher la définition de la forme dictionnaire (暑い) avec un label de déclinaison et une table complète des formes.

### Modifications

**1. `src/components/ConjugationTable.tsx`**
- Ajouter une fonction `isIAdjective(partsOfSpeech)` qui détecte les adjectifs en -i via les parts_of_speech Jisho (contient "I-adjective")
- Ajouter `conjugateIAdj(stem)` qui génère les formes :
  - Dictionnaire (暑い), Négative (暑くない), Passé (暑かった), Passé négatif (暑くなかった), Te-form (暑くて), Adverbe (暑く)
- Modifier `getConjugations` pour gérer le cas i-adjective en plus des verbes
- Changer le label du trigger : "Conjugation table" → "Conjugation table" pour les verbes, "Declension table" pour les adjectifs

**2. `src/components/WordPopup.tsx`**
- Étendre la condition d'affichage de la table : afficher aussi quand le mot est un i-adjective (pas seulement `isVerb`)
- Les labels de conjugation dans `CONJUGATION_PATTERNS` couvrent déjà les adjectifs (lignes 37-40 : かった, くない, くなかった, くて)

**3. `supabase/functions/jisho-lookup/index.ts`**
- Ajouter des règles de deinflection pour les adjectifs en -i dans `getDeinflections` :
  - `かった$` → `い` (passé)
  - `くない$` → `い` (négatif)
  - `くなかった$` → `い` (passé négatif)
  - `くて$` → `い` (te-form)
  - `く$` → `い` (adverbe)

**4. `src/data/book-dictionary.ts`** — Régénérer pour que les adjectifs conjugués dans les livres aient les bonnes entrées deinflectées

### Fichiers modifiés
1. `supabase/functions/jisho-lookup/index.ts`
2. `src/components/ConjugationTable.tsx`
3. `src/components/WordPopup.tsx`
4. `src/data/book-dictionary.ts`

