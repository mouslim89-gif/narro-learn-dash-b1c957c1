# Fix: back of card visible when advancing to the next flashcard

## What happens today

When you answer a card, the review screen does two things at once:

- the card slides out (0.2s) and the next one slides in (0.25s)
- the flip state resets from "back" to "front", but that reset is animated over 0.5s

Because the un-flip is slower than the slide, the new card is already visible on screen while it is still rotating back — so you briefly see the previous card's back face.

## The fix

Reset the flip instantly (no rotation animation) while the card is off screen, then re-enable the flip transition for the user's own taps.

Concretely, in `src/components/FlashcardReview.tsx`:

- add a short-lived `instantReset` state
- in `advance()` and in `handleDeleteCurrent()`, set it to `true` at the same moment `setFlipped(false)` / `setCurrentIdx` happen, and clear it on the next animation frame
- when `instantReset` is true, the inner flip container gets `transition-none` instead of `transition-transform duration-500`

Result: the new card always appears already showing its front, with no flash of the previous back face. The manual tap-to-flip animation stays exactly as it is.

## Notes

No changes to SRS logic, deck handling, or styling.
