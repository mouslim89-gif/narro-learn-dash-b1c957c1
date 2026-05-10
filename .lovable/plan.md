## Goal

Replace the current "buffer + Copy block" workflow with **persistent rules synced to Lovable Cloud**, applied to the Reader via an explicit **Apply** action. No code patching, no copy-paste.

## UX

In the Reader's edit mode floating bar, the **View rules** dialog becomes a **Manage rules** dialog with two tabs (`book` / `* global`). Each rule row shows its formatted text + a delete (×) button. New rules created via merge / single-token edits land directly in this list as **pending** (badge), and the bar shows:

- `Apply (N)` — primary button. Saves all pending rules to Cloud and reapplies tokens to the Reader. Disabled when N=0.
- `Undo` — same as today, but undoes the last pending rule.
- `Manage` — opens the dialog (replaces "View rules"). From there: delete any saved rule, clear scope, etc.

The `Copy` button is removed.

After Apply, the Reader re-tokenizes immediately so the user sees the result.

## Storage (Lovable Cloud)

New table `user_token_rules`:

- `user_id uuid` (auth.uid)
- `book_id text` — `'*'` for global
- `rule jsonb` — the `Rule` tuple `[match, ...replacements]`
- `position int` — preserves order (rules are order-sensitive: longer/specific first wins, but author order matters too)
- `created_at`, `updated_at`

RLS: user can CRUD only their own rows. Composite index on `(user_id, book_id, position)`.

We store one row per rule (not a JSON blob) so delete/reorder is cheap and conflict-free across devices.

## Sync model

Follow the existing `use-cloud-sync.ts` hybrid pattern:

1. On Reader mount (and on auth change), fetch rules for `book_id IN (currentBookId, '*')`, cache in a Zustand store `useUserRulesStore` (persisted to localStorage as offline fallback).
2. Token pipeline in `Reader.tsx` line 180 changes from:
   ```
   applyTokenOverrides(id, …) → applyRules(bufRules, out)
   ```
   to:
   ```
   applyRules([...hardcoded(id), ...hardcoded('*'), ...userRules(id), ...userRules('*')], cleanRubyTokens(raw))
   ```
   Hardcoded rules in `token-overrides.ts` remain (curated defaults), user rules layer on top.
3. **Pending vs saved**: the Zustand store keeps `saved[]` (mirrors Cloud) and `pending[]` (local only). Reader renders using `saved` only. Clicking **Apply**:
   - `INSERT` pending rows into Supabase in a single batch
   - moves them from `pending` → `saved`
   - triggers Reader re-tokenize (state bump)
4. Delete from Manage dialog → optimistic remove + `DELETE` row.
5. If offline / not logged in, pending rules persist in localStorage; Apply is disabled with a tooltip "Sign in to save rules".

## Files touched

- **NEW** migration: create `user_token_rules` table + RLS.
- **NEW** `src/stores/user-rules.ts` — Zustand store, `loadFromCloud()`, `addPending()`, `applyPending()`, `deleteSaved()`.
- **EDIT** `src/data/token-overrides.ts` — export `applyRules` (already done); no change to hardcoded rules.
- **EDIT** `src/pages/Reader.tsx` — load user rules on mount, include them in the `applyRules` chain, add a `version` dependency so the memo re-runs after Apply.
- **EDIT** `src/components/TokenEditFloatingBar.tsx` — replace `Copy` with `Apply (N)`; rename "View rules" → "Manage"; redesign dialog (list view with delete buttons, pending badges, no `<pre>`/copy block).
- **EDIT** `src/stores/token-edit.ts` — the existing buffer becomes the `pending` source feeding `useUserRulesStore`, OR we deprecate it and move pending into `useUserRulesStore` directly (cleaner — recommended).
- **REMOVE** `formatRulesBlock` usage (keep `formatRule` for displaying single rules in the list).

## Edge cases

- Same rule added twice → unique constraint on `(user_id, book_id, rule)` (using `md5(rule::text)` expression index) to dedupe gracefully; INSERT uses `ON CONFLICT DO NOTHING`.
- Multi-device: a "Refresh" button in the Manage dialog re-pulls from Cloud. Realtime subscription is overkill for this volume; pull-on-mount is enough.
- Rule order: stored `position` = `max(position)+1` at insert time per `(user_id, book_id)`.

## Out of scope

- Sharing rules between users.
- Editing existing rule text in-place (delete + recreate is fine for v1).
- Reordering rules in the UI (positions are append-only for v1).
