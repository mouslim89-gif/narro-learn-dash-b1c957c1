# Settings: highlight the Subscription card and fix the Upgrade button

## Changes (free users only)

1. **Upgrade button** uses the app's shared premium CTA relief (`btn-tsundoku-premium`) like every other primary action: primary navy pill, raised relief, press scale. Same size and position as now.

2. **Subscription card** gets the same treatment as the Premium card on the Library home:
   - accent-tinted gradient wash over the card surface
   - subtle accent border/ring instead of the neutral ring
   - faint kanji watermark (読) in the background
   - a small "Tsundoku Premium" uppercase label above the "Plan / Free" line

For premium users the card stays exactly as it is today (neutral card, Premium pill, Manage subscription row), so the highlight only appears when there is something to upsell.

## Technical detail

Single file: `src/pages/Settings.tsx`, Subscription section.
- Wrap the card classes in `cn(...)` keyed on `!isPremium` to add `border-accent/25`, the inline `linear-gradient(135deg, hsl(var(--accent) / 0.16) 0%, hsl(var(--card)) 62%)` background, `relative overflow-hidden`, and the `library-kanji-watermark` span (same values as `PremiumUpsellCard.tsx`).
- Replace the Upgrade `Link` classes with `rounded-full px-5 py-2.5 text-[13px] font-semibold btn-tsundoku-premium tap-scale-sm`.
No store, routing, or logic changes.
