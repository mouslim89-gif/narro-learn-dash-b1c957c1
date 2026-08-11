---
name: add-book-audio
description: Add narrated audio to an existing Tsundoku book — upload the MP3 to the book-audio bucket, register it in books.ts, and generate sentence-level sync timestamps so the Reader highlights and auto-scrolls in time with playback.
---

# Add audio to a book

Adds a narrated audio track to one book + difficulty, with sentence-level synchronization
(highlight + auto-scroll in the Reader). The playback UI already exists — this skill is about
getting the file and its sync data in place.

## When to use
- The user provides an audio file for an existing book.
- The user asks to enable audio / karaoke highlighting for a book.

## Real data model (do not invent fields)

```ts
// src/data/books.ts
audio?: Partial<Record<Difficulty, { durationSec: number }>>
```

There is no `audioUrl`, no `timestamps` array in `books.ts`. The file lives in Storage and the
timestamps live in the database.

| Piece | Where |
|---|---|
| Audio file | public Storage bucket `book-audio`, path `{bookId}/{difficulty}.mp3` |
| Sync data | table `book_audio_sync` (`book_id`, `difficulty`, `sentences: [{idx, startSec, endSec}]`, `duration_sec`) — public read, service-role write |
| Generation | edge function `generate-audio-sync` (ElevenLabs Scribe `scribe_v1`, `language_code: jpn`, word-level timestamps aligned onto the canonical sentences sent by the client) |
| Client cache | `src/lib/audio-sync.ts` — memory Map → IndexedDB (`idb-keyval`) → `book_audio_sync` → edge function |
| Player | `src/components/AudioPlayer.tsx` (real `<audio>`; props `src`, `onTimeUpdate`, `onLoadedMetadata`, `seekRequestRef`, `bottomOffset`) |

## Steps

1. **Normalize the file**
   ```bash
   ffmpeg -i input.wav -b:a 192k -ac 1 output.mp3
   ```
2. **Upload** to `book-audio/{bookId}/{difficulty}.mp3` (Storage upload tool or the Cloud UI). Bucket is public.
3. **Register it** in `src/data/books.ts` on that book:
   ```ts
   audio: { original: { durationSec: 912 } }
   ```
   `hasAnyAudio(book)` then shows the Headphones icon in BookCard / BookDetail / Library.
4. **Generate the sync** — open the book in the Reader at that difficulty and press play once, or call
   `generate-audio-sync` directly with the book's canonical sentences. First run takes ~30 s and is
   billed once (~$0.40/h of audio); the result is cached in `book_audio_sync` for every user.
5. **Verify** in the Reader: the active sentence gets `bg-primary/10 px-0.5`, auto-scroll centres it
   only if the user hasn't scrolled in the last 2500 ms, and tapping a sentence background seeks
   (taps on tokens keep their mini-popup behaviour).

## Notes
- MP3 192 kbps mono is the target format.
- Never re-run Scribe for a book+difficulty that already has a `book_audio_sync` row — it is a paid call.
- Never write to `book_audio_sync` from the client; only the edge function (service role) does.
