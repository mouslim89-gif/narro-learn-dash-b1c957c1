# AI content audit + fixing the "mini loading" on example sentences

## What I verified

Backend cache tables (live counts):

| Content | Table | Rows | Status |
|---|---|---|---|
| Word definitions | `dictionary` | 11 308 | Fully preloaded (no AI, Jisho proxy) |
| Example sentences + furigana | `example_sentences` | 476 (476 with tokens) | Lazy, on first encounter — uses AI for tokenization |
| Sentence translations | `sentence_translations` | 4 865 | Preloaded per book on reader open, then cached |
| Grammar examples/formations | `grammar_examples` | **1** | Essentially not cached — preload almost never runs |
| Kanji details | `kanji_details` | 44 | Lazy, no AI (KanjiAPI proxy) |
| Audio sync | `book_audio_sync` | 1 | Manual/admin only |

AI spend over the last 7 days: **18 gateway requests, ~0.005 credits total**. So nothing is currently burning credits — the earlier runaway was fixed.

## Why an already-seen word still shows a short loading

Definitions are truly instant (memory + IndexedDB + static shards). The flicker comes from the **example sentence**, and there are two causes:

1. **No persistent client cache for examples.** `src/lib/tatoeba.ts` only has an in-memory `Map`, wiped on every page reload. So the first time you tap a word in a session, the app calls the `tatoeba-example` edge function over the network (~300–600 ms) even when the sentence is already in the database. Definitions don't do this because they are mirrored in IndexedDB.
2. **The fetch is serialized.** In `WordPopup`, `<ExampleSentence>` is only mounted after the definition has resolved, so its network call starts late instead of in parallel.

## Proposed fix (choose one)

**Option A — Persist examples like definitions (recommended)**
- Add an `examples` object store to the existing IndexedDB helper (`src/lib/dictionary-db.ts`), written on every successful fetch.
- `fetchExamples` reads memory → IndexedDB → edge function.
- When the reader preloads a book's dictionary, also bulk-`SELECT` `example_sentences` for that book's tokens in one query and store them locally. One cheap DB read, zero AI.
- Result: after a book is opened once, example sentences are instant offline, forever.

**Option B — Minimal: kill the serialization + skeleton flash**
- Start the example fetch as soon as the popup opens (in parallel with the definition lookup).
- Keep the skeleton hidden for the first ~120 ms so a fast cache hit renders with no visible flash.
- Cheaper to build, but still one network round-trip per word per session.

**Option C — A + B together** (best perceived speed; slightly more work.)

## Separately: grammar examples

`grammar_examples` has 1 row, meaning nearly every grammar-point page still generates with AI on first open. The preload only runs when a book is opened and stops at the first failure. Two choices:
- **Leave lazy** (cheap: ~1 AI call per grammar point, once ever, then cached).
- **Batch backfill once** via an admin-run script over all ~622 patterns, throttled, so the pages are always instant afterwards. One-off cost, then zero.

## Technical notes
- Files touched by Option A/B: `src/lib/tatoeba.ts`, `src/lib/dictionary-db.ts`, `src/components/ExampleSentence.tsx`, `src/components/WordPopup.tsx`, `src/components/DictionaryPreloader.tsx`.
- No edge-function or AI-prompt changes; the tokenization path stays as-is and is only hit for genuinely new words.
