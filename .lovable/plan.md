# Implement audit items F12, F16, F24, U1

Four features from the improvements audit: chapter vocabulary pre-study, listen-only audiobook mode, local notification reminders, and undo on destructive actions.

## 1. F12 — Vocabulary pre-study modal (first chapter access)

- New component `src/components/PreStudyModal.tsx` (Radix Dialog, app styling: paper bg, serif headings, pill buttons, `tap-scale`).
- Trigger: when the Reader opens a book+difficulty the user has **never opened before**, show the modal once (flag stored per `bookId__difficulty` in the `reading-progress` store, synced with existing prefs; never blocks re-entry).
- Content: 10–20 key words for that book+difficulty, selected from the pre-tokenized token arrays (`src/data/book-tokens/books/*.ts`) ranked by frequency × JLPT relevance, definitions read from the local dictionary cache (IndexedDB shards — no AI calls).
- UI: swipeable mini-card per word (word + furigana + short meaning), with "I know it" / "Still learning" buttons; "Still learning" words are offered a one-tap "Add to flashcards". Final screen: "Start reading" CTA.
- Skippable via a "Skip" button; never shown again for that book+difficulty.

## 2. F16 — Listen-only mode (fullscreen player + lockscreen)

- New page `src/pages/ListenMode.tsx` at `/listen/:id/:difficulty` (ProtectedRoute, BottomNav hidden — add to `isDetailRoute` in `App.tsx`).
- Entry points: a "Listen" pill button on `BookDetail` (only when the book has audio for a difficulty) and a headphones icon in the Reader header when audio exists.
- Fullscreen player: large book cover, title/author, play/pause, seek slider, playback speed (reuse `SPEEDS`), ±10s skip, sleep timer (15/30/45 min).
- Reuses the existing audio pipeline (`book_audio_sync` / storage URL resolution from `AudioPlayer`/`audio-sync.ts`) — no new audio infrastructure.
- **Lockscreen controls**: Media Session API (`navigator.mediaSession`) — metadata (title, author, cover artwork) + action handlers (play, pause, seekbackward/forward, seekto). Works in PWA/browser; on native it gives lockscreen controls through the Capacitor webview where supported.
- Playback position is kept in sync with reading progress when the user returns to the Reader (same `sentenceIdx`/time mapping the Reader already uses).

## 3. F24 — Local scheduled notifications

- Add `@capacitor/local-notifications` (native) with a graceful web fallback (Notification API + `setTimeout` re-schedule while app is open; no service worker, no server, zero cost).
- New `src/lib/notifications.ts`: request permission, schedule/cancel a daily "Time for your reviews" notification at a user-chosen hour; body includes the number of due cards when computable at schedule time.
- Settings → new "Notifications" section: toggle + time picker (default 19:00). Stored in the `reading-progress` prefs so it syncs across devices.
- Reschedule on app start and after each review session (so the count stays fresh).

## 4. U1 — Undo on destructive actions

Using `sonner` toasts with an **Undo** action (5s for cards, 8s for account deletion):

- **Flashcards** (`removeWord` in `src/stores/flashcards.ts`): keep a snapshot of the removed word (incl. SRS fields + context); delay the cloud `deleteFlashcard` call by 5s; Undo restores the word locally and cancels the pending delete. Applies everywhere `removeWord` is used (Flashcards list, WordDetail, Dictionary, WordPopup, WordMiniPopup, review).
- **Saved grammar** (`saved-grammar` store): same pattern — snapshot, delayed cloud delete, Undo restores.
- **Account deletion** (`AccountDeletion.tsx`): replace instant execution with a pending state — "Deleting your account… Undo" for 8s, then the `delete-account` function is called. Undo cancels the timer; user stays signed in.

## Technical details

- New files: `PreStudyModal.tsx`, `ListenMode.tsx`, `src/lib/notifications.ts`. Edits: `App.tsx` (route + nav hide), `BookDetail.tsx`, `Reader.tsx` (pre-study trigger + listen entry), `flashcards.ts`, `saved-grammar.ts`, `AccountDeletion.tsx`, `Settings.tsx`, `src/lib/sync/cloud-sync.ts` (prefs field for notification time if needed).
- New dependency: `@capacitor/local-notifications` — after pull, run `npx cap sync`.
- No AI generation added anywhere (pre-study reads only pre-tokenized data + cached dictionary).
- No changes to legacy storage keys; design tokens and existing patterns (pills, serif headings, `tap-scale`) respected.
