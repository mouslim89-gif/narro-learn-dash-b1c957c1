# Remove the kanji watermark and the "Tsundoku Premium" label from the premium cards

## Change

Both premium cards keep their accent gradient wash and border, but lose the two decorative elements:

- The faint 読 kanji watermark in the background.
- The small uppercase "Tsundoku Premium" label above the title.

Cards affected:

1. **Library home upsell card** — now reads just the title "Unlock the full library" plus its one line of copy, with the sparkles tile.
2. **Settings > Subscription card** — now reads just "Plan / Free" with the Upgrade button.

Nothing else changes: same gradient, same border, same layout and spacing.

## Technical detail

- `src/components/library/PremiumUpsellCard.tsx`: remove the `library-kanji-watermark` span and the "Tsundoku Premium" `<p>`.
- `src/pages/Settings.tsx`, Subscription section: remove the `library-kanji-watermark` span and the conditional "Tsundoku Premium" `<p>`; drop the now-unneeded `relative overflow-hidden` wrapper bits only if nothing else depends on them.
