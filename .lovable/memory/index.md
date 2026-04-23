# Memory: index.md
Updated: now

# Project Memory

## Core
Tsundoku — Japanese reading app (mobile-first). Modern colorful Duolingo-like UI. Primary teal, accent coral, secondary purple.
Nunito headings, Noto Sans JP for Japanese text. App is in English.
Login obligatoire (Apple + Google + Email). Flashcards & reading progress synced via Lovable Cloud (local-first + 1.5s debounced push, Realtime). UI prefs (dark mode, font, furigana) stay local.
Internal storage keys keep the legacy `yomimasu-*` prefix to preserve existing local data — do NOT rename them.

## Memories
- [App structure](mem://features/app-structure) — Pages, navigation, data model overview
