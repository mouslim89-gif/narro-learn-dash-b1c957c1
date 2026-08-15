# Tsundoku — Project Context

Japanese reading app (mobile-first PWA). Users read graded Japanese literature with inline word lookups, furigana, SRS flashcards, and synchronized audio. Built with Lovable — always respect Lovable's conventions, structure, and patterns.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript, Vite 5 (SWC plugin) |
| Routing | React Router v6 (`BrowserRouter`) |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix UI) + custom CSS in `src/index.css` |
| State | Zustand v5 with `persist` middleware (localStorage) |
| Backend | Supabase (auth, PostgreSQL, Deno edge functions, Realtime) |
| Animations | Framer Motion (`AnimatePresence`, `motion`) |
| Data fetching | TanStack Query v5 |
| Japanese NLP | Kuromoji (tokenizer), Wanakana (kana utils) |
| Tests | Vitest + Testing Library + Playwright (E2E) |
| Package manager | Bun (`bun.lock`) |
| Lovable plugin | `lovable-tagger` (Vite dev plugin — do not remove) |

---

## Directory structure

```
src/
├── App.tsx                   — Root providers + AnimatedRoutes + BottomNav logic
├── main.tsx                  — createRoot entry point
├── index.css                 — Design tokens, custom utilities, animations (source of truth)
│
├── pages/                    — Route-level components (export default function)
│   ├── Library.tsx           — / (home: continue hero + rails)
│   ├── BookDetail.tsx        — /book/:id
│   ├── Reader.tsx            — /reader/:id/:difficulty[/:chapterId]
│   ├── Flashcards.tsx        — /flashcards (SRS deck + review)
│   ├── Dictionary.tsx        — /dictionary
│   ├── WordDetail.tsx        — /dictionary/:word
│   ├── GrammarDetail.tsx     — /grammar/:id (structures + examples)
│   ├── MyBooks.tsx           — /my-books (shelves, streak graph, daily goals)
│   ├── Settings.tsx          — /settings
│   └── Auth.tsx, ResetPassword.tsx, NotFound.tsx
│
├── components/               — Feature components (export function)
│   ├── BottomNav.tsx         — Fixed bottom nav (hidden on reader/auth/review)
│   ├── BookCard.tsx          — Book cover card with progress ring
│   ├── AudioPlayer.tsx       — Synchronized audio player
│   ├── WordPopup.tsx         — Full lookup drawer (Radix Drawer)
│   ├── WordMiniPopup.tsx     — Inline mini popup anchored to sentence
│   ├── ReaderToken.tsx       — Single tappable token in Reader
│   ├── FuriganaWord.tsx      — Ruby/furigana rendering
│   ├── FuriganaSentence.tsx  — Furigana on a full sentence (examples, extracts)
│   ├── FlashcardReview.tsx, SrsButtons.tsx
│   ├── GrammarPanel.tsx, ConjugationTable.tsx, ExampleSentence.tsx
│   ├── SentenceTranslationPopup.tsx
│   ├── TokenEditPanel.tsx, TokenEditFloatingBar.tsx
│   ├── SplashScreen.tsx      — App entry animation (admin can disable)
│   ├── AnimatedTitle.tsx     — Per-char animated wordmark
│   ├── DictionaryPreloader.tsx — Background dictionary/token/grammar hydration
│   ├── HalfGauge.tsx         — SVG half-circle gauge (daily goals)
│   ├── DailyGoalProgress.tsx — Linear daily-goal bar
│   ├── PlayWordButton.tsx, NavLink.tsx, DelayedLink.tsx
│   ├── ProtectedRoute.tsx, ScrollToTop.tsx
│   ├── library/ContinueHero.tsx        — Big "continue reading" hero card
│   ├── my-books/BookShelfRow.tsx
│   ├── my-books/ContributionGraph.tsx  — GitHub-style activity grid
│   ├── my-books/DailyGoalCard.tsx      — Two half-gauges (reviews / new cards)
│   ├── onboarding/OnboardingCarousel.tsx — First-launch carousel (never in reader)
│   ├── onboarding/ReaderTutorial.tsx     — Spotlight tutorial inside the Reader
│   └── ui/                   — shadcn/ui components (do not modify manually)
│
├── contexts/
│   └── AuthContext.tsx        — Supabase auth provider + useAuth hook
│
├── hooks/
│   ├── use-cloud-sync.ts      — Mounts sync on login/logout
│   ├── use-long-press.ts, use-body-scroll-lock.ts
│   ├── use-scroll-progress.ts — Scroll-driven header var (`--p`)
│   └── use-delayed.ts, use-delayed-nav.ts, use-mobile.tsx, use-toast.ts
│
├── stores/                   — Zustand stores
│   ├── reading-progress.ts   — Progress per book/chapter + UI prefs (fontSize, darkMode, furigana…)
│   ├── flashcards.ts         — Saved words + SM-2 SRS + daily goals
│   ├── saved-grammar.ts      — Saved grammar points (`tsundoku-saved-grammar`)
│   ├── onboarding.ts         — Carousel / reader tutorial flags + admin toggles
│   ├── token-edit.ts         — Admin token editing state
│   ├── user-rules.ts         — Per-user token override rules
│   └── shared-rules.ts       — Shared token rules (admin-published)
│
├── data/
│   ├── books.ts              — Book catalog + types (Book, Chapter, Difficulty, Genre)
│   ├── books/                — Per-book text content (ts files, 3 difficulties each)
│   ├── book-tokens/          — Pre-tokenized token arrays per book (+ word-counts.ts)
│   ├── collections.ts        — Curated library rails (Start Here, Short Reads, author…)
│   ├── book-grammar.ts, book-dictionary.ts (deprecated stub), book-reading-overrides.ts
│   └── dictionary.ts, token-overrides.ts
│
├── lib/
│   ├── utils.ts              — cn() helper (clsx + tailwind-merge)
│   ├── srs.ts                — SM-2 spaced repetition algorithm
│   ├── admin.ts              — useIsAdmin() (RPC `get_is_admin`, cached per session)
│   ├── audio-sync.ts, dictionary-db.ts (IndexedDB shards)
│   ├── jisho.ts, kanji.ts, tatoeba.ts, translate.ts, romaji.ts
│   ├── grammar.ts, grammar-preload.ts (fetch-only grammar cache hydration)
│   ├── known-words.ts, merge-tokens.ts, pos-colors.ts
│   ├── sentence-translations.ts, tokenizer.ts, token-edit-rules.ts
│   └── sync/cloud-sync.ts, sync/sync-status.ts
│
└── integrations/
    ├── lovable/index.ts       — Lovable cloud auth (do not modify)
    └── supabase/client.ts, types.ts

supabase/
├── functions/                 — Deno edge functions (see list below)
│   └── _shared/               — ai-gateway.ts, auth.ts (requireUser JWT guard)
└── migrations/                — SQL migrations (naming: YYYYMMDDHHMMSS_uuid.sql)

public/dict/                   — Pre-built JSON dictionary shards (served statically)
scripts/                       — CLI scripts (tokens, grammar, dict, translations, grammar backfill)
.lovable/
├── plan.md                    — Current implementation plan (archived under plan/ once approved)
└── memory/                    — Lovable project memory files

```

