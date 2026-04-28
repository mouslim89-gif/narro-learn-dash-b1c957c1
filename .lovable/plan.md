## Add 走れメロス (Hashire Merosu / Run, Melos!) by Dazai Osamu

Single-text book in 3 difficulties, integrated like Rashōmon / Kumo no Ito.

### Decisions (confirmed)
- **Beginner / intermediate**: from the two uploaded JSON files
- **Original**: fetched from Aozora Bunko (Dazai 走れメロス, card 1567), with **all furigana stripped at the source** (same pipeline used to fix Rashōmon — no `（...）`, no `※(...)` Aozora markers, no inter-char spaces, no `｜` ruby anchors)
- **Metadata**: Fiction · N2 · cover `#C8956D` · ~25 min
- **Synopsis**: short English blurb (Melos races back to save his friend held hostage by a tyrant — a classic on friendship, trust, and the power of keeping one's word)

### Steps

1. **Create `src/data/books/hashire-merosu.ts`**
   Export `merosuSimplified`, `merosuIntermediate`, `merosuOriginal` from the JSON contents (`beginner` → `simplified`).

2. **Fetch + clean the original**
   Download Dazai's `走れメロス` from Aozora (HTML version), strip:
   - `<ruby>...<rt>...</rt></ruby>` → keep only base
   - All `（...）` / `(...)` parentheses (furigana glosses)
   - `※「...」` Aozora rare-kanji markers
   - `｜` ruby anchors
   - Aozora boilerplate header/footer
   - Stray inline whitespace between Japanese chars
   Verify zero `（` / `(` / `※` / `｜` remain before saving.

3. **Register in `src/data/books.ts`**
   Add entry after `rashomon`:
   ```
   id: 'hashire-merosu', titleJp: '走れメロス', titleEn: 'Run, Melos!',
   author: 'Dazai Osamu', genre: 'fiction', jlptLevel: 'N2',
   coverColor: '#C8956D', readingTimeMin: 25,
   content: { simplified, intermediate, original }
   ```

4. **Reading overrides** (`src/data/book-reading-overrides.ts`)
   Add a `'hashire-merosu'` entry for tricky proper nouns / rare kanji:
   `走れメロス はしれめろす`, `邪智暴虐 じゃちぼうぎゃく`, `暴君 ぼうくん`, `人質 ひとじち`, `花嫁 はなよめ`, `花婿 はなむこ`, `石工 いしく`, `濁流 だくりゅう`, `山賊 さんぞく`, `十字架 じゅうじか`, `信実 しんじつ`, `刑場 けいじょう`, `処刑 しょけい`, `牧人 ぼくじん`, `村 むら`, `笛 ふえ`, `羊 ひつじ`, `短剣 たんけん`, `兵卒 へいそつ`, `城 しろ`, `王様 おうさま`, `王 おう`, `兄 あに`, `妹 いもうと`, `親友 しんゆう`, `約束 やくそく`, `怒り いかり`, `絶望 ぜつぼう`, `勇者 ゆうしゃ`, `緋 ひ`, `緋のマント ひのまんと`, `深紅 しんく`, `刹那 せつな`, `身代り みがわり`, `磔 はりつけ`, `寝過し ねすごし`, `小走り こばしり`, `堂々 どうどう`, `黄昏 たそがれ`, `赤面 せきめん`, `セリヌンティウス せりぬんてぃうす`, `ディオニス でぃおにす`, `シラクス しらくす`, `メロス めろす` (etc.)

5. **Tokens** — run `bunx tsx scripts/generate-tokens.ts` to regenerate `src/data/book-tokens.ts` (auto-picks up the new book from `books.ts`).

6. **Grammar** — duplicate `scripts/generate-grammar-for-rashomon.ts` as `scripts/generate-grammar-for-merosu.ts` (importing the merosu strings) and run it to merge notes into `src/data/book-grammar.ts`.

7. **Dictionary preload** — run `bunx tsx scripts/sync-dictionary-to-db.ts` to fetch Jisho entries for all new vocabulary into `src/data/book-dictionary.ts`.

8. **QA** — open the book in the reader on all 3 difficulties, verify:
   - No `（）`, `()`, `※`, `｜` visible anywhere
   - Furigana toggle shows correct readings on key terms (`暴君`, `濁流`, `セリヌンティウス`…)
   - First paragraph of each difficulty matches the expected source

### Files
- create `src/data/books/hashire-merosu.ts`
- create `scripts/generate-grammar-for-merosu.ts`
- edit `src/data/books.ts`
- edit `src/data/book-reading-overrides.ts`
- edit (auto-regenerated) `src/data/book-tokens.ts`, `src/data/book-grammar.ts`, `src/data/book-dictionary.ts`
- edit `.lovable/plan.md` (record the addition)

### Out of scope
Audio (no MP3 provided — can be added later via the standard `book-audio/{bookId}/{difficulty}.mp3` pipeline).
