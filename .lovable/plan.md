# Legal pages: Terms & Privacy Policy

Tsundoku stores accounts and personal data (email, reading progress, flashcards, preferences synced to the cloud), so under EU/GDPR rules it needs a Privacy Policy and Terms of Service that users can reach at any time. The app currently has no `/privacy` or `/terms` route, and the sign-up form links to no legal text.

Scope agreed: minimum viable, English only, publisher = **Tsundoku, Belgium, thetsundokuapp@gmail.com**. Terms will already include subscription/paid-plan clauses since paid plans are planned soon.

## What gets added

**1. Two public pages (no login required)**
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy

Both styled like the rest of the app: sticky header with the round back button, `font-serif` headings, `stagger-children` body, warm paper background. Readable on mobile, no bottom nav.

**2. Links to them**
- Sign-up form (`Auth.tsx`): a small line under the submit button — "By signing up you agree to our Terms and Privacy Policy" — with both words linking out.
- Settings → About section: two rows, "Terms of Service" and "Privacy Policy", matching the existing settings row style.
- `NotFound` and footer areas untouched.

**3. Content of the Privacy Policy** (only facts confirmed from the codebase and from you)
- Who the controller is: Tsundoku, Belgium, thetsundokuapp@gmail.com
- What is collected: email address and authentication data; reading progress, saved words, saved grammar, review history, app preferences; nothing else. No advertising, no tracking, no analytics cookies.
- Why: to provide the account and sync data across devices (contract performance).
- Where it is stored: on the app's managed cloud backend (hosted in the EU region of the platform provider), plus locally in your browser.
- Third parties used to run the service: the backend/hosting provider, and AI/dictionary services used to generate word definitions, example sentences and translations (only the Japanese text of a word or sentence is sent, never your identity).
- Retention: kept until you delete your account; deletion is immediate and permanent.
- Your GDPR rights: access, rectification, erasure, portability, objection, and complaint to the Belgian Data Protection Authority. Contact address given.
- Cookies: only the strictly necessary session/local storage, no consent banner needed. This is stated explicitly.

**4. Content of the Terms**
Eligibility, account responsibility, acceptable use, intellectual property (the literary texts are public-domain Japanese works; app content and code belong to Tsundoku), no warranty / limitation of liability, termination, and a paid-plans section covering billing, renewal, cancellation and the EU 14-day withdrawal right with the standard "waiver on immediate access to digital content" clause. Governed by Belgian law.

A "Last updated" date appears on both pages.

## Technical notes

- New files: `src/pages/Terms.tsx`, `src/pages/Privacy.tsx`, plus a small shared `LegalPage` layout component to avoid duplicating the header/typography.
- New routes in `src/App.tsx`, placed **outside** `ProtectedRoute` so they are reachable from the auth screen and by crawlers.
- `BottomNav` hidden on `/terms` and `/privacy` (same mechanism already used for `/auth`).
- Per-page SEO: `<title>` and meta description set on mount, plus canonical links.
- No database, edge function, or auth-flow change. Account deletion already exists via the `delete-account` function and is referenced by the policy rather than rebuilt.

## Not included (say the word and I add them)

- Cookie consent banner — not required while there is no analytics or advertising.
- Explicit consent checkbox at sign-up, data export (JSON), and a standalone legal-notice page — these belong to the fuller GDPR package you skipped.
- Payment integration itself; the Terms only prepare for it.

## Before publishing

These pages are owner-authored statements, not legal advice. Read them through and confirm the facts about hosting region and third parties match what you want to state publicly.
