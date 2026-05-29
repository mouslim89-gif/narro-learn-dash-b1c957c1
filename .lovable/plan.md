# Mettre à jour le skill `add-book`

Deux ajouts au pipeline existant, dans le fichier `.workspace/skills/add-book/SKILL.md` (édition du draft via `.agents/skills/add-book/SKILL.md` puis `skills--apply_draft`).

## Ajout 1 — Auto-split en parts (entre étapes 5 et 6)

Nouvelle **étape 5.5 — Découpe en parts (conditionnelle)** :

- Mesurer `originalText.length`.
- **Si ≥ 2500 chars** : appliquer intégralement la méthode du skill `split-book-into-parts` (sections "Splitting method" + Step 1 + Step 2) sur le livre qu'on vient d'ajouter :
  - Cibler des segments de **1300–1700 chars** sur l'`original`, coupés sur ruptures narratives (`。！？」` + paragraphe).
  - Générer des **anchors** Title Case, 2–5 mots, sans spoiler.
  - Aligner `intermediate` et `simplified` sur les mêmes beats narratifs.
  - Self-check : concat byte-identique, même nombre de parts par difficulté, chaque part finit sur `。！？」`.
  - Réécrire `src/data/books/<id>.ts` avec `…SimplifiedParts`, `…IntermediateParts`, `…OriginalParts`, `…Anchors` + alias back-compat.
  - Étendre l'entrée dans `src/data/books.ts` avec `parts` + `anchors`.
  - **Confirmer les anchors avec l'utilisateur avant l'étape grammar** (coûte des appels API).
- **Si < 2500 chars** : sauter, garder la forme actuelle à un seul blob.

L'étape 7 (grammar) est inchangée côté code mais la note rappelle : si split appliqué, copier `generate-grammar-for-lemon.ts` (per-part) ; sinon copier `generate-grammar-for-sakura.ts` (single).

## Ajout 2 — Préchargement des traductions de phrases

### 2a. Étendre `scripts/preload-translations.ts`

Ajouter un flag `--book <id>` :
- Sans flag : comportement actuel (tous les livres).
- Avec flag : filtre `BOOKS` à `[book]` avant la boucle. Reste identique (idempotent, passe par `sentence_translations` + `translate-sentences-batch`).

### 2b. Nouvelle étape 9 du skill — Préchargement traductions

Après le sync dictionnaire, avant la vérification finale :

```bash
npx tsx scripts/preload-translations.ts --book <id>
```

- Récupère toutes les phrases des 3 difficultés (parts incluses si splittées).
- Hash SHA-256 → bulk lookup `sentence_translations` → batch edge function pour les manquantes.
- Coût one-shot, ensuite instant pour l'utilisateur (toggle 🌐 dans le Reader).

## Numérotation finale du skill add-book

1. Pick book id
2. Generate missing difficulty versions
3. AI-deduce metadata
4. Create `src/data/books/<id>.ts`
5. Register in `src/data/books.ts`
6. **(NEW)** Split en parts si `original.length ≥ 2500` — applique le skill `split-book-into-parts`
7. Run tokenizer
8. Generate grammar (per-part si splitté, sinon single)
9. Preload dictionary
10. **(NEW)** Preload sentence translations — `npx tsx scripts/preload-translations.ts --book <id>`
11. Verify

## Hors scope

- Pas de split rétroactif sur livres existants (déjà couvert par le skill séparé).
- Pas de re-traduction si entrée déjà en cache (le script est idempotent).
- Pas d'audio (toujours hors scope du skill).

## Question ouverte

Le seuil **2500 chars** te convient ? (En dessous, un split donnerait des parts trop courtes — Urashima fait 5631 chars → 4 parts ; un livre de 2000 chars donnerait 1-2 parts seulement, sans valeur ajoutée.)