---

## Design system

### Color tokens (HSL CSS variables in `src/index.css`)

**Light mode**
```
--background:         36 33% 97%    warm off-white
--foreground:        210 22% 15%    dark navy
--card:                0  0% 100%   white
--primary:           210 29% 24%    dark navy-blue
--primary-foreground: 36 33% 97%
--secondary:          36 20% 88%   warm beige
--muted:              36 15% 93%   light warm gray
--muted-foreground:  210 10% 50%   medium gray
--accent:             36 76% 40%   amber / golden
--border:             36 15% 88%
--destructive:         0 65% 48%   red
--radius:             0.5rem
```

**Dark mode**
```
--background:        220 15%  8%   very dark navy
--foreground:         36 15% 90%
--primary:            36 50% 65%   light golden
--accent:             36 76% 50%
--secondary:         220 12% 20%
--muted:             220 12% 18%
```

**JLPT level variables**
```
--n5: 168 50% 35%   teal
--n4: 200 55% 42%   sky blue
--n3:  36 60% 45%   amber
--n2:  20 60% 45%   orange
--n1:   0 50% 42%   red
```

### Typography

| Role | Font | Tailwind class |
|---|---|---|
| Body | Inter | default (`font-sans`) |
| Headings h1–h6 | Merriweather | `font-serif` |
| Wordmark | Merriweather 900 | `.wordmark` |
| Japanese sans | Noto Sans JP | `.font-jp-sans` / `.font-japanese` |
| Japanese serif | Noto Serif JP | `.font-jp-serif` |
| Japanese handwriting | Klee One | `.font-jp-hand` |

