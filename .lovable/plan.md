# Add 羅生門 (Rashōmon) by Akutagawa Ryūnosuke

Single-text book in 3 difficulties, integrated like Kumo no Ito.

## Decisions (confirmed)
- **Original**: text from the uploaded `rashomon.json` (not Aozora).
- **Metadata**: Fiction · N1 · cover `#8B2E2E`.
- **Synopsis**: short English blurb (servant under the gate, old woman pulling hair from corpses, moral pivot).

## Steps

1. **Create `src/data/books/rashomon.ts`**
   Export `rashomonSimplified`, `rashomonIntermediate`, `rashomonOriginal` from the JSON contents (`beginner` → `simplified`).

2. **Register in `src/data/books.ts`**
   Add entry:
   ```
   id: 'rashomon', titleJp: '羅生門', titleEn: 'Rashōmon',
   author: 'Akutagawa Ryūnosuke', genre: 'fiction', jlptLevel: 'N1',
   coverColor: '#8B2E2E', readingTimeMin: 12,
   content: { simplified, intermediate, original }
   ```

3. **Reading overrides** (`src/data/book-reading-overrides.ts`)
   Add a `'rashomon'` entry with hand-picked readings for tricky words:
   `羅生門 らしょうもん`, `下人 げにん`, `老婆 ろうば`, `死骸 しがい`, `太刀 たち`, `飢え死に うえじに`, `丹塗り にぬり`, `朱雀大路 すざくおおじ`, `鴉 からす`, `雨やみ あまやみ`, `面皰 にきび`, `檜皮色 ひわだいろ`, `市女笠 いちめがさ`, `揉烏帽子 もみえぼし`, `聖柄 ひじりづか`, `黒洞々 こくとうとう`, `蟋蟀 きりぎりす`, etc.

4. **Tokens** — run `npx tsx scripts/generate-tokens.ts` to regenerate `src/data/book-tokens.ts` (will pick up rashomon automatically since it reads from `books.ts`).

5. **Grammar** — duplicate `scripts/generate-grammar-for-kumo.ts` as `scripts/generate-grammar-for-rashomon.ts` (importing the rashomon strings) and run it to merge notes into `src/data/book-grammar.ts`.

6. **Dictionary preload** — run `scripts/sync-dictionary-to-db.ts` to fetch Jisho entries for all new vocabulary and update `src/data/book-dictionary.ts`.

## Files
- create `src/data/books/rashomon.ts`
- create `scripts/generate-grammar-for-rashomon.ts`
- edit `src/data/books.ts`
- edit `src/data/book-reading-overrides.ts`
- edit (auto) `src/data/book-tokens.ts`, `src/data/book-grammar.ts`, `src/data/book-dictionary.ts`

## Out of scope
Audio (no MP3 provided).
