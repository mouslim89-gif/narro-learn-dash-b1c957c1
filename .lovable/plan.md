# Tsundoku Premium: subscriptions and paywall

Store purchases only (App Store / Google Play). No web checkout, so this iteration builds everything around a server-owned entitlement that a native IAP receipt will later feed. Everything below works today in the PWA except the actual purchase call, which is stubbed behind a single bridge module.

## Offers

| Plan | Price | Product id |
|---|---|---|
| Monthly | $4.99 | `tsundoku.premium.monthly` |
| Yearly | $44.99 | `tsundoku.premium.yearly` |
| Lifetime | $99.99 | `tsundoku.premium.lifetime` |

Yearly is shown as the recommended option (25 percent saving vs monthly).

## What Premium unlocks

Free users get:
- Chapter 1 of every book (for single chapter books, part 1 only; books with no parts stay fully free since they are the short starter reads)
- Word lookups, furigana, saving words and grammar to the deck
- Dictionary and grammar detail pages

Premium unlocks:
- All chapters and parts of every book
- Review mode (SRS sessions)
- Grammar notes panel in the reader
- Sentence translations in the reader
- Book audio

Suggested additions (say if you want them in or out):
- Deck size cap for free users (for example 50 saved items) so the value of review mode is visible before paying
- Offline / preloaded dictionary shards as a premium perk is a bad idea, it would hurt free UX. Not recommended.

## Screens

**Paywall** (`/premium`, full screen, dismissible)
- Tsundoku wordmark, one line pitch, list of unlocked features with check marks
- Three plan cards in a vertical stack, yearly preselected with a "Best value" amber pill
- Primary pill CTA `Continue`, then small print, `Restore purchases`, links to Terms and Privacy
- Warm paper palette, Merriweather headings, `tap-scale` on the cards, no hover states

**Locked states**
- Book detail: chapters after the first show a lock icon and a muted row; tapping opens the paywall
- Reader: navigating into a locked chapter redirects to the paywall
- Reader chips (grammar, translation, audio): tapping while free opens the paywall
- Cards page: the Review CTA shows a small lock and opens the paywall
- Settings: new `Subscription` section showing current plan, renewal date and `Manage subscription` (deep link to the store) or `Upgrade`

## Technical section

**Database** (`public.subscriptions`, one row per user)
- `user_id uuid primary key references auth.users`, `status text` (`none` | `active` | `grace` | `expired`), `plan text` (`monthly` | `yearly` | `lifetime`), `platform text` (`ios` | `android` | `admin`), `original_transaction_id text`, `expires_at timestamptz` (null for lifetime), `updated_at`
- GRANT SELECT to `authenticated`, GRANT ALL to `service_role`; RLS: users select their own row only. All writes happen through the edge function with the service role, never from the client.
- Helper `public.is_premium(uuid)` security definer returning true for `active`/`grace` and non expired, so future RLS can use it.

**Edge functions**
- `verify-purchase`: takes `{ platform, receipt | purchaseToken, productId }`, validates the caller JWT with `_shared/auth.ts` requireUser, verifies against Apple `verifyReceipt` / Google Play Developer API, upserts the subscription row with the service role. Returns the normalised entitlement. Secrets required later: `APPLE_SHARED_SECRET`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. Until those exist the function returns a clear `not_configured` error, it never grants access on failure.
- `store-webhook`: public endpoint for Apple App Store Server Notifications v2 and Google RTDN, so renewals, cancellations and refunds update the row without the app running.

**Client**
- `src/lib/iap.ts`: thin bridge. Detects a native wrapper (`window.Tsundoku?.iap`) and calls it; in the browser it resolves with `unavailable` and the paywall shows "Purchases are available in the mobile app". This is the only file to touch when the native shell is added.
- `src/stores/subscription.ts`: Zustand store holding the entitlement, hydrated once on login from `subscriptions`, refreshed on app focus, with a realtime subscription on the user row so a store webhook update lands instantly.
- `src/hooks/use-premium.ts`: `{ isPremium, plan, expiresAt, loading, requirePremium(feature) }`. `requirePremium` navigates to `/premium`. Admins (`useIsAdmin`) are always premium so testing is unblocked.
- `src/lib/entitlements.ts`: single source of truth for gating rules, notably `isChapterFree(book, chapterId)` so the free chapter rule lives in one place.
- Gating wired into `BookDetail.tsx`, `Reader.tsx` (chapter guard plus the three chips), `Flashcards.tsx` (review CTA), `Settings.tsx` (subscription section).

**Legal**
- Terms already cover auto renewal and store billing; add the three prices and durations to the billing section.
- No changes needed to Privacy, no new personal data beyond the store transaction id.

**Out of scope for now**: the native wrapper itself, store product configuration in App Store Connect / Play Console, and the Apple/Google credentials.
