## Objectif

Afficher des furigana sur les extraits "From your reading" du dos des flashcards, toujours visibles, sans dépendance runtime lourde.

## Approche

Au moment où un mot est ajouté depuis le Reader, on capture aussi les **tokens kuromoji de la phrase de contexte** (surface + reading) et on les stocke avec la flashcard. Au rendu, on réutilise `segmentsFromReading` de `FuriganaWord.tsx` pour générer des `<ruby>` propres.

Pour les flashcards **déjà existantes** (sans tokens stockés) : fallback — on rend la phrase brute sans furigana, exactement comme aujourd'hui. Au fur et à mesure que l'utilisateur ré-enregistre ou crée de nouveaux mots, le furigana apparaît naturellement.

## Changements

### 1. Modèle de données

**`SavedWord`** (`src/stores/flashcards.ts`) : nouveau champ optionnel
```ts
contextTokens?: { t: string; r?: string }[];
```
Format minimal (juste surface `t` + reading `r` en hiragana), pour limiter la taille en localStorage et en DB.

**Migration Supabase** : ajouter une colonne `context_tokens jsonb` (nullable) à `public.flashcards`.

**`cloud-sync.ts`** : push/pull du nouveau champ (camelCase ↔ snake_case).

### 2. Capture au save

Dans `src/pages/Reader.tsx`, là où `miniPopup` / `fullPopupWord` est construit (ligne ~1215), passer aussi la liste des tokens de la phrase courante (`sentence.tokens.map(t => ({ t: t.t, r: t.r }))`). Propager via `WordMiniPopup` et `WordPopup` jusqu'à l'appel `addWord(...)`.

### 3. Composant de rendu

Nouveau **`src/components/FuriganaSentence.tsx`** :
- Props : `tokens?: { t: string; r?: string }[]`, `fallbackText: string`, `highlight?: string`, `className?: string`.
- Si `tokens` présent : pour chaque token, si `r` existe et que `t` contient des kanji, on appelle `segmentsFromReading(t, r)` (extrait de `FuriganaWord.tsx` ou exporté depuis là) et on rend un `<ruby>` ; sinon on rend le texte nu. Le token dont la surface matche `highlight` reçoit un style coloré (réutiliser la classe primary actuelle).
- Si `tokens` absent : rendu actuel (texte brut + highlight via `indexOf`).

Petite refacto : exporter `segmentsFromReading` depuis `FuriganaWord.tsx` (ou extraire dans `src/lib/furigana.ts`) pour le réutiliser proprement.

### 4. Intégration UI

**`src/components/FlashcardReview.tsx`** (lignes 236-254) : remplacer le `<p>` actuel par `<FuriganaSentence tokens={card.contextTokens} fallbackText={card.contextSentence!} highlight={card.word} className="..." />`. Le bloc "From your reading" reste identique visuellement, juste avec furigana au-dessus des kanji.

### 5. Hors scope

- Pas de tokenisation runtime (kuromoji client ni edge function).
- Pas de toggle (toujours visibles, comme demandé).
- Phrases d'exemple Tatoeba : non traitées dans ce plan.
- Pas de backfill des anciennes flashcards.

## Détails techniques

**Taille** : ~30-100 tokens par phrase × ~10 caractères → ~1-3 KB JSON par flashcard. Négligeable.

**Style** : on garde exactement l'animation/opacity et la typographie déjà utilisées dans le Reader pour cohérence visuelle.

**Highlight** : on identifie le token-cible en comparant `token.t` au champ `word` de la flashcard (base form ou surface). Si plusieurs matches, on highlight le premier.

## Fichiers touchés

- ✏️ `src/stores/flashcards.ts` — ajouter `contextTokens`
- ✏️ `src/lib/sync/cloud-sync.ts` — push/pull du champ
- ✏️ `src/pages/Reader.tsx` — passer tokens au popup
- ✏️ `src/components/WordMiniPopup.tsx`, `src/components/WordPopup.tsx` — propager au `addWord`
- ✏️ `src/components/FuriganaWord.tsx` — exporter `segmentsFromReading`
- ➕ `src/components/FuriganaSentence.tsx` — nouveau composant
- ✏️ `src/components/FlashcardReview.tsx` — utiliser le composant
- 🗄️ Migration Supabase : `ALTER TABLE public.flashcards ADD COLUMN context_tokens jsonb;`
