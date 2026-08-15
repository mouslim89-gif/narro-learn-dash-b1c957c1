# Project Memory

## Core
Tsundoku — Japanese reading app (mobile-first PWA). Warm editorial aesthetic: paper off-white bg, dark navy primary, amber/golden accent. NO HOVER (mobile only). App is in English.
Merriweather headings (`font-serif`), Inter body, Noto Sans JP for Japanese.
Interactive surfaces use `tap-scale` / `card-lift`. Pills (`rounded-full`) for primary actions; shared CTA style `.btn-tsundoku-premium`. Section labels are small uppercase tracked muted-foreground.
Round header/back buttons always carry `header-chip` (raised relief): `h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip`.
Never add small vertical amber accent bars before section titles/labels (ex-`.section-bullet`). Rejected by user.
Page headers: scroll-driven via `--p`; hairline invisible at top, fades in with scroll. Segmented selectors animate via Framer Motion `layoutId`.
Login required (Apple + Google + Email). Flashcards, reading progress and UI prefs sync via Lovable Cloud (local-first, 1.5s debounced push, Realtime).
Legacy storage keys `reading-progress` and `yomimasu-flashcards` must NOT be renamed.
Never let a page view trigger an AI generation when a DB cache row exists — every AI feature is cached (see Grammar / Dictionary memories, and CLAUDE.md "AI cost & caching").
Admin gate is server-side only (`admin_users` + `get_is_admin` RPC via `useIsAdmin()`), never an email string. Admin toggles: always-replay onboarding, disable app animation, token editing.
Reader and flashcard review have their own UI rules and are excluded from app-wide uniformity work.

## Memories
- [Audio pipeline](mem://features/audio-pipeline) — Storage bucket, Scribe sync, Reader highlight + auto-scroll
- [Dictionary](mem://features/dictionary) — DB-backed dictionary, IndexedDB cache, preloading, example sentences
- [Grammar](mem://features/grammar) — Grammar notes, structures/examples, `grammar_examples` cache, backfill script
- [Library home](mem://features/library-home) — Continue hero, curated collections, genre rails, daily goals
