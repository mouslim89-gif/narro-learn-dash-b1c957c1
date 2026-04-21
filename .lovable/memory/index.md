# Memory: index.md
Updated: today

# Project Memory

## Core
Yomimasu — Japanese reading app. Modern colorful Duolingo-like UI. Primary teal, accent coral, secondary purple.
Nunito headings, Noto Sans JP for Japanese text. App is in English.
No client-side auth (yet). Reading progress in localStorage via Zustand. Shared data (dictionary, audio sync, sentence translations) in Lovable Cloud DB.

## Memories
- [App structure](mem://features/app-structure) — Pages, navigation, data model overview
- [Dictionary](mem://features/dictionary) — Global DB table + IndexedDB hydration per book
- [Audio pipeline](mem://features/audio-pipeline) — Storage bucket + ElevenLabs Scribe sync + Reader highlight & auto-scroll
