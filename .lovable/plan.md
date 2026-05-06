## Add 浦島太郎 (Urashima Tarō) — Kusuyama Masao

Classic Japanese folk tale: a kind young fisherman saves a tortured turtle, is taken to the underwater Dragon Palace (Ryūgū-jō) by Princess Otohime, spends three blissful years there, then returns home to find 300 years have passed. Opens the forbidden tamatebako and instantly becomes an old man.

### Proposed metadata

- **id**: `urashima`
- **titleJp**: 浦島太郎
- **titleEn**: Urashima Tarō
- **author**: Kusuyama Masao
- **genre**: fiction (folk tale)
- **jlptLevel**: **N4** — beginner is solidly N5/N4, intermediate is N4 with a bit of N3 (養う, 諭す, 名残惜しい, がく然, 途方に暮れる). Coherent with kumo (also a folk tale).
- **coverColor**: `#4A90B8` deep ocean blue — the sea is the soul of this story; distinct from existing covers.
- **readingTimeMin**: 9 (intermediate ~3400 chars).
- **synopsis**: "A kind young fisherman saves a turtle from cruel children and is rewarded with a journey to the Dragon Palace beneath the waves, where Princess Otohime hosts him in a paradise of eternal seasons. Three carefree years later he returns home — only to discover that three hundred years have passed on land, and the small lacquered box the princess gave him holds a final, devastating gift."
- **audio**: none for now.
- **Original version**: Aozora Bunko (Kusuyama Masao 楠山正雄, card 329 — 浦島太郎). Will fetch + sanitize (`<ruby>`, `［＃...］`, `《》`, `｜`).

### Steps

1. Create `src/data/books/urashima.ts` with `urashimaSimplified` (from `taro_beg.json`), `urashimaIntermediate` (from `taro_inter.json` — strip `（…）` furigana like `丹後（たんご）`, `珊瑚（さんご）`, `瑠璃（るり）`, `鯛（たい）`, `平目（ひらめ）`, `蝉（せみ）`, `蓋（ふた）`, `紐（ひも）`, `髭（ひげ）`, `杖（つえ）`, `竜宮城（りゅうぐうじょう）`, `乙姫（おとひめ）`, `玉手箱（たまてばこ）`), and `urashimaOriginal` (Aozora, sanitized).
2. Extend `src/data/book-reading-overrides.ts` with an `'urashima'` block. Preliminary list:
   - `浦島太郎: うらしまたろう`, `浦島: うらしま`, `太郎: たろう`, `漁師: りょうし`, `亀: かめ`, `甲羅: こうら`, `舟: ふね`, `小舟: こぶね`, `波: なみ`, `海辺: うみべ`, `砂浜: すなはま`, `珊瑚: さんご`, `瑠璃: るり`, `真珠: しんじゅ`, `乙姫: おとひめ`, `竜宮城: りゅうぐうじょう`, `玉手箱: たまてばこ`, `蓋: ふた`, `紐: ひも`, `煙: けむり`, `髭: ひげ`, `杖: つえ`, `丹後: たんご`, `両親: りょうしん`, `年老いた: としおいた`, `養う: やしなう`, `諭す: さとす`, `紅葉: こうよう`, `桜: さくら`, `蝉: せみ`, `鯛: たい`, `平目: ひらめ`, `神隠し: かみかくし`, `名残惜しい: なごりおしい`, `言い伝え: いいつたえ`, `墓: はか`, `寺: てら`, `裏山: うらやま`.
3. Register in `src/data/books.ts` (import + `Book` entry).
4. Regenerate tokens: `bunx tsx scripts/generate-tokens.ts`.
5. Create `scripts/generate-grammar-for-urashima.ts` (copy of asa script). Expected targets: `〜てしまう`, `〜なければならない`, `〜てやる/てくれる`, `〜てもらう`, `〜たまま`, passive `〜られる`, causative `〜せる`, `〜ように`, `〜かもしれない`, `〜はず`, `〜ばかり`, `〜きり`.
6. Preload dictionary: `bunx tsx scripts/sync-dictionary-to-db.ts`.
7. QA `/reader/urashima/{simplified,intermediate,original}` — no leftover `（…）`, furigana correct (竜宮城 → りゅうぐうじょう, 玉手箱 → たまてばこ, 乙姫 → おとひめ), deep blue cover visible in Library, ~9 min coherent.

### Files

- create `src/data/books/urashima.ts`
- create `scripts/generate-grammar-for-urashima.ts`
- edit `src/data/books.ts`, `src/data/book-reading-overrides.ts`
- auto-edited: `src/data/book-tokens.ts`, `src/data/book-grammar.ts`

### Out of scope

- Audio MP3.
- Extra simplified rewriting (we use the beginner JSON as-is).

### Points to confirm (otherwise I go with the values above)

1. **JLPT N4** OK? Alternatives:
   - **N5** to reflect the beginner JSON only.
   - **N3** to reflect the original Aozora (Meiji-era register).
2. **Cover `#4A90B8`** (deep ocean blue) OK? Variations:
   - `#1B3A5C` very dark abyss (the depths of Ryūgū).
   - `#7BC4D9` bright turquoise (sunny shore + tropical fish).
   - `#C9A86B` aged gold (the tamatebako, melancholy ending).
   - `#E8D5B7` pale sand (beach/nostalgia tone).
3. **Reading time 9 min** OK? Alternatives: 7 or 11.
4. **Title EN "Urashima Tarō"** (romaji, recognizable) OK? Alternatives: "The Fisherman and the Turtle", "Tarō of the Sea", "The Dragon Palace".
5. **Synopsis** OK, or prefer:
   - (b) shorter: "A young fisherman is taken to a palace beneath the sea after saving a turtle. When he finally returns home, three hundred years have passed — and a forbidden box waits in his hands."
   - (c) more factual: "Classic Japanese folk tale: Urashima Tarō saves a turtle, visits the Dragon Palace, and returns to find centuries have gone by on land."