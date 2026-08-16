# Onboarding rebuild: premium, on-brand, mobile-first

The current carousel is visually broken and off-brand. It will be rebuilt so every screen looks like a real slice of Tsundoku, with no mention of AI or Premium.

## What is broken today

- The demos animate `rgba(var(--accent-rgb), ...)` but `--accent-rgb` does not exist in `index.css`, so highlights render transparent (Word Tap, Audio).
- The difficulty selector pill slides by a hardcoded `x: currentIdx * 88`, which does not match the real chip widths, so the pill drifts off its label.
- Demos use hardcoded hex colors (`bg-[#2a3c4a]`), raw borders and shadows instead of the app tokens and utility classes.
- Slides are sized for tall phones: the demo area plus the text block overflows on short screens, cutting the CTA. Nothing is scroll-safe and safe-area padding is only applied at the top.
- The grammar slide mentions AI, the flashcard/grammar slides show a "Premium explanations" lock badge.
- The card is a real 3D flip with `perspective` set on the wrong element, so the back face shows through.

## Design direction

One consistent frame for all six screens, matching the app:

```text
 [ progress bars ]                 [ x ]
 -------------------------------------
 |                                   |
 |        DEMO STAGE (fixed          |
 |        aspect, centered,          |
 |        real app components)       |
 |                                   |
 -------------------------------------
   Serif title (font-serif)
   Muted description
   [  Continue  ]  (pill CTA)
```

- Background: `bg-background` with the same soft radial wash used by the library header.
- Titles `font-serif`, descriptions `text-muted-foreground`, section labels small uppercase tracked.
- Demo stage: a single card surface `rounded-3xl bg-card ring-1 ring-border/30 elev-soft`, fixed aspect so height never fights the text block.
- CTA: the app pill button (`rounded-full`, `h-12`, `btn-tsundoku-premium` relief) with `tap-scale`.
- Everything sized off a mobile viewport first; the stage shrinks with `min-h-0` and `flex-1` so the CTA is always visible on small screens, plus bottom safe-area padding.

## The six screens (copy without AI or Premium)

1. Welcome: real book covers using the app's `book-paper` cover treatment fanning into place. "Read real Japanese literature, one story at a time."
2. Tap a word: a real reader line built from the same token/furigana rendering as the reader, tapping opens a mini popup styled exactly like `WordMiniPopup`. "Tap any word for its reading and meaning."
3. Levels: the reader's real segmented control with a sliding pill measured from the actual element, cycling Simplified / Intermediate / Original text. "Same story, three levels."
4. Grammar: a reader-style grammar chip opening a panel that shows the pattern structure and its meaning, styled like `GrammarPanel`. "See how each sentence is built."
5. Audio: reader text with word-by-word highlight synced to a waveform, using the real `AudioPlayer` visual language. "Listen while you read."
6. Remember: a flashcard front/back with the real SRS buttons and a `HalfGauge` daily goal. "Save words and review them at the right time."

## Technical notes

- Rewrite `src/components/onboarding/OnboardingCarousel.tsx` shell (layout, progress bars, safe areas, swipe, CTA). Keep the existing dismissal logic, store flags and the reader/legal route exclusions unchanged.
- Rewrite the six files in `src/components/onboarding/demos/` to use design tokens only (`bg-accent/15`, `text-accent`, `ring-border/40`) and the shared utilities (`elev-soft`, `card-lift`, `tap-scale`, `book-paper`). No `--accent-rgb`, no hex colors, no hover styles.
- Sliding pills use Framer Motion `layoutId`, the same pattern as the review scope selector, instead of hardcoded pixel offsets.
- Card flip: `perspective` on the parent wrapper, `transformStyle: preserve-3d` on the rotating child, `backfaceVisibility: hidden` on both faces.
- All demos stay purely local: no network, no Supabase, no AI calls, no images generated.
- Respect `useReducedMotion`: loops stop, transitions become simple fades.
