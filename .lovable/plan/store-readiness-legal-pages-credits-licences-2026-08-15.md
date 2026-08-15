# Store readiness: legal pages, credits, licences

Goal: everything Apple App Review and Google Play require before submission, plus the licence attributions the dictionary data legally obliges us to publish. Publisher is an individual (sole trader), and subscriptions will go through in-app purchases once the Capacitor wrapper ships.

## New public pages

All three sit outside `ProtectedRoute`, share the existing `LegalPage` layout, and hide the bottom nav like `/terms` and `/privacy`.

**1. `/credits` | Credits & licences**
Required by the licences of the data the app ships:

- JMdict / JMnedict (Electronic Dictionary Research and Development Group, CC BY-SA 4.0) for word definitions, via Jisho.
- KANJIDIC2 (EDRDG, CC BY-SA 4.0) for kanji details.
- Tatoeba Project (CC BY 2.0 FR) for example sentences.
- Aozora Bunko for the public-domain Japanese literary texts.
- Open-source components: Kuromoji tokeniser, Wanakana, React, and the fonts (Merriweather, Inter, Noto Sans/Serif JP, Klee One with their SIL OFL notice).
Each entry: name, what it is used for, licence name, link to the licence and to the source.

**2. `/support` | Support & contact**
Both stores want a reachable support URL. Contains: contact email, expected reply time, how to report a bug or a wrong definition, and a link to the two legal pages.

**3. `/account-deletion**`
Google Play requires a public web page, reachable without installing the app, that explains how to delete the account and what data is deleted or kept. Text only, pointing at Settings > Delete account for signed-in users and at the contact email otherwise. Lists exactly what is erased (account, progress, flashcards, saved grammar, preferences) and what is retained (billing records, for the legal accounting period).

**4. Legal notice**
Added as a section at the top of `/terms` rather than a fourth page: trading name Tsundoku, full name of the individual publisher, country, business/VAT number, contact email. The plan ships these as clearly marked placeholders you fill in before submission, since I do not have those details.

## Changes to the existing pages

**Terms**

- Legal notice block (above).
- Apple-mandated clauses, required whenever an app is sold on the App Store: the terms are between you and Tsundoku and not with Apple; Apple has no obligation to provide support or maintenance; Apple is a third-party beneficiary entitled to enforce the terms; the publisher, not Apple, handles product claims, warranty and intellectual-property claims; export-control and US-embargo compliance statement.
- Rewritten subscription section to cover in-app purchases: purchases made inside the mobile app are billed by Apple or Google, renew automatically unless cancelled at least 24 hours before the period ends, are managed and cancelled from the store account settings, and refunds for those purchases are handled by the store under its own policy. Web purchases keep the current wording, including the EU 14-day withdrawal clause.
- Auto-renew disclosure required by Apple: subscription title, duration, price per period, and that payment is charged to the store account on confirmation.
- Age requirement kept at 16 so it stays consistent with the age rating declared in both stores.

**Privacy**

- A short table mapping the collected data to the categories used by Apple's privacy nutrition label and Google's Data safety form (identifiers: email; app activity: reading and review history; purchases: subscription status), stating for each that it is linked to the user, not used for tracking, and not shared with third parties for advertising.
- Explicit statement that no data is used for tracking across apps or websites, which is the answer both forms need.
- Link to `/account-deletion`.

## Where they are linked

Settings > About gains three rows: Credits & licences, Support, Account deletion. Terms and Privacy rows stay. The legal footer already under the sign-up form gains a Credits link. Every page keeps the round `header-chip` back button and the app's serif headings.

## Technical notes

- New files: `src/pages/Credits.tsx`, `src/pages/Support.tsx`, `src/pages/AccountDeletion.tsx`; edits to `src/pages/Terms.tsx`, `src/pages/Privacy.tsx`, `src/pages/Settings.tsx`, `src/pages/Auth.tsx`, `src/App.tsx` (routes plus the legal-route list that hides the nav).
- No database, edge function, or payment change. No em dashes anywhere in the copy.
- Content only reuses facts already confirmed in the app; anything about your legal identity is a marked placeholder.

## Still on you before submitting

Fill in the legal-identity placeholders and the subscription price and period, then set the same Privacy, Support and Account-deletion URLs in App Store Connect and the Play Console, and answer the Data safety form to match the table in the Privacy page.

The name is : Mavsarov M.

Email is [thetsundokuapp@gmail.com](mailto:thetsundokuapp@gmail.com) 

Country Belgium 