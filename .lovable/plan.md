

## Online Dictionary Integration

### Problem
The current dictionary is hardcoded with only 30 words, so most words in the reader are not clickable.

### Solution
Two changes are needed:

1. **Proper Japanese tokenization** — Replace the custom greedy tokenizer with `kuromoji.js`, a real Japanese morphological analyzer that runs in the browser. It correctly segments any Japanese text into words with their dictionary forms (lemmas), readings, and parts of speech.

2. **Online dictionary lookups via Jisho.org** — When a user taps any word, query the Jisho.org API (`https://jisho.org/api/v1/search/words?keyword=...`) through a Supabase Edge Function (to avoid CORS issues). This gives full definitions, readings, JLPT level, and example sentences for any Japanese word.

### Architecture

```text
User taps word in Reader
        │
        ▼
kuromoji tokenizer (client-side, ~2MB dictionary loaded once)
splits text into proper words with base forms
        │
        ▼
WordPopup appears with loading state
        │
        ▼
Edge Function proxies request to Jisho.org API
        │
        ▼
Popup shows: word, reading, all meanings, JLPT tag, save-to-flashcards button
```

Results are cached in memory so repeated taps on the same word are instant.

### Technical Details

**Files to create:**
- `supabase/functions/jisho-lookup/index.ts` — Edge function that proxies `GET https://jisho.org/api/v1/search/words?keyword={word}` and returns cleaned results
- `src/lib/jisho.ts` — Client-side API helper that calls the edge function, with in-memory cache

**Files to modify:**
- `src/lib/tokenizer.ts` — Replace greedy matcher with `kuromoji.js` initialization and tokenization. Export async `tokenize()` that returns tokens with surface form, reading, and base form (for dictionary lookup)
- `src/pages/Reader.tsx` — Load tokenizer asynchronously (show skeleton while loading), pass base form to popup
- `src/components/WordPopup.tsx` — Accept a raw word string instead of a `DictionaryEntry`, fetch definition from Jisho on mount, show loading/error states
- `src/pages/Dictionary.tsx` — Add live search against Jisho API (with debounce) in addition to local results
- `src/stores/flashcards.ts` — Update types to store Jisho-sourced word data (word, reading, meanings array)
- `package.json` — Add `kuromoji` dependency

**Requires:** Lovable Cloud enabled for the edge function deployment.

### What the user gets
- Every single word in any text becomes tappable
- Full dictionary definitions from Jisho.org (the most comprehensive free Japanese-English dictionary, based on JMDict)
- Dictionary page search works for any Japanese or English word
- The local 30-word dictionary is kept as a fallback/offline cache

