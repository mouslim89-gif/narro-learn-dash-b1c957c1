

## Plan : nettoyage librairie + traduction de phrase

### 1. Nettoyage des livres d'exemple

`src/data/books.ts` :
- **Supprimer** : momotaro, tsuru-no-ongaeshi, konbini-ningen, ginga-tetsudo, yoru-cafe, yami-no-koe (et toutes leurs constantes `*Simplified/Intermediate/Original`).
- **Garder** : uniquement `a-aki` (太宰治).

Nettoyer en cascade les caches associés pour garder le repo léger :
- `src/data/book-tokens.ts` — retirer toutes les entrées sauf `a-aki`.
- `src/data/book-grammar.ts` — retirer toutes les entrées sauf `a-aki`.
- `src/data/book-dictionary.ts` — **garder tel quel** (le dico est mutualisé entre livres, supprimer des entrées casserait potentiellement `a-aki` et créerait du travail inutile lors de l'ajout de nouveaux livres).
- `src/stores/reading-progress.ts` — pas de modif (les progressions des anciens livres deviendront orphelines, sans effet).

Vérifier aussi que `Library.tsx`, `MyBooks.tsx`, `BookDetail.tsx` ne référencent pas en dur ces IDs (ils itèrent juste sur `books`, donc rien à toucher).

### 2. Fonctionnalité « Traduction de phrase »

#### Backend — nouvelle edge function `translate-sentence`
- Input : `{ japanese: string, bookId?: string, difficulty?: string }`
- Validation Zod (max 500 chars, japonais requis).
- **Cache DB** : nouvelle table `sentence_translations` (clé = hash sha256 du japonais, colonnes `japanese`, `english`, `created_at`). RLS public read, insert via service role uniquement.
- Lookup cache → si miss → appel Lovable AI (`google/gemini-3-flash-preview`) via tool calling pour forcer un JSON `{ english: string }`.
- Prompt système : « Translate the following Japanese sentence into natural, fluent English. Preserve the literary tone if present. Return only the translation. »
- Gérer 429 / 402 explicitement et les renvoyer au client.

#### Frontend
- **Nouveau lib** : `src/lib/translate.ts` avec `translateSentence(japanese)` + cache mémoire (Map) + dédupe des requêtes en vol.
- **Nouveau composant** : `src/components/SentenceTranslationPopup.tsx`
  - Même look & positionnement que `WordMiniPopup` (calcule `top/left` via `sentenceRect`, animation `mini-slide-up/down`, padding identique).
  - Header : icône 🌐 + label « Translation » + bouton fermer.
  - Body : phrase japonaise (font-japanese, petite) + traduction anglaise (font normale, semi-bold accent).
  - États : loading (spinner), erreur (« Translation unavailable »), succès.
  - Le reste de l'écran est dimmed (même mécanisme que la mini popup mot, ré-utiliser la logique d'opacity sur les sentence spans).
- **Reader.tsx** :
  - Nouvel état `sentenceTranslation: { sentenceIdx, japanese, sentenceRect } | null`.
  - **Long-press handler** sur chaque token (~400 ms, seuil de mouvement < 8 px pour ne pas confondre avec scroll) : déclenche la traduction de la phrase contenant le token, ferme la mini popup mot.
  - Implémentation : helper `useLongPress(onLongPress, { delay: 400, moveThreshold: 8 })` dans `src/hooks/use-long-press.ts` retournant les handlers `onTouchStart/onTouchMove/onTouchEnd/onMouseDown/onMouseUp/onMouseLeave`. Compat tactile + souris desktop.
  - Empêcher le déclenchement du `onClick` (mini popup mot) si long-press a fired (flag `triggered.current`).
  - **Ajout dans la mini popup mot** : nouveau bouton « Translate sentence » (icône Languages de lucide) à côté du bouton « More », appelle le même flow que le long-press.
  - Quand `sentenceTranslation` actif : dim toutes les autres sentences (réutiliser la condition d'opacity actuelle), highlight subtil sur la sentence active.

#### Indicateur de découvrabilité
- Première fois qu'un user ouvre le Reader (flag `hasSeenLongPressHint` dans le store) : petit toast discret « Tip: long-press a word to translate the whole sentence ».

### 3. Migration DB

```sql
create table public.sentence_translations (
  id uuid primary key default gen_random_uuid(),
  hash text not null unique,
  japanese text not null,
  english text not null,
  created_at timestamptz not null default now()
);
alter table public.sentence_translations enable row level security;
create policy "Anyone can read sentence translations"
  on public.sentence_translations for select using (true);
create index sentence_translations_hash_idx on public.sentence_translations (hash);
```

Insert via service role uniquement (pas de policy insert publique).

### 4. Fichiers touchés

**Modifiés**
- `src/data/books.ts` (suppression)
- `src/data/book-tokens.ts` (suppression)
- `src/data/book-grammar.ts` (suppression)
- `src/components/WordMiniPopup.tsx` (bouton « Translate sentence »)
- `src/pages/Reader.tsx` (long-press, état traduction, dim management)
- `src/stores/reading-progress.ts` (flag `hasSeenLongPressHint`)

**Créés**
- `supabase/functions/translate-sentence/index.ts`
- `src/lib/translate.ts`
- `src/components/SentenceTranslationPopup.tsx`
- `src/hooks/use-long-press.ts`
- Migration SQL pour `sentence_translations`

### 5. Notes techniques & choix

- **Pourquoi cache DB et pas seulement mémoire** : les phrases des livres sont fixes et lues par tous les users → rentabilise très vite les appels AI.
- **Pourquoi long-press 400 ms et pas 500** : compromis bon entre intentionnalité et réactivité mobile (testé sur viewport 360×738).
- **Conflit scroll** : `moveThreshold: 8 px` annule le long-press dès que le doigt bouge → pas de déclenchement accidentel pendant un swipe.
- **Pourquoi ne PAS pré-générer toutes les traductions à l'ajout** : tu as choisi le live AI, et c'est pertinent : la traduction n'a besoin d'être faite qu'une fois par phrase (cache DB partagé), donc le coût se lisse naturellement avec les premiers lecteurs.
- **Sécurité** : la fonction edge a `verify_jwt = false` (pas de données user-spécifiques) ; validation Zod stricte sur la longueur pour éviter abus.

