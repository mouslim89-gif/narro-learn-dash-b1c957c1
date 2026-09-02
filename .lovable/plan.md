# Store-ready plan (Google Play + App Store)

Goal: get Tsundoku from "works in preview" to "submittable build with working paid subscriptions", then a polish pass. Adding more books is out of scope here.

Current state: Capacitor 8 is installed and configured standalone (`webDir: dist`, no `server.url`), legal pages (`/terms`, `/privacy`, `/support`, `/credits`, `/account-deletion`) exist, `verify-purchase` edge function + `subscriptions` table + `use-premium` gating exist. What is missing is the actual native side.

---

## Phase 1 — Blockers (nothing ships without these)

### 1. Real in-app purchases
Today `src/lib/iap.ts` talks to `window.Tsundoku.iap`, a bridge that does not exist. In a real build every purchase returns `unavailable`.

- Install a maintained Capacitor IAP plugin (`@capgo/capacitor-purchases` / RevenueCat, or `cordova-plugin-purchase` via Capacitor) and implement `iap.ts` against it instead of the fake `window` bridge. Keep the same `PurchaseOutcome` contract so `Premium.tsx` needs no change.
- Keep server-side verification: purchase -> `verify-purchase` edge function -> `subscriptions` upsert (service role). The client must never write entitlements.
- Add the required secrets: `APPLE_SHARED_SECRET`, Google Play service-account JSON (`GOOGLE_PLAY_SA_JSON`). Without them `verify-purchase` throws `not_configured`.
- Implement **Restore purchases** end to end (Apple requires a visible restore button) and subscription-management deep links (Play/App Store manage URLs).
- Create the three products in both consoles with the exact ids already in code: `tsundoku.premium.monthly`, `tsundoku.premium.yearly`, `tsundoku.premium.lifetime`.
- Test with a Play internal-testing track licence tester and an App Store sandbox account.

### 2. Remove debug/dev backdoors
- `guest-bypass` in `localStorage` (`Auth.tsx` + `ProtectedRoute.tsx`) lets anyone skip login by editing storage — remove it, or gate it behind `import.meta.env.DEV`.
- Audit admin toggles (replay onboarding, disable animation, token editing): they must be invisible unless `useIsAdmin()` returns true, never based on an email string in the client.
- Remove any console noise and dev-only routes from the production build.

### 3. Native projects and assets
- `npx cap add android` / `npx cap add ios` (currently neither folder exists).
- Replace the placeholder `resources/icon.png` and `resources/splash.png` with the real branded artwork, then generate every density with `@capacitor/assets` (already a dependency).
- Set version code/name, app display name, and the `com.tsundoku.app` bundle id in both native projects; create the signing keystore (Android) and the distribution certificate/provisioning profile (iOS).
- Verify safe areas, status bar colour switching in dark mode, back-button behaviour on Android, and that the splash hides reliably (today it hides on a 500 ms timer — make it hide on first paint with a timeout fallback).

### 4. Store compliance
- Privacy policy and terms must be reachable from a public URL, not only inside the app — publish the web build and link `/privacy` and `/terms` from the store listings.
- Fill Apple's Privacy Nutrition Labels and Google's Data Safety form: account email, reading progress, saved words — all tied to identity, no third-party ad tracking.
- Account deletion must be reachable both in-app and from a public web URL (`/account-deletion`) — Apple and Google both require this.
- Age rating, content rating questionnaire, export-compliance answer (HTTPS only = exempt), store screenshots for every required device size, and a short description.
- Paywall must state price, period, auto-renewal and link to terms/privacy on the purchase screen itself.

### 5. Backend hardening
- Run the security scan and resolve every critical finding (RLS on `subscriptions`, `saved_grammar`, `user_token_rules`, `book_content_overrides`; confirm no table is writable by `anon`).
- Confirm every edge function that writes to a cache table uses the service role, and that cached reads work for unauthenticated/offline-degraded cases.
- Set a hard cap or rate limit on the AI-backed functions (`grammar-examples`, `tatoeba-example`, `translate-sentences-batch`) so a single user cannot burn credits.

---

## Phase 2 — Polish before submission

- **Offline resilience**: the app ships all books and the dictionary shards in the bundle, but every network call must degrade gracefully. Add a lightweight offline banner and make grammar/example fetches fail silently to cached data.
- **Error boundaries**: a top-level React error boundary with a "reload" action, so a crash never leaves a white screen in a native shell (a reviewer hitting a white screen = rejection).
- **Cold-start perf**: measure the first paint on a mid-range Android; lazy-load the heaviest routes (Reader, Dictionary) and defer the dictionary preloader until after first interaction.
- **Auth polish**: password reset deep link must work inside the native shell (custom scheme / universal link), and sign-in errors must be readable in English.
- **QA sweep on device**: full pass through library -> book -> reader (all three difficulties, chapters, audio) -> word popup -> flashcards -> grammar -> premium paywall -> settings -> logout, on one Android phone and one iPhone.

---

## Phase 3 — Left to fix / nice to have (post-submission)

- Push notifications for daily reviews (needs `@capacitor/push-notifications` and a scheduler).
- Book download management if audio grows too large to bundle.
- Analytics/crash reporting (Sentry or similar) to see real crashes after launch.
- Onboarding conversion tuning once there are real users.

---

## Technical notes

- IAP is the only true code blocker; everything else is configuration, assets, or console work.
- Nothing in Phase 1 changes the app's visual language or existing behaviour except removing the guest bypass.
- Build command stays `bun run build` then `npx cap sync`, run from a local clone (native builds cannot run in Lovable).