Reader font sizes (stored in `reading-progress` store):
```ts
small:  'text-lg leading-[2.2]'
medium: 'text-xl leading-[2.4]'
large:  'text-2xl leading-[2.6]'
```

### Border radius
- `rounded-lg` → `var(--radius)` = 0.5rem
- `rounded-md` → `calc(var(--radius) - 2px)`
- `rounded-sm` → `calc(var(--radius) - 4px)`
- `rounded-full` → pills, buttons, badges, avatars

### Animation tokens

```css
--ease-out-soft:    cubic-bezier(0.22, 1, 0.36, 1)   /* spring-like, most common */
--ease-out-snap:    cubic-bezier(0.16, 1, 0.3, 1)    /* snappier */
--ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1)
```

Framer Motion page transition: `{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }` — matches `--ease-out-soft`.

### Custom CSS utility classes (`src/index.css`)

**Layout & elevation**
- `.elev-soft` / `.elev-soft-hover` — layered box shadows
- `.card-refined` — gradient + shadow card
- `.shadow-inner-sm` — inset shadow for inputs
- `.hairline-fade` — decorative fading divider
- `.glass-subtle`, `.glass-chip-subtle`, `.glass-chip-header` — translucent chrome surfaces
- `.btn-tsundoku-premium` — shared premium CTA style (library hero, book detail)
- **Never** add a vertical amber accent bar before labels (the old `.section-bullet` — removed and banned)


**Book / reader**
- `.book-paper` — decorative cover texture (radial gradients + grain)
- `.reader-text` — uniform CJK rendering (letter-spacing, kinsoku)
- `.reader-icon-btn` — reader chrome icon button (36px circle)
- `.reader-settings-panel`, `.reader-settings-section`, `.reader-settings-bullet`
- `.reader-progress-track`, `.reader-progress-fill` — slim gradient progress bar

**Library**
- `.library-header-bg` — subtle radial gradient header
- `.library-kanji-watermark` — decorative large kanji overlay

**Known-word highlights (3 mastery levels)**
- `.known-new` — amber tint (mastery 0)
- `.known-learning` — sky tint (mastery 1–2)
- `.known-known` — emerald tint (mastery 3+)

**Interaction / motion**
- `.tap-scale` — `active: scale(0.965)` for interactive surfaces
- `.tap-scale-sm` — `active: scale(0.92)` for small buttons
- `.card-lift` — hover `translateY(-2px)` + tap `scale(0.985)`
- `.press-flash` — radial gradient ripple on press
- `.smooth-colors` — color/opacity transitions

**Entrance animations**
- `.animate-fade-in-up` — 0.42s spring fade + translateY
- `.animate-fade-in-soft` — 0.3s fade
- `.animate-scale-pop` — 0.28s scale from 0.94
- `.stagger-children` — staggered list entrance (delays up to 8 children)
- `.animate-soft-pulse` — 1.8s soft badge pulse
- `.animate-card-in` / `.animate-card-out` — flashcard slide
- `.animate-mini-slide-up` / `.animate-mini-slide-down` — Reader popup

**Misc**
- `.wordmark` — Merriweather 900, tracking -0.02em
- `.no-scrollbar` — hidden scrollbar
- `.audio-slider` — styled Radix Slider
- `.btn-primary-glow` — inner top highlight on primary buttons
- `.color-dot-new/learning/known` — legend color dots

---

## Code conventions

### Imports
- All internal imports use `@/` alias (never relative `../`)
- `cn()` from `@/lib/utils` for all conditional class merging
- Icons: `lucide-react` exclusively
- Toasts: `sonner` via `toast.success()` / `toast.error()`

### Component patterns
```tsx
// Page (route-level)
export default function MyPage() { ... }

// Feature component
export function MyComponent({ prop }: { prop: string }) { ... }

// Props interface (inline above component)
interface MyComponentProps { ... }
export function MyComponent({ ... }: MyComponentProps) { ... }
```

