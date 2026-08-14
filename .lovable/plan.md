# Furigana in Grammar Detail without AI

You're right — the AI call is unnecessary. The exact sentence in "From your reading" comes straight from a book, and every book already ships with pre-tokenized data (surface + reading) generated offline with Kuromoji in `src/data/book-tokens/books/<book>.ts`. That's exactly what the Reader and Word Detail use. We can read the furigana from there instead of generating anything.

## What changes

1. **Resolve the extract's tokens locally.**
   In `GrammarDetail.tsx`, replace the `tatoeba-example` "tokenize" call with a lookup:
   - load the book's tokens with `loadBookTokens(rootBookId)`,
   - concatenate token surfaces into a string, find the offset of `note.example`,
   - slice the matching token range and map to `{ t, r }` for `<FuriganaSentence />`.
   This is instant, offline, and free.

2. **Know which book the extract comes from.**
   - `GrammarPanel` (Reader) will pass `bookId` + `difficulty` in the navigation state alongside `note`.
   - `saved_grammar` already stores `bookId`; add `difficulty` when saving so a saved item opened from Flashcards resolves too.
   - If only `bookId` is known, try each difficulty of that book until the sentence matches.

3. **Fallbacks, no AI.**
   - If no match (edge cases: minor punctuation differences), normalize whitespace/punctuation and retry.
   - If it still doesn't match, render the plain sentence exactly like before. No network call, no generation.

4. **Remove the AI path.**
   Drop the `tokenize` invocation and the `tok:` cache read/write in `GrammarDetail.tsx`. The edge-function tokenize mode stays in place for dictionary examples (Tatoeba sentences, which are not in any book), untouched.

## Technical notes

- Files touched: `src/pages/GrammarDetail.tsx`, `src/components/GrammarPanel.tsx`, `src/stores/saved-grammar.ts` (add optional `difficulty`), and the `saved_grammar` cloud mapping in `src/lib/sync/cloud-sync.ts` if the column is needed (optional field, no migration required if we keep it local-only — recommended: keep it local-only to avoid a schema change).
- Root book id: reuse the same root-id derivation the Reader uses for `loadBookTokens` (chapters share the root file).
- Zero AI credits for grammar extracts after this change.
