# Fix the spacing regression + keep the page title fixed

## What's wrong

The pull-to-stretch effect was built by rewriting the vertical spacing of every block on the page. That rule is stronger than the app's own spacing, so at rest — when nothing is being pulled — it sets the spacing to zero. Result: all the blocks are glued together, on every page (the screenshot shows it on Cards).

It also pushes the page title down while pulling, which you don't want.

## The fix

Stop touching spacing entirely. Instead, while pulling, each block is *shifted* down a little more than the one above it, so the page visibly breathes apart, and everything returns exactly to its normal position on release.

```text
at rest            during pull
[ title ]          [ title ]        <- never moves
[ block 1 ]        [ block 1 ]  +1
[ block 2 ]          [ block 2 ]  +2
[ block 3 ]            [ block 3 ]  +3
```

Because nothing overrides the app's own spacing anymore, every page goes back to its normal, correct layout.

## Rules

- The page title/header stays perfectly still during the pull, and no gap opens above the first block.
- Blocks below the header shift progressively (first small, then increasing), up to roughly one extra gap at full pull.
- Rows inside lists and grids (chapters, saved words, grammar, bookshelves, dictionary results, pre-study grid) shift the same way, with a smaller step.
- Follows the finger 1:1 while pulling, eases back with the app's standard soft easing on release.
- Reader, review deck and fixed overlays (bottom bar, popups) are untouched.
- Disabled by "Disable app animation" and by reduced-motion.

## Technical details

- `src/index.css`: delete the current `padding-top` / `margin-top` stretch rules (they lose the specificity battle against Tailwind's `mt-*` / `space-y-*` and zero them out). Replace with the `translate` property (not `transform`, to avoid clashing with Tailwind transforms and Framer Motion):
  - `[data-stretch-root] > * > :nth-child(k) { translate: 0 calc(var(--stretch,0) * var(--stretch-step) * k) }` generated for k = 1..16, with `header` excluded and not counted as a shifting block.
  - Same pattern inside `[data-stretch-list]` with a smaller `--stretch-step`; the 2-column pre-study grid steps per row.
  - `html.stretching` disables the transition; otherwise `translate` transitions with `--ease-out-soft`.
  - `[data-no-stretch]`, its descendants, and elements inside fixed overlays are excluded.
- `src/components/StretchProvider.tsx` keeps its current behaviour (window-level touch tracking, nearest inner scroller, `--stretch` 0→1 over 220px, reset on release).
- Verification: check on Cards, Library, My Books, Dictionary, Book detail and Pre-study that at rest the spacing is identical to before the feature, and with a simulated pull that blocks separate while the header stays at y = 0. Then typecheck + build.
