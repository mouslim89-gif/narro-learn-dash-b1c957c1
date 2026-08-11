# Tsundoku

Mobile-first PWA for learning Japanese by reading graded literature. Each book ships in three
difficulty versions (simplified / intermediate / original) with inline word lookups, furigana,
per-sentence translations, grammar notes, SRS flashcards and synchronized audio.

## Stack

React 18 + TypeScript · Vite 5 · Tailwind CSS v3 + shadcn/ui · Zustand (persisted) ·
TanStack Query · Framer Motion · Lovable Cloud (Supabase: auth, Postgres, Deno edge functions,
Storage, Realtime) · Kuromoji + Wanakana for Japanese NLP.

## Run locally

```bash
bun install
bun run dev        # http://localhost:8080
bunx vitest run    # unit tests
```

## Layout

| Path | What it holds |
|---|---|
| `src/pages/` | Routes: library (`/`), book detail, reader, flashcards, dictionary, grammar detail, my books, settings |
| `src/components/` | Feature components (`ui/` is shadcn — don't hand-edit) |
| `src/stores/` | Zustand stores (reading progress, flashcards, onboarding, saved grammar, token rules) |
| `src/data/` | Book texts, pre-generated tokens, grammar notes, collections |
| `src/lib/` | Dictionary/IndexedDB cache, SRS, audio sync, translation, grammar helpers |
| `supabase/functions/` | Edge functions (lookups, translation, grammar, TTS, audio sync) |
| `scripts/` | One-off content pipelines (tokens, grammar, dictionary, translations, grammar backfill) |

## Content pipeline

Adding a book is scripted end to end: generate difficulty versions and metadata, write
`src/data/books/<id>.ts`, register it in `src/data/books.ts`, then run
`generate-tokens.ts`, `generate-grammar-for-<id>.ts`, `sync-dictionary-to-db.ts`,
`preload-translations.ts --book <id>` and `preload-grammar-examples.ts`. Preloading is what keeps
the app instant and AI credits near zero at runtime.

See `CLAUDE.md` for the full project context, design system and caching rules.