### Recurring Tailwind patterns

```tsx
// Standard card
"rounded-xl border bg-card p-4 ring-1 ring-border/30 card-lift tap-scale"

// CTA primary pill button
<Button size="lg" className="h-12 w-full rounded-full text-[15px] font-semibold shadow-md">

// Page header (library pattern)
<header className="library-header-bg relative px-6 pt-12 pb-6 overflow-hidden">
  <span className="library-kanji-watermark" aria-hidden>漢</span>
  <h1 className="wordmark font-serif font-bold text-[42px] leading-none">

// Section label (never with an accent bar)
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Label</p>


// Search pill input
className="h-11 rounded-full bg-muted/60 border-transparent pl-11 text-sm shadow-inner-sm
           focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"

// Round header button / back button — ALWAYS include `header-chip` (gives the raised relief).
// Canonical form (Word Detail, Grammar Detail, Legal pages):
<Button variant="ghost" size="icon" aria-label="Back"
  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 shrink-0 header-chip">
  <ArrowLeft className="h-[18px] w-[18px]" />
</Button>
// Fixed-overlay variant (Book Detail) adds:
// "fixed left-5 top-[max(1.25rem,env(safe-area-inset-top))] z-30 ... header-chip"

// Section heading
<h3 className="font-serif text-lg font-semibold text-foreground">

// Counts / tabular numbers
<span className="text-[11px] text-muted-foreground tabular-nums">

// Empty state icon container
"flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20"

// Settings row (inside rounded-2xl card with divide-y)
<div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
  <div className="flex items-center justify-between px-4 py-4">

// Badge pill
"rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300"
```

### State management
- Zustand pattern: `create<T>()(persist((set, get) => ({ ... }), { name: 'key' }))`
- **Storage keys must not be renamed**: `reading-progress`, `yomimasu-flashcards` (legacy)
- Cloud sync: debounced 1500ms via `pushProgress` / `pushFlashcard` / `pushPreferences`
- Dark mode: toggled via `.dark` class on `<html>` (Zustand `darkMode` → `DarkModeSync` effect in `App.tsx`)

### Routing
- `BottomNav` hidden on: `/reader/*`, `/auth`, `/reset-password`, and when `isReviewing` is true
- All non-auth routes wrapped in `<ProtectedRoute>`
- Page transitions: Framer Motion fade with spring easing (see `App.tsx`)

### Data model
```ts
type Difficulty = 'simplified' | 'intermediate' | 'original'
type Genre = 'folk-tales' | 'psychological' | 'surreal' | 'gothic'
          | 'slice-of-life' | 'historical' | 'sci-fi'

interface Book {
  id: string
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  readingTimeMin: number
  content: Record<Difficulty, string>      // single-chapter books
  chapters?: Chapter[]                      // multi-chapter books
  parts?: Record<Difficulty, string[]>      // multi-part books
  anchors?: string[]                        // part titles (same length as parts arrays)
  audio?: Partial<Record<Difficulty, { durationSec: number }>>
}

// Chapter progress key: bookId (single) or `${bookId}__${chapterId}` (multi)
// Default chapterId for single-chapter books: 'main'
// Part chapterId format: 'part-N' (1-indexed)
```

Library rails are built from `src/data/collections.ts` (`Collection { id, title, subtitle?, match(book) }`)
plus one rail per `Genre`. `ContinueHero` shows the most recently read book.

### Supabase edge functions
Located in `supabase/functions/`. Called from `src/lib/` modules:
- `jisho-lookup` — dictionary lookup (result upserted into `dictionary`)
- `kanji-lookup` — kanji details (cached in `kanji_details`)
- `grammar-notes` / `rewrite-grammar-notes` — AI grammar explanations
- `grammar-examples` — grammar structures + examples, cached in `grammar_examples`
- `tatoeba-example` — example sentences + furigana tokens, cached in `example_sentences`
- `backfill-example-tokens` — admin one-off: adds tokens to legacy example rows
- `tts-japanese` — text-to-speech
- `translate-sentence` / `translate-sentences-batch` — sentence translation (`sentence_translations`)
- `generate-audio-sync` — ElevenLabs Scribe timestamps (`book_audio_sync`)
- `delete-account` — account deletion


### New Supabase migrations
File naming: `supabase/migrations/YYYYMMDDHHMMSS_uuid.sql`

