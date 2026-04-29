## Ajouter le livre 待つ (Matsu / Waiting) — Dazai Osamu

Court texte de Dazai (~1942), monologue d'une jeune femme qui attend chaque jour sur le banc d'une gare sans savoir qui ou quoi.

### Métadonnées proposées
- **id**: `matsu`
- **titleJp**: 待つ
- **titleEn**: Waiting
- **author**: Dazai Osamu
- **genre**: fiction
- **jlptLevel**: N4 (texte court, grammaire accessible — plus simple que A,秋 / Hashire Merosu)
- **coverColor**: `#7A9BB8` (bleu-gris ferroviaire, ton mélancolique d'attente sur un quai — distinct des autres covers Dazai #B85C2A et #C8956D)
- **readingTimeMin**: 6
- **synopsis**: "Every day, a twenty-year-old woman walks from the market to a small train station. She buys a ticket, sits on a cold bench, and waits. She doesn't know who she is waiting for — not a husband, not a lover, not a friend — only that she cannot stop. Dazai's brief, haunting wartime monologue on longing, loneliness, and the shape of an unnamed hope."
- **audio**: aucun pour l'instant

### Sources
- **Beginner**: `user-uploads://matsu_beg.json` — déjà propre (aucune parenthèse furigana détectée).
- **Intermediate**: `user-uploads://matsu_inter.json` — déjà propre.
- **Original**: à fetcher depuis Aozora Bunko (Dazai, 待つ — carte 1572, fichier `1572_8407.html`), puis sanitiser : strip `<ruby>` / `《…》` furigana, `［＃…］` markers, `｜`, normalisation des espaces pleine largeur (même pipeline que `hana.ts` / `lemon.ts`).

### Étapes

1. **Créer `src/data/books/matsu.ts`** avec exports `matsuSimplified`, `matsuIntermediate`, `matsuOriginal`.
2. **Étendre `src/data/book-reading-overrides.ts`** — bloc `'matsu'` minimaliste (les JSON ne contiennent pas de furigana parenthésés). À ajouter selon le texte original : `籠 (かご)`, `濁 (にご)`, `炯眼` si présent, `身支度`, `提灯 (ちょうちん)`, `蘇芳`, `頬 (ほお)`, `膝 (ひざ)`, etc. — liste finalisée après lecture du texte Aozora.
3. **Enregistrer dans `src/data/books.ts`** : import + entrée Book après `hana`.
4. **Régénérer tokens** : `bunx tsx scripts/generate-tokens.ts`.
5. **Créer `scripts/generate-grammar-for-matsu.ts`** (copie de `generate-grammar-for-hana.ts`) puis exécuter pour peupler `book-grammar.ts` (~6 notes par niveau).
6. **Précharger le dictionnaire** : `bunx tsx scripts/sync-dictionary-to-db.ts` pour les nouveaux mots (待つ, 駅, 改札口, ベンチ, 切符, 戦争, 馬鹿げた, 息苦しい, etc.).
7. **QA** sur `/reader/matsu/{simplified,intermediate,original}` — pas de markers Aozora résiduels, furigana correct, cover bleu-gris dans la Library, ~6 min de lecture cohérent.

### Fichiers
- créer `src/data/books/matsu.ts`
- créer `scripts/generate-grammar-for-matsu.ts`
- éditer `src/data/books.ts`, `src/data/book-reading-overrides.ts`, `.lovable/plan.md`
- édités automatiquement : `src/data/book-tokens.ts`, `src/data/book-grammar.ts`

### Hors scope
- Audio MP3 (à ajouter plus tard).

### Points à confirmer (optionnels — sinon je pars sur les valeurs ci-dessus)
- **JLPT N4** OK ? (alternatives : N3 si tu veux aligner avec la grille « Akutagawa courts = N3 »).
- **Couleur `#7A9BB8`** OK ? (alternatives : `#5C7A99` plus saturé ; `#9CAEC4` plus pâle ; `#B8A87A` sable doux).
- **Reading time 6 min** ? (~1900 chars intermediate → 6 min à 300 chars/min).
