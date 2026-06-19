# Project Memory

## Core
Tsundoku — Japanese reading app (mobile-first PWA). Warm editorial aesthetic: paper off-white bg, dark navy primary, amber/golden accent. NO HOVER (mobile only).
Merriweather headings (`font-serif`), Inter body, Noto Sans JP for Japanese. App is in English.
Interactive surfaces use `tap-scale` / `card-lift`. Pills (`rounded-full`) for primary actions. Section labels are small uppercase tracked muted-foreground.
Segmented selectors animate via Framer Motion `layoutId` (sliding pill, no tap darken).
Login required (Apple + Google + Email). Flashcards & reading progress synced via Lovable Cloud (local-first + 1.5s debounced push, Realtime). UI prefs synced too.
Legacy storage keys `reading-progress` and `yomimasu-flashcards` must NOT be renamed.
Backend = Lovable Cloud (Supabase). Dictionary lives in DB `dictionary` table, hydrated client-side via IndexedDB shards. `src/data/book-dictionary.ts` is a deprecated empty stub.
Audio per book: bucket `book-audio`, sync table `book_audio_sync`, ElevenLabs Scribe via edge function `generate-audio-sync`.

## Memories
- [Audio pipeline](mem://features/audio-pipeline) — Storage bucket, Scribe sync, Reader highlight + auto-scroll
- [Dictionary](mem://features/dictionary) — DB-backed dictionary, IndexedDB cache, Jisho fallback