---

## Lovable compatibility rules

1. **Never remove** `lovable-tagger` from `vite.config.ts` (dev plugin required by Lovable IDE)
2. **Never modify** `src/integrations/lovable/index.ts`
3. **Never rename** localStorage keys `reading-progress` and `yomimasu-flashcards`
4. **shadcn/ui components** in `src/components/ui/` — add via `shadcn` CLI, don't hand-edit
5. `components.json`: `style: "default"`, `baseColor: "slate"`, `cssVariables: true`
6. `.lovable/plan.md` — update when implementing a planned feature
7. Always use `cn()` for class merging, never string concatenation for conditional classes
8. Match the existing visual language: warm paper palette, Merriweather headings, `tap-scale`/`card-lift` on interactive elements, `rounded-full` pills for primary actions

---

## AI cost & caching (read before touching any AI feature)

Golden rule: **a page view must never trigger an AI generation when a cache row already exists.**
Every AI-backed feature is DB-cached and shared across all users.

| Content | Source | Cache | When AI runs |
|---|---|---|---|
| Word definitions | Jisho via `jisho-lookup` | `dictionary` table → static shards in `public/dict/` → IndexedDB → memory | Never (no AI). Preloaded per book by `scripts/sync-dictionary-to-db.ts` + `DictionaryPreloader` |
| Example sentences + furigana tokens | `tatoeba-example` | `example_sentences` table (merged upsert, never shrinks) | Only for a word never requested before |
| Sentence translations | `translate-sentences-batch` | `sentence_translations` (SHA-256 hash key) | Only for sentences not preloaded by `scripts/preload-translations.ts` |
| Kanji details | `kanji-lookup` | `kanji_details` table | First lookup of a kanji |
| Grammar notes per book | generated offline by `scripts/generate-grammar-for-<id>.ts` | committed in `src/data/book-grammar.ts` | Only at book-authoring time |
| Grammar structures + examples | `grammar-examples` | `grammar_examples` table (unique `pattern_slug`) + localStorage `grammar_cache_<pattern>_<jlpt>` | Only for a pattern missing from the table |
| Book audio sync | `generate-audio-sync` (ElevenLabs Scribe) | `book_audio_sync` + IndexedDB | Once per book + difficulty |

Rules that must stay true:
- `src/lib/grammar-preload.ts` is **fetch-only** — one bulk `select` on `grammar_examples`, never a generation call.
- `GrammarDetail` is **cache-first** — a valid localStorage entry renders immediately with no network call.
- `scripts/preload-grammar-examples.ts` backfills every unique pattern sequentially with exponential backoff; it is resumable and free for already-cached patterns. Re-run it after adding a book (currently ~516 of 622 patterns cached).
- Edge functions that write to a cache table use `SUPABASE_SERVICE_ROLE_KEY` (RLS blocks anon writes — this silently broke the grammar cache once).

---

## Admin features

Admin is server-side only: the `admin_users` table + `is_admin(uuid)` / `get_is_admin()` security-definer
functions. The client reads it through `useIsAdmin()` in `src/lib/admin.ts` (one RPC per session, cached).
Never gate admin UI on an email string or localStorage.

Admin-only surfaces:
- **Settings → Always replay onboarding** (`onboarding.alwaysReplayOnboarding`) — carousel + reader tutorial reappear every time; both components keep a local `dismissed` state so they can still be closed for the session.
- **Settings → Disable app animation** (`onboarding.disableAnimation`) — skips the `SplashScreen`.
- **Token editing** in the Reader (`TokenEditPanel`, `TokenEditFloatingBar`) writing to `user_token_rules` (personal) and `shared_token_rules` (published to everyone).
- **Content overrides** (`book_content_overrides`).

---

## Onboarding

- `OnboardingCarousel` — first launch only, returns `null` on any `/reader/*` route.
- `ReaderTutorial` — dimming overlay (`bg-black/50`) with a spotlight cut-out made by a `box-shadow` on a box positioned from `getBoundingClientRect()`. Steps cover: tap a word, furigana chip, translation chip, grammar notes chip, settings, progress. The word step has an animated amber ring (`.animate-tutorial-pulse`) and is interactive — tapping the word opens the mini popup (which un-dims) but only **Continue** advances the step.
