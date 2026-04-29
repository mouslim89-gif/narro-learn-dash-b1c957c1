## Ajouter le livre 朝 (Asa / Morning) — Dazai Osamu

Court récit autobiographique de Dazai : le narrateur, ivre, passe la nuit dans la chambre d'une jeune femme (Kiku-chan), fiancée à un autre. Une bougie qui se consume devient la mesure de sa résistance — jusqu'à ce que l'aube arrive juste à temps. Mélange typique de Dazai : autodérision, ironie, tension morale, finale en suspens.

### Métadonnées proposées
- **id**: `asa`
- **titleJp**: 朝
- **titleEn**: Morning
- **author**: Dazai Osamu
- **genre**: fiction
- **jlptLevel**: **N3** (intermediate ~3500 chars, vocabulaire et grammaire plus riches que 待つ N4 — proche de 鼻 / Hashire Merosu)
- **coverColor**: `#E8A87C` (orange pâle aurore — distinct des autres Dazai : `#B85C2A` ア,秋 / `#C8956D` メロス / `#7A9BB8` 待つ)
- **readingTimeMin**: 11 (~3500 chars intermediate ÷ ~320 chars/min)
- **synopsis** (proposition) : "After a night of heavy drinking, Dazai's narrator collapses in the room of a young woman about to be married — not his lover, just someone he's promised her mother to look after. As a candle burns down in the darkness during a power cut, he counts the minutes between his desire and the dawn, hoping one of them will give out before the other. A short, wry, painfully honest sketch of weakness, restraint, and the saving grace of morning light."
- **audio**: aucun pour l'instant.

### Sources
- **Beginner**: `user-uploads://asa_beg.json` — déjà propre (parenthèses explicatives type `（日本の温かいテーブル）`, `（電気が止まること）` à **stripper** au passage pour rester cohérent avec hana/matsu).
- **Intermediate**: `user-uploads://asa_inter.json` — quasi propre (une seule parenthèse furigana `足袋（たび）` à stripper).
- **Original**: à fetcher depuis Aozora Bunko (Dazai, 朝 — carte 1565, fichier `1565_8393.html` à confirmer), puis pipeline standard : strip `<ruby>`/`《…》`, `［＃…］`, `｜`, normalisation espaces.

### Étapes

1. **Créer `src/data/books/asa.ts`** avec `asaSimplified`, `asaIntermediate`, `asaOriginal`. Stripper toutes les parenthèses explicatives/furigana sur les 3 niveaux.
2. **Étendre `src/data/book-reading-overrides.ts`** — bloc `'asa'` pour les lectures non triviales du texte original. Liste préliminaire (à finaliser après lecture Aozora) :
   - `足袋: たび`, `提灯: ちょうちん`, `蝋燭/ろうそく: ろうそく`, `炎: ほのお`, `酔: よ`, `頬: ほお`, `本箱: ほんばこ`, `階段: かいだん`, `貴婦人: きふじん`, `奥方: おくがた`, `編集者: へんしゅうしゃ`, `日本橋: にほんばし`, `仰向け: あおむけ`, `直角: ちょっかく`, `馴染み: なじみ`, `小料理屋: こりょうりや`, `停電: ていでん`, `本職: ほんしょく`, `原稿: げんこう`.
3. **Enregistrer dans `src/data/books.ts`** : import + entrée `Book` après `matsu`.
4. **Régénérer tokens** : `bunx tsx scripts/generate-tokens.ts`.
5. **Créer `scripts/generate-grammar-for-asa.ts`** (copie de `generate-grammar-for-matsu.ts`) puis exécuter — ~7 notes par niveau. Cibles attendues : `〜ふりをする`, `〜てしまう`, `〜たまま`, `〜ように`, `〜ながら`, `〜うちに`, `〜ばかり`, `〜ものだ`, conditionnel `〜たら`, `〜ように思える`.
6. **Précharger le dictionnaire** : `bunx tsx scripts/sync-dictionary-to-db.ts` (nouveaux mots : 旦那, 婿, 編集者, 停電, 蝋燭, 足袋, 仰向け, 覚悟, 大胆, 真っ暗, 黙る, etc.).
7. **QA** sur `/reader/asa/{simplified,intermediate,original}` — pas de parenthèses résiduelles, furigana corrects (notamment 足袋 → たび et non そくたい), cover orange-aurore visible dans la Library, ~11 min de lecture cohérent.

### Fichiers
- créer `src/data/books/asa.ts`
- créer `scripts/generate-grammar-for-asa.ts`
- éditer `src/data/books.ts`, `src/data/book-reading-overrides.ts`, `.lovable/plan.md`
- édités automatiquement : `src/data/book-tokens.ts`, `src/data/book-grammar.ts`

### Hors scope
- Audio MP3 (à ajouter plus tard).

### Points à confirmer (sinon je pars sur les valeurs ci-dessus)

1. **JLPT N3** OK ? Alternatives :
   - **N4** si tu juges le beginner suffisamment accessible (mais l'intermediate a clairement du N3 : 〜ものだ、せせら〜、覚悟を決める…).
   - **N2** si tu veux refléter la difficulté de l'**original** (Dazai original = registre littéraire des années 40).

2. **Couleur `#E8A87C`** (orange pâle aurore) OK ? Variations :
   - `#F4C28C` plus pâle/doré (lumière du matin).
   - `#D98859` plus chaud/saturé (soleil levant).
   - `#A8B5A0` vert-gris pâle (aube froide, contraste avec la nuit ivre du récit).

3. **Reading time 11 min** OK ? Alternatives : 9 min (lecteur rapide) ou 13 min (avec popups dico).

4. **Synopsis EN** ci-dessus OK, ou tu préfères :
   - (b) plus court/sec : "Dazai, drunk, spends the night in the room of a young woman engaged to another man. A candle, a power cut, and the slow race between his weakness and the dawn."
   - (c) plus poétique : "A candle, a sleeping woman, and a man fighting himself in the dark — until morning quietly arrives and saves them both."
