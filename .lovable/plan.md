# Cycle — Sync saved grammar points to the cloud

## The gap

Saved words (flashcards), reading progress and preferences all sync to the backend and follow you across devices. Saved grammar points do not: `tsundoku-saved-grammar` lives only in the browser's local storage. Clearing site data or signing in on a phone after saving on a laptop loses every saved grammar point, while the words survive.

## What to build

1. A `saved_grammar` table in the backend, one row per user per grammar point, holding the same fields the app stores today (pattern, notes/meaning, book it came from, saved date).
2. Push on save/remove — saving or unsaving a grammar point writes to the cloud with the same debounced pattern used for flashcards.
3. Pull on login — on sign-in, cloud rows merge with anything saved locally while signed out (union by id, no data loss), then the merged set is written back.
4. Move the saved grammar list into the Cards tab: a Words / Grammar switch at the top of the Flashcards page. Words shows the current list unchanged; Grammar shows the saved grammar points (pattern, meaning, source book) linking to the grammar detail page, with its own empty state. The review CTA, daily goals and stat tiles stay tied to the Words view. The duplicate grammar list in My Books is removed so there is one place for it.


## Technical details

- Migration: `public.saved_grammar` with `user_id uuid`, `item_id text`, jsonb payload for the grammar note fields, `book_id text null`, `saved_at timestamptz`, primary key `(user_id, item_id)`. Followed in the same migration by `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated`, `GRANT ALL ... TO service_role`, `ENABLE ROW LEVEL SECURITY`, and four policies scoped to `auth.uid() = user_id`. No anon grant.
- `src/lib/sync/cloud-sync.ts`: add `pullSavedGrammar`, `pushSavedGrammar`, `deleteSavedGrammar`, mirroring the flashcard helpers and using `useSyncStatus`.
- `src/stores/saved-grammar.ts`: keep the `tsundoku-saved-grammar` key unchanged; call the push/delete helpers from `saveGrammar` / `removeGrammar` when a user is signed in, plus a `mergeFromCloud(items)` action.
- `src/hooks/use-cloud-sync.ts`: pull saved grammar alongside flashcards/progress on login and merge.
- Verify with `tsgo` plus a signed-in check that a save round-trips into the table.

## Remaining gaps after this cycle

- Flashcards page has no grammar review mode (grammar points are browsable but not reviewable in SRS).
- Grammar example preloading is still partial (~516 of 622 patterns cached).
- No offline indicator when a sync push fails.
