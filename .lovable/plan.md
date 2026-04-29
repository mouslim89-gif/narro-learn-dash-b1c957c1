## Ajouter le livre 魚服記 (Gyofukuki) — Dazai Osamu

Court récit de Dazai (1933) : Suwa, jeune fille de 13 ans qui vit seule avec son père charbonnier dans la montagne, tient une petite boutique près d'une cascade. Une nuit d'hiver, son père ivre la menace ; elle s'enfuit dans la tempête de neige et se jette dans la cascade. Elle se réveille transformée en petit poisson (funa), libre, débarrassée de la mémoire humaine. Conte lyrique, sombre, tournant vers le merveilleux.

### Métadonnées proposées

- **id**: `gyofukuki`
- **titleJp**: 魚服記
- **titleEn**: The Fish Tale
- **author**: Dazai Osamu
- **genre**: fiction
- **jlptLevel**: **N3** — l'intermediate contient clairement du N3 (轟音, 絶望, 抵抗, 振り絞る, 〜まつわる, 〜たびに, ひどく…), le beginner reste accessible. Cohérent avec asa et hana.
- **coverColor proposition**: `#5B7B8C` (bleu-gris cascade froide) — distinct des autres Dazai (#B85C2A 秋, #C8956D メロス, #7A9BB8 待つ, #E8A87C 朝).
- **readingTimeMin**: 10 (~2900 chars intermediate ÷ ~290 chars/min, légèrement plus lent que asa car registre plus narratif/descriptif).
- **synopsis (proposition a)**: "Deep in a northern mountain, thirteen-year-old Suwa lives alone with her charcoal-burning father by a roaring waterfall. After a winter night when her drunken father becomes something monstrous, she flees into the blizzard and throws herself into the freezing pool — only to wake transformed, weightless, and finally free. Dazai's earliest masterpiece: a brutal folk tale that slips quietly into the miraculous."
- **audio**: aucun pour l'instant.

### Sources

- **Beginner**: `user-uploads://gyofuki_beg.json` — propre, parenthèses furigana à stripper (`馬禿山（まはげやま）`, `炭（すみ）`, `滑り（すべり）`, etc.).
- **Intermediate**: `user-uploads://gyofuki_inter.json` — propre, mêmes parenthèses furigana à stripper (`羊歯（しだ）`, `滝壺（たきつぼ）`, `籠（かご）`, `獣（けもの）`, `阿呆（あほう）`, `轟音（ごうおん）`, `蛇（へび）`).
- **Original**: à fetcher depuis Aozora Bunko (Dazai 太宰治, 魚服記 — carte 263, fichier `1572_15904.html` à confirmer), puis pipeline standard : strip `<ruby>`/`《…》`, `［＃…］`, `｜`, normalisation espaces.

### Étapes

1. **Créer `src/data/books/gyofukuki.ts**` avec `gyofukukiSimplified`, `gyofukukiIntermediate`, `gyofukukiOriginal`. Stripper toutes les parenthèses furigana sur les 3 niveaux.
2. **Étendre `src/data/book-reading-overrides.ts**` — bloc `'gyofukuki'`. Liste préliminaire :
  - `馬禿山: まはげやま`, `滝: たき`, `滝壺: たきつぼ`, `炭: すみ`, `炭焼き: すみやき`, `蛇: へび`, `羊歯: しだ`, `籠: かご`, `獣: けもの`, `阿呆: あほう`, `轟音: ごうおん`, `崖: がけ`, `麓: ふもと`, `紅葉: こうよう`, `駄菓子: だがし`, `塩せんべい: しおせんべい`, `鏡: かがみ`, `髪飾り: かみかざり`, `木枯らし: こがらし`, `吹雪: ふぶき`, `絶望: ぜつぼう`, `抵抗: ていこう`, `振り絞る: ふりしぼる`, `濁る: にごる`, `突き飛ばす: つきとばす`, `身を投げる: みをなげる`, `フナ: ふな`, `腐った: くさった`, `初秋: しょしゅう`, `店番: みせばん`, `小屋: こや`.
3. **Enregistrer dans `src/data/books.ts**` : import + entrée `Book` après `asa`.
4. **Régénérer tokens** : `bunx tsx scripts/generate-tokens.ts`.
5. **Créer `scripts/generate-grammar-for-gyofukuki.ts**` (copie de `generate-grammar-for-asa.ts`) puis exécuter — ~7 notes par niveau. Cibles attendues : `〜ように言う`, `〜たびに`, `〜まつわる`, `〜ながら`, `〜てしまう`, `〜ようとする`, `〜まま`, `〜ように`, conditionnel `〜と` (changement automatique), `〜ているうちに`, passif `〜られる`.
6. **Précharger le dictionnaire** : `bunx tsx scripts/sync-dictionary-to-db.ts`.
7. **QA** sur `/reader/gyofukuki/{simplified,intermediate,original}` — pas de parenthèses résiduelles, furigana corrects (馬禿山 → まはげやま, 羊歯 → しだ, フナ visible), cover bleu-gris distinct dans la Library, ~10 min cohérent.

### Fichiers

- créer `src/data/books/gyofukuki.ts`
- créer `scripts/generate-grammar-for-gyofukuki.ts`
- éditer `src/data/books.ts`, `src/data/book-reading-overrides.ts`, `.lovable/plan.md`
- édités auto : `src/data/book-tokens.ts`, `src/data/book-grammar.ts`

### Hors scope

- Audio MP3.
- Adaptation simplified additionnelle (on prend le beginner JSON tel quel après strip).

### Points à confirmer (sinon je pars sur les valeurs ci-dessus)

1. **JLPT N3** OK ? Alternatives :
  - **N4** si tu veux refléter le beginner (mais l'intermediate est franchement N3).
  - **N2** pour refléter l'original Aozora (Dazai 1933, registre littéraire).
2. **Couleur `#5B7B8C**` (bleu-gris cascade froide) OK ? Variations :
  - `#3D5A6C` plus sombre/profond (eau du滝壺 nocturne).
  - `#8FA8B5` plus pâle (brume de cascade).
  - `#6B8E5A` vert-mousse (羊歯 / forêt automnale).
  - `#A8443A` rouge sombre (violence de la nuit, contraste fort avec les autres Dazai).
3. **Reading time 10 min** OK ? Alternatives : 8 min ou 12 min.
4. **Title EN** : "The Fish Tale" (court, joli) — alternatives : "Metamorphosis into a Fish" (littéral), "Fish Story" (sec), ou laisser juste `Gyofukuki` en romaji.
5. **Synopsis EN** ci-dessus OK, ou tu préfères :
  - (b) plus court : "Suwa, thirteen, lives by a thundering waterfall with her charcoal-burner father. One winter night his violence drives her into the snow — and into the freezing pool, where the story quietly turns into something else entirely."
  - (c) plus factuel : "Early Dazai folk tale: a young mountain girl, her drunken father, and a winter night that ends in a leap into a waterfall — and a strange, gentle transformation."