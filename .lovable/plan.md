# Refresh project documentation to match the current app

The reference docs have drifted: `CLAUDE.md` still describes an older version of the app, `README.md` is the untouched Lovable placeholder, and the memory files miss several features shipped since (grammar detail pages, onboarding, daily goals, library redesign, AI-cost caching rules).

## What gets updated

### 1. `CLAUDE.md` (main context file)
Bring every section in line with the code as it exists today:
- **Routes**: add `/grammar/:id` (Grammar Detail); confirm the full route list including reader chapter routes.
- **Components**: add the ones missing from the tree — `SplashScreen`, `AnimatedTitle`, `DelayedLink`, `DictionaryPreloader`, `HalfGauge`, `DailyGoalProgress`, `library/ContinueHero`, `my-books/ContributionGraph`, `my-books/DailyGoalCard`, `onboarding/OnboardingCarousel`, `onboarding/ReaderTutorial`.
- **Stores**: add `onboarding.ts` and `saved-grammar.ts`.
- **Lib**: add `admin.ts`, `grammar.ts`, `grammar-preload.ts`, `romaji.ts`, `tatoeba.ts`, `sync/sync-status.ts`.
- **Data**: add `collections.ts` (curated library rails) and the per-book token/grammar layout.
- **Edge functions**: complete the list (`backfill-example-tokens`, `delete-account`, `tatoeba-example`, `translate-sentences-batch`, `_shared/ai-gateway.ts`, `_shared/auth.ts`).
- **Design system**: remove the `.section-bullet` entry (banned), document the current library rails / hero / gauge patterns and the premium CTA button style.
- **New "AI cost & caching" section**: state, per feature, where content comes from and whether it is preloaded, DB-cached or generated on demand (definitions, example sentences, translations, kanji, grammar structures and examples), plus the rule that nothing should trigger AI generation on a page view when a cache row exists.
- **New "Admin features" section**: admin gate via `admin_users` / `is_admin`, replay-onboarding toggle, disable-animation toggle, token editing.

### 2. `README.md`
Replace the placeholder with a real short project README: what Tsundoku is, stack, how to run (`bun install`, `bun run dev`), directory pointers, and where the content scripts live.

### 3. Memory files (`mem://`)
- Update `index.md` Core with: login-gated app, grammar detail feature, onboarding + admin replay, daily-goal gauges, the no-`section-bullet` constraint, and the "never generate AI content that already has a DB cache" rule.
- Add `mem://features/grammar` — grammar notes, structures, examples, `grammar_examples` DB cache, backfill script, cache-first `GrammarDetail`.
- Add `mem://features/library-home` — hero + rails structure, collections, genres.
- Refresh `mem://features/dictionary` with example sentences (`tatoeba-example`, cached tokens/furigana) and the preloading path.

### 4. Skills
Three of the six active skills are out of date:
- **`add-book`** — still calls the app "Yomimasu" everywhere. Rename to Tsundoku and verify the pipeline steps match today's scripts (`generate-tokens.ts`, per-book grammar generation, `sync-dictionary-to-db.ts`, `preload-translations.ts`, `preload-grammar-examples.ts` for the new grammar cache).
- **`add-book-audio`** — describes a data model that no longer exists (`audioUrl`, `durations`, `timestamps` in `books.ts`). Rewrite against the real pipeline: `book-audio` storage bucket, `audio: { [difficulty]: { durationSec } }` in `books.ts`, `book_audio_sync` table, `generate-audio-sync` edge function, `AudioPlayer` + Reader highlight/auto-scroll.
- **`qa-continu`** — references a preview tool that no longer exists; point it at the Playwright-based browser workflow and add the current pages (`/grammar/:id`, `/my-books`, `/dictionary/:word`).

`dev-loop`, `split-book-into-parts` and `tsundoku-dev` are still accurate; only small wording touch-ups if their file lists drifted.

## Notes
Documentation and skills only — no application code, schema or behaviour changes.

