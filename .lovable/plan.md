# Onboarding: arrows instead of the Continue button

Replace the full-width "Continue" / "Start reading" pill at the bottom of the onboarding carousel with arrow navigation.

## Proposed layout (recommended)

A single bottom row under the copy block:

```text
[ <- ]                                   [ -> ]
 back                                    next
```

- Left: circular back arrow (`ArrowLeft`), 44px, `header-chip` relief style, hidden/disabled on the first slide.
- Right: circular next arrow (`ArrowRight`), 52px, filled with the premium CTA style (`btn-tsundoku-premium`) so it stays the clear primary action.
- On the last slide the right arrow becomes a short "Start reading" pill (arrow alone would not communicate that the onboarding ends), or optionally a check icon.
- Both keep `tap-scale` press feedback; existing swipe gestures and progress bars stay unchanged.

## Variations (pick one)

1. **Split row (recommended)** — back arrow left, next arrow right, edge aligned. Feels native and leaves the stage roomy.
2. **Right cluster** — both arrows grouped bottom-right, back arrow ghost, next arrow filled.
3. **Arrow only** — no back button at all, single filled next arrow bottom-right; back is done by swiping.

## Technical details

- File: `src/components/onboarding/OnboardingCarousel.tsx`.
- Remove the `<button>` currently rendering `isLast ? 'Start reading' : 'Continue'`; render the arrow row in its place, still calling `goTo(index + 1)` / `goTo(index - 1)`.
- Import `ArrowLeft` / `ArrowRight` from `lucide-react`.
- Add `aria-label="Previous"` / `aria-label="Next"` for accessibility.
- No other file changes.
