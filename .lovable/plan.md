# Restore the falling-letter title animation and fix header alignment

## What happened

`src/index.css` was rewritten during the native/scroll work and lost a whole block of custom utility classes. Verified missing right now:

`animated-title`, `animated-title__char`, `no-anim`, `library-header-bg`, `library-kanji-watermark`, `shadow-inner-sm`, `card-refined`, `hairline-fade`, `press-flash`, `smooth-colors`, `stagger-children`, `animate-soft-pulse`, `reader-icon-btn`, `reader-settings-panel/section/bullet`, `btn-primary-glow`, `audio-slider`, `color-dot-new/learning/known`, `elev-soft-hover`.

`AnimatedTitle` still renders `<span class="animated-title__char">` on Library, Dictionary, Flashcards, My Books and Settings, but with no CSS rule the letters just sit there statically. That is exactly the disappeared animation.

## What to do

1. Restore the missing CSS in `src/index.css`:
   - `.animated-title` + `.animated-title__char` with the `title-char-in` keyframe (letters start slightly above with 0 opacity and drop into place, `--ease-out-soft`, `animation-fill-mode: both` so the per-letter `animation-delay` staggering works).
   - `.no-anim` guard so the admin "Disable app animation" toggle kills the letter animation too.
   - Re-add the other utilities listed above so headers, reader chrome, badges and sliders stop rendering unstyled (`library-header-bg` gradient, `library-kanji-watermark`, `shadow-inner-sm`, `press-flash`, `stagger-children`, etc.).
2. Fix vertical centering of the page titles: the headers use `items-center`, but the title uses `leading-none`, which centres the glyph box, not the visual text, so the title reads high against the round settings chip. Switch the animated title to a normal line box (`leading-[1.05]`) and let flex centring do the work, applied consistently on Library, Dictionary, Flashcards and My Books so all mastheads match.

## Scope

Only `src/index.css` plus the title `className` on the four main page headers. No logic changes.
