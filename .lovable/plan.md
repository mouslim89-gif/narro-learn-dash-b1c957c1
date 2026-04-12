

## Replace Custom Tokenizer with Kuromoji (Pre-baked)

### Approach

Run Kuromoji at **build time** (via a Node.js script) to tokenize all book texts. Store the tokenized results as a new static data file. At runtime, the Reader simply reads the pre-computed tokens — no tokenizer runs in the browser at all.

Kuromoji provides proper morphological analysis: accurate word boundaries, part of speech, base forms (basic_form), and readings. This eliminates all the edge cases of the current rule-based tokenizer.

### What changes

**1. Add `kuromoji` as a dev dependency**
- `npm install --save-dev kuromoji` (only used at build time, not shipped to browser)

**2. Create build script `scripts/generate-tokens.ts`**
- Loads all books from `src/data/books.ts`
- For each book × difficulty, runs Kuromoji tokenizer
- Produces tokens with: `surface_form`, `reading`, `basic_form`, `pos` (part of speech)
- Groups punctuation as non-Japanese, everything else as Japanese tokens
- Outputs a new static file `src/data/book-tokens.ts` — a nested structure: `bookId → difficulty → Token[]`

**3. Create new data file `src/data/book-tokens.ts`**
- Pre-computed token arrays per book per difficulty
- Each token: `{ text: string; isJapanese: boolean; reading?: string; baseForm?: string; pos?: string }`
- The reading and baseForm come directly from Kuromoji — perfect for furigana and dictionary lookup

**4. Update `src/pages/Reader.tsx`**
- Instead of `tokenize(book.content[difficulty])`, read from `bookTokens[id][difficulty]`
- Remove import of `tokenize`
- Tokens already have readings attached, so furigana can use them directly

**5. Update `src/components/FuriganaWord.tsx`**
- Accept optional `reading` prop from the pre-computed token data
- Fall back to Jisho cache lookup if no reading provided (for backward compat)

**6. Update dictionary seeding**
- The build script also looks up each unique `baseForm` via the Jisho edge function
- Updates `src/data/book-dictionary.ts` keyed by both surface form and base form
- Sets `deinflected` automatically using Kuromoji's `basic_form`

**7. Remove/simplify `src/lib/tokenizer.ts`**
- Keep it for the Dictionary search page (live input tokenization) but it's no longer used for book reading
- Alternatively, remove it entirely if Dictionary search can use a simpler approach

### Technical details

- Kuromoji's dictionary files (~20MB) are only needed at build time on disk, never shipped to the browser
- The generated `book-tokens.ts` will be roughly the same size as current `book-dictionary.ts` (~1-2MB)
- Kuromoji provides `basic_form` which is the dictionary form (e.g. `行きました` → `行く`), solving the deinflection problem completely
- `pos` gives us part of speech (動詞, 形容詞, 助詞, etc.) which can replace the heuristic `isVerb`/`isIAdjective` checks

### Files to create/modify
1. `scripts/generate-tokens.ts` — New build script using Kuromoji
2. `src/data/book-tokens.ts` — New pre-computed token data (generated)
3. `src/data/book-dictionary.ts` — Regenerated with Kuromoji base forms
4. `src/pages/Reader.tsx` — Use pre-computed tokens instead of runtime tokenizer
5. `src/components/FuriganaWord.tsx` — Accept reading from token data
6. `src/components/WordPopup.tsx` — Use Kuromoji POS for verb/adjective detection
7. `package.json` — Add kuromoji dev dependency

