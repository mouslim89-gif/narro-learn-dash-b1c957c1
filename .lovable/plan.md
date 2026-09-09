# Pre-study: mobile transition and floating action

Turn the pre-study step into a natural first screen of the reading flow instead of an abruptly mounted fullscreen overlay.

## User experience

- **Book Details → Pre-study:** tapping the reading button opens the pre-study screen with a short horizontal forward slide, matching native mobile navigation.
- **Pre-study → Reader:** tapping **Start reading** slides pre-study out to the left while the Reader settles in from the right. The Reader tutorial starts only after this exit finishes.
- **Skip:** the close button uses the same smooth exit into the Reader rather than removing the screen instantly.
- **Bottom action:** keep **Start reading** fixed and easy to reach, but remove the footer panel/background. The button floats directly above the page with safe-area spacing, and the grid receives enough bottom space so its final cards are never hidden.
- Keep the current full-screen scale, 2-column vocabulary grid, selection behavior, and English copy unchanged.

## Implementation

- Update `PreStudyModal` to use Motion/`AnimatePresence` for a direction-aware mobile screen transition:
  - enter from the right with the app's existing soft easing;
  - exit to the left before invoking the final close callback;
  - prevent repeated taps while the exit is running;
  - use reduced/no motion automatically through the existing global Motion configuration.
- Separate “request close” from “finished closing” so the Reader remains blocked until the animation has completed.
- Make the bottom action wrapper fixed, transparent, and safe-area aware; remove any full-width background surface and add matching scroll clearance beneath the card grid.
- Coordinate the Reader phase so its content does not flash before pre-study is ready, and reveal it with a restrained complementary horizontal motion when pre-study ends.
- Keep `ReaderTutorial` gated until the pre-study exit completion, not merely the button tap.
- Preserve the existing one-time `preStudySeen` behavior and all flashcard/Known logic.

## Verification

- Test first-time entry from Book Details at the current mobile viewport.
- Confirm both **Start reading** and close/skip animate cleanly into the Reader.
- Confirm the fixed button has no panel behind it and never covers the final vocabulary cards or device safe area.
- Confirm repeat visits skip pre-study, the tutorial never overlaps it, and reduced/no-animation mode removes the movement cleanly.