

## Phrases d'exemple via Tatoeba API

### Approche

Créer une edge function `tatoeba-example` qui cherche des phrases d'exemple en japonais sur l'API Tatoeba avec leur traduction en anglais. Afficher ces phrases dans les résultats du dictionnaire et les flashcards, avec un bouton TTS pour écouter la phrase complète.

### Plan technique

**1. Edge function `supabase/functions/tatoeba-example/index.ts`**
- Accepte `{ word: string }` en POST
- Appelle `https://api.tatoeba.org/v1/sentences?lang=jpn&q={word}&showtrans:lang=eng&limit=1&include=translations`
- Extrait la phrase japonaise + sa traduction anglaise
- Retourne `{ japanese: string, english: string }` ou `null`
- CORS headers, cache 24h, validation du body

**2. Utilitaire client `src/lib/tatoeba.ts`**
- `fetchExample(word: string): Promise<{ japanese: string; english: string } | null>`
- Cache mémoire (Map) pour éviter les appels répétés
- Appelle l'edge function via `supabase.functions.invoke`

**3. Composant `src/components/ExampleSentence.tsx`**
- Prend `word: string` en prop, fetch lazy l'exemple au montage
- Affiche la phrase japonaise en gras + traduction en dessous
- Bouton `PlayWordButton` à côté de la phrase (passe le texte japonais complet au TTS — il faudra augmenter la limite de 100 chars dans l'edge function TTS à ~200)
- État loading avec skeleton, état vide discret ("No example found")

**4. Intégration dans `src/pages/Dictionary.tsx`**
- Ajouter `<ExampleSentence word={wordId} />` dans chaque carte de résultat, sous les définitions

**5. Intégration dans `src/pages/Flashcards.tsx`**
- Liste : ajouter `<ExampleSentence word={word.word} />` sous chaque mot (collapsé par défaut, expandable)
- Mode review : ajouter la phrase d'exemple sur la face arrière de la carte

**6. Mise à jour TTS**
- Augmenter la limite de caractères dans `supabase/functions/tts-japanese/index.ts` de 100 à 200 pour supporter les phrases complètes

### Fichiers à créer/modifier
1. `supabase/functions/tatoeba-example/index.ts` — Nouvelle edge function
2. `src/lib/tatoeba.ts` — Client-side fetch + cache
3. `src/components/ExampleSentence.tsx` — Composant réutilisable
4. `src/pages/Dictionary.tsx` — Intégration
5. `src/pages/Flashcards.tsx` — Intégration
6. `supabase/functions/tts-japanese/index.ts` — Augmenter limite chars

