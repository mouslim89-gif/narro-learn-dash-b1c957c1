# Memory: index.md
Updated: now

# Project Memory

## Core
Yomimasu — Japanese reading app. Modern colorful Duolingo-like UI. Primary teal, accent coral, secondary purple.
Nunito headings, Noto Sans JP for Japanese text. App is in English.
No backend — localStorage via Zustand. Books use placeholder text for now.
Kuromoji pre-baked tokenization: run `npx tsx scripts/generate-tokens.ts` after changing book content.

## Memories
- [App structure](mem://features/app-structure) — Pages, navigation, data model overview
- [Dictionary](mem://features/dictionary) — Jisho lookup, book-dictionary.ts prebaked cache, deinflection
