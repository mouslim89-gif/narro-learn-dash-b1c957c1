# Plan - Fix Onboarding Visibility

The user reported that the last 3 pages of the onboarding show nothing. After investigation, the components (`GrammarDemo`, `AudioDemo`, `FlashcardDemo`) are present but their internal animation logic or layout constraints within the new `OnboardingCarousel` "Stage" container (`rounded-3xl bg-card`) might be causing visibility issues during transitions or on specific devices.

## Proposed Changes

### Onboarding Demos
- **GrammarDemo**: Simplify the animation logic. Remove the `setTimeout` dependency for initial visibility to ensure it renders immediately when `active` is true.
- **AudioDemo**: Ensure the waveform animation starts reliably and the layout fills the container appropriately.
- **FlashcardDemo**: Check the 3D perspective and ensure the card and `HalfGauge` are correctly sized for the stage.
- **OnboardingCarousel**: Ensure `AnimatePresence` doesn't leave the stage empty during slide transitions.

### Verification
- Run a fresh Playwright check to capture screenshots of all slides in a mobile viewport.

## Technical details
- The `Stage` container in `OnboardingCarousel.tsx` is an `absolute inset-0` div inside a relative parent.
- Some demos might be relying on height/width properties that don't play well with the new container.
- I will harmonize the `active` prop usage to ensure all demos mount their interactive elements immediately.
