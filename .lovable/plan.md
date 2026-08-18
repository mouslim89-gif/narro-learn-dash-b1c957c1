# Make edited tokens work offline in the native app

## The situation

Shared token rules live in `shared_token_rules` (database) and are fetched by the Reader at runtime (`loadShared()`), then applied on top of the pre-tokenized arrays in `src/data/book-tokens/books/*.ts`. In the standalone APK, if the device is offline, that fetch fails and the reader falls back to the raw tokens, so all your corrections disappear.

An in-app button cannot write to the project's source files (the APK ships a compiled bundle; it has no access to the repo). So "sync rules into the book/token files" has to happen at build time, not from the phone. But we can make the phone side offline-proof too.

## Recommended: two layers

### Layer 1 - Offline cache (works immediately, no rebuild)
Persist the shared rules the app already downloads:
- Add `persist` middleware to `src/stores/shared-rules.ts` (key `shared-token-rules-v1`), storing `saved` + a `fetchedAt` timestamp.
- On Reader mount, rules render instantly from the cache, then refresh in the background when online.
- Result: after one online launch, every book edit stays correct offline. Also removes the current network round-trip before the text renders.
- Same treatment for the user's personal rules (`user_token_rules`) so signed-in users keep their own edits offline.

### Layer 2 - Bake rules into the shipped files (permanent, offline from first launch)
A build-time script, run by me on request ("bake the token rules"):
- `scripts/bake-token-rules.ts` reads all rows from `shared_token_rules`, then for each book applies the rules directly to `src/data/book-tokens/books/<book>.ts` with the existing `applyRules()` logic, rewriting the token arrays in place.
- Rules that were baked are recorded in a manifest (`src/data/book-tokens/baked-rules.json`) so the runtime layer skips re-applying them (idempotent, no double-merge).
- Optionally the script can then delete the baked rows from the database so the two layers never fight.
- After that, the tokens are correct in the bundle itself, even on a fresh offline install.

### The "button" you asked for
Inside the admin token-rules dialog (`TokenEditFloatingBar`), add an **Export rules** action that copies/downloads the full rule set as JSON. That gives you a one-tap way to hand me the exact rules to bake, if you ever want to bake without hitting the database from the script.

## Alternatives considered

- **Rules-only, no baking**: just Layer 1. Simplest, zero build steps, but a brand-new install that never goes online once shows uncorrected tokens.
- **Bake-only**: Layer 2 alone. Perfect offline, but every new edit requires a rebuild + store update before users see it.
- **Ship rules as a static JSON asset** (`public/token-rules.json`, regenerated at build): middle ground, no token-file rewriting, offline from install, but adds a second source of truth to keep in sync.

Layer 1 + Layer 2 gives instant feedback for new edits and a clean, permanent baseline in each release.

## Technical notes

- Files touched: `src/stores/shared-rules.ts`, `src/stores/user-rules.ts` (persist `saved` per user id), `src/pages/Reader.tsx` (skip baked rules via manifest), `src/components/TokenEditFloatingBar.tsx` (export action), new `scripts/bake-token-rules.ts`.
- Baking preserves the existing `BookToken` shape, so nothing downstream (furigana, lookups, known-word highlights) changes.
- Persisting `user_token_rules` locally is scoped by user id and cleared on logout to avoid cross-account leaks.
