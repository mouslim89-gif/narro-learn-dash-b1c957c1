## Ajouter le livre 鼻 (Hana / The Nose) — Akutagawa Ryūnosuke

Nouveau livre N3, ~10 min de lecture, basé sur les 2 fichiers JSON uploadés (beginner + intermediate) + version originale Aozora Bunko.

### Métadonnées
- **id**: `hana`
- **titleJp**: 鼻
- **titleEn**: The Nose
- **author**: Akutagawa Ryūnosuke
- **genre**: fiction
- **jlptLevel**: N3
- **coverColor**: `#C97B5C` (terracotta doux, ton chair — clin d'œil au sujet, contraste avec les couvertures existantes)
- **readingTimeMin**: 10
- **synopsis**: "Zen-chi Naigu, an aging monk, is tormented by his absurdly long nose — fifteen centimeters of dangling sausage that hangs past his chin. Trying every remedy he can find, he finally succeeds in shrinking it. But the relief he expected turns into something stranger: those who once pitied him now openly laugh. Akutagawa's wry, compassionate parable on vanity, pity, and the secret cruelty of human kindness."
- pas d'audio (sera ajouté plus tard)

### Étapes

1. **Créer `src/data/books/hana.ts`** avec 3 exports : `hanaSimplified`, `hanaIntermediate`, `hanaOriginal`.
   - Beginner : contenu de `hana_beg.json`, parenthèses `（…）` strippées.
   - Intermediate : contenu de `hana_inter.json`, parenthèses strippées.
   - Original : texte Aozora Bunko (carte 42) de 芥川龍之介『鼻』, fetché avec `code--fetch_website` depuis `https://www.aozora.gr.jp/cards/000879/files/42_15228.html`, nettoyé (suppression des `《…》` furigana, `［…］` markers, `｜`, espaces pleine largeur en début de paragraphe préservés ou normalisés selon la convention des autres livres Akutagawa — vérifier `rashomon.ts`/`kumo-no-ito.ts`).

2. **Étendre `src/data/book-reading-overrides.ts`** — ajouter un bloc `'hana'` avec les lectures perdues lors du strip des parenthèses :
   - `池の尾 いけのお`
   - `禅智内供 ぜんちないぐ`
   - `内供 ないぐ`
   - `お粥 おかゆ`
   - `弟子 でし`
   - `毛抜き けぬき`
   - `小坊主 こぼうず`
   - autres termes détectés à la lecture du texte original (ex. `上唇`, `付け根`, `身支度`, `炎熱`).

3. **Enregistrer le livre dans `src/data/books.ts`** :
   - import `{ hanaSimplified, hanaIntermediate, hanaOriginal } from './books/hana';`
   - ajouter l'entrée Book dans le tableau `books` (après `lemon`).

4. **Régénérer les tokens** : `bunx tsx scripts/generate-tokens.ts` (re-tokenise tous les livres ; seules les entrées hana changent).

5. **Créer `scripts/generate-grammar-for-hana.ts`** (copie de `generate-grammar-for-lemon.ts`, adapté pour hana) puis l'exécuter pour peupler `book-grammar.ts` avec ~6-7 notes par niveau.

6. **Précharger le dictionnaire** : `bunx tsx scripts/sync-dictionary-to-db.ts` pour ajouter les nouveaux mots (鼻, 内供, 池の尾, 上唇, 付け根, 紡錘形, お粥, くしゃみ, 自尊心, 蘇芳, etc.) dans la table `dictionary` Supabase.

7. **QA sur `/reader/hana/{simplified,intermediate,original}`** :
   - Aucune parenthèse `（…）` ni marker Aozora visible.
   - Furigana correct sur 禅智内供, 池の尾, 上唇, 紡錘形, お粥.
   - Cover orange-terracotta dans la Library.
   - Reading time ~10 min cohérent (~3500 chars intermediate).

### Fichiers
- créer `src/data/books/hana.ts`
- créer `scripts/generate-grammar-for-hana.ts`
- éditer `src/data/books.ts` (import + entrée Book)
- éditer `src/data/book-reading-overrides.ts` (bloc hana)
- édités automatiquement : `src/data/book-tokens.ts`, `src/data/book-grammar.ts`
- éditer `.lovable/plan.md`

### Hors scope
- Audio MP3 (à ajouter plus tard — laisser `audio` non défini).
