---
name: Dictionary integration
description: Jisho.org API via edge function proxy, client-side tokenizer, SavedWord flashcard type
type: feature
---
- Edge function `jisho-lookup` proxies Jisho.org API, returns top 5 results with cleaned data
- `src/lib/jisho.ts` — client helper with in-memory Map cache
- `src/lib/tokenizer.ts` — character-type grouping tokenizer (kanji+okurigana, hiragana, katakana)
- `SavedWord` type: id, word, reading, meanings[], jlpt?, partsOfSpeech?
- WordPopup fetches from Jisho on mount, shows loading/error states
- Dictionary page has debounced live search against Jisho
