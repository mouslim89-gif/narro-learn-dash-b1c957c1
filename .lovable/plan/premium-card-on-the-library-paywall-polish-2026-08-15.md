# Premium card on the library + paywall polish

Two changes, both purely visual, no gating logic touched.

## 1. Premium card on the library home

A new card shown only to non premium users, placed right under the hero (Continue Hero or "Start your first story"), above the first rail. Always visible, no dismiss button.

Look and feel, matched to the existing "Start your first story" card so the page stays coherent:
- Same shape: `rounded-3xl`, `border-border/30`, `bg-card`, `p-5`, `card-lift` + `tap-scale`, no hover styles
- Warm amber wash instead of the book cover tint: subtle `linear-gradient(135deg, accent/12, card 60%)`
- Left icon tile `rounded-2xl bg-accent/12 ring-1 ring-accent/20` with a `Sparkles` (amber) icon
- Title `font-serif text-lg font-bold`: "Unlock every chapter"
- Subtitle: "Full books, review mode, grammar notes, translations and audio"
- Right side: a small amber pill "Save 25%" plus a chevron
- Whole card is a link to `/premium`

Visibility rule: hidden while the entitlement is still loading (avoids a flash), hidden for premium users and for admins, since `usePremium` already treats admins as premium.

## 2. Paywall redesign (`/premium`), editorial premium direction

Same content and same purchase logic, restyled:

- **Header band**: warm paper gradient with a large faded kanji watermark (積, echoing the library header), back chip unchanged.
- **Title block**: small uppercase tracked "Tsundoku Premium" label, then a large Merriweather headline, then the one line pitch. Feature specific headline still applies when arriving from a locked feature.
- **Benefits**: five rows, amber circular check badges, slightly larger type and tighter, more deliberate spacing.
- **Plans**: three cards in a vertical stack, yearly preselected and visually elevated:
  - Yearly card: amber ring, soft amber gradient background, "Best value" pill kept, plus a new bold **SAVE 25%** amber badge in the top right corner of the card
  - Each card shows the price and, for monthly and yearly, an effective per month figure: monthly `$4.99 / month`, yearly `$3.75 / month, billed $44.99 yearly`, lifetime `One payment, yours forever`
  - Selected card shows a filled amber radio dot on the left, unselected shows an empty ring, so the choice reads instantly on mobile
  - `tap-scale` on cards, no hover
- **A savings line** above the plans: "Yearly saves you 25% compared to monthly" so the discount is stated in words as well as on the badge.
- **CTA**: unchanged `.btn-tsundoku-premium` pill, label becomes "Start reading everything", with the selected plan price echoed under it in small print.
- **Below**: Restore purchases, the store billing small print, Terms and Privacy links, all kept.
- Entrance: existing `.animate-fade-in-up` on the header block and staggered plan cards, respecting the admin "disable animation" setting already handled globally.

## Technical section

- New component `src/components/library/PremiumCard.tsx`, rendered in `src/pages/Library.tsx` right after the hero block, guarded by `const { isPremium, loading } = usePremium()`.
- `src/pages/Premium.tsx` restyled in place. The `PLANS` array gains `perMonth` and `save` fields. No change to `handleBuy`, `handleRestore`, `syncPurchases`, `src/lib/iap.ts`, `src/stores/subscription.ts` or `src/lib/entitlements.ts`.
- Only design tokens used, amber via `accent`, no hardcoded colors.
