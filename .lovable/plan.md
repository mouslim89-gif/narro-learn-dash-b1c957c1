# Premium upsell card on Home + paywall polish

## 1. Home page upsell card

A new `PremiumUpsellCard` in the same visual family as the existing "Start your first story" card: rounded-3xl card, soft accent gradient wash, icon tile, serif title, one line of copy, `card-lift` + `tap-scale`, tapping it opens `/premium`.

- Placement: right after the first rail (the "Start Here" collection), before the folk tales rail.
- Copy: value only, no prices. Title "Unlock the full library", sub "Every chapter, review mode, grammar notes, translations and audio."
- Visible only when the user is not premium (`usePremium().isPremium === false`) and not while the subscription state is still loading, so it never flashes for paying users.
- Uses accent tokens for the gradient wash and icon tile, no hardcoded colors, no hover-only styling.

## 2. Paywall polish (`/premium`)

Keep the current structure, raise the quality:

- Header block gets a warm gradient wash with a faint kanji watermark (same treatment as the library header) behind the wordmark label and headline.
- Benefits list becomes slightly denser with amber check chips, unchanged wording.
- Plan cards:
  - Yearly shows a `25% OFF` amber pill and a second line "$3.75/mo, save $14.89 a year".
  - Monthly and lifetime show a monthly equivalent or "One payment, forever".
  - Selected card gets a filled accent tint plus a check circle on the right, unselected stays flat, so the choice reads instantly.
- Yearly also carries a "7 days free" line; the CTA label becomes "Start 7 day free trial" when yearly is selected and "Continue" otherwise.
- Small print updated to mention the trial converting to the yearly price unless cancelled.
- CTA, restore link, legal links and IAP availability notice stay as they are.

## Technical notes

- New file `src/components/library/PremiumUpsellCard.tsx`, rendered in `src/pages/Library.tsx` between the first collection rail and the folk tales rail (search results view unchanged).
- Prices stay hardcoded in `src/pages/Premium.tsx` next to the existing `PLANS` array; derived monthly equivalents are added as static strings on each plan object.
- No changes to `entitlements.ts`, `subscription.ts`, `iap.ts` or the edge functions. The trial is display copy only; real trial configuration happens in App Store Connect / Play Console on the product itself.
