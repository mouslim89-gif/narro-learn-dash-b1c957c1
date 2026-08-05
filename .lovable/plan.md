# Reader tutorial fixes

## 1. Tapping a word does nothing
The tutorial's full-screen container (`fixed inset-0 z-[110]`) sits above the reader and captures every tap, even though it has no background. The blocking layers inside it were meant to be the only clickable parts, but the parent itself already swallows the tap on the highlighted word.

Fix: make the root container `pointer-events-none` and keep `pointer-events-auto` only on the blocking layers and the tooltip card.

## 2. Bring back the Continue button on step 1
The first step ("Tap a word") becomes a normal step:
- Always render the Continue button, including the interactive step.
- Keep the animated amber pulsing ring on the word so it still invites a tap.
- Keep auto-advance if the user does tap a word (popup opens), and drop the delayed "Skip" fallback since Continue is always available.

## 3. General app onboarding must not open in the reader
`OnboardingCarousel` renders globally from `App.tsx`. It will read the current route and return null on `/reader/*`, so only the reader tutorial shows there. The carousel reappears normally elsewhere.

## Files
- `src/components/onboarding/ReaderTutorial.tsx`
- `src/components/onboarding/OnboardingCarousel.tsx`
