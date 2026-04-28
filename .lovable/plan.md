## Add 檸檬 (Lemon) by Kajii Motojirō

Single-text book, 3 difficulties, same integration pipeline as Rashōmon / Hashire Merosu.

### Decisions
- **Simplified / Intermediate**: from the two uploaded JSON files (`lemon_beg.json`, `lemon_inter.json`). The beginner content includes a couple inline glosses in parentheses (e.g. `丸善（まるぜん）`, `八百屋（野菜や果物を売る店）`, `爆弾（ばくだん）`) — these will be **stripped at the source** so the displayed text contains zero `（…）`. Furigana for those terms is provided via reading-overrides instead.
- **Original**: fetched from Aozora Bunko (Kajii 檸檬, card 401), cleaned with the same sanitization pipeline as the previous books — strip `<ruby>`, `［＃…］`, `※(…)`, `｜` anchors, all `（…）`/`(…)`, Aozora header/footer.
- **Metadata**: Fiction · N2 · cover `#E8C547` (lemon yellow) · ~12 min.
- **Synopsis**: short English blurb about the narrator's malaise lifted by a single lemon and his "bomb" daydream at the Maruzen bookstore.

### Steps

1. **Create `src/data/books/lemon.ts`**
   Export `lemonSimplified`, `lemonIntermediate`, `lemonOriginal`. Beginner/intermediate strings = JSON `content` with all `（…）` glosses removed.

2. **Fetch + clean the original**
   Download Kajii's 檸檬 from Aozora, run the existing cleanup script (same one used for Rashōmon / Merosu). Verify no `（`, `(`, `※`, `｜` remain.

3. **Register in `src/data/books.ts`**
   Add entry after `hashire-merosu`:
   ```
   id: 'lemon', titleJp: '檸檬', titleEn: 'Lemon',
   author: 'Kajii Motojirō', genre: 'fiction', jlptLevel: 'N2',
   coverColor: '#E8C547', readingTimeMin: 12,
   content: { simplified, intermediate, original }
   ```

4. **Reading overrides** (`src/data/book-reading-overrides.ts`)
   Add a `'lemon'` block for tricky kanji and proper nouns:
   `檸檬 れもん`, `丸善 まるぜん`, `八百屋 やおや`, `爆弾 ばくだん`, `寺町 てらまち`, `京極 きょうごく`, `蓄音機 ちくおんき`, `画集 がしゅう`, `肺尖 はいせん`, `肺 はい`, `神経衰弱 しんけいすいじゃく`, `憂鬱 ゆううつ`, `嫌悪 けんお`, `二日酔 ふつかよい`, `借金 しゃっきん`, `不吉 ふきつ`, `放浪 ほうろう`, `裏通り うらどおり`, `土壁 つちかべ`, `泥 どろ`, `香水 こうすい`, `硝子 ガラス`, `器 うつわ`, `息苦しい いきぐるしい`, `果物 くだもの`, `絵の具 えのぐ`, `掌 てのひら`, `匂い におい`, `久しぶり ひさしぶり`, `誇らしい ほこらしい`, `西洋 せいよう`, `棚 たな`, `城 しろ`, `芸術品 げいじゅつひん`, `輝く かがやく`, `見惚れる みとれる`, `悪戯 いたずら`, `恐ろしい おそろしい`, `木っ端微塵 こっぱみじん`, `爆発 ばくはつ`, `痛快 つうかい`, `想像 そうぞう`, `店員 てんいん`, `通り とおり`.

5. **Tokens** — run `bunx tsx scripts/generate-tokens.ts` to regenerate `src/data/book-tokens.ts`.

6. **Grammar** — duplicate `scripts/generate-grammar-for-merosu.ts` as `scripts/generate-grammar-for-lemon.ts` (importing the lemon strings) and run it to merge notes into `src/data/book-grammar.ts`.

7. **Dictionary preload** — run `bunx tsx scripts/sync-dictionary-to-db.ts` to fetch all new vocabulary into `src/data/book-dictionary.ts`.

8. **QA** — open the book in the reader on all 3 difficulties:
   - No `（）`, `()`, `※`, `｜` visible anywhere.
   - Furigana toggle shows correct readings on `檸檬`, `丸善`, `八百屋`, `憂鬱`, `蓄音機`, `木っ端微塵`.
   - First sentence of each difficulty matches the source.

### Files
- create `src/data/books/lemon.ts`
- create `scripts/generate-grammar-for-lemon.ts`
- edit `src/data/books.ts`
- edit `src/data/book-reading-overrides.ts`
- edit (auto-regenerated) `src/data/book-tokens.ts`, `src/data/book-grammar.ts`, `src/data/book-dictionary.ts`
- edit `.lovable/plan.md`

### Out of scope
Audio (no MP3 provided — can be added later via the standard `book-audio/{bookId}/{difficulty}.mp3` pipeline).
