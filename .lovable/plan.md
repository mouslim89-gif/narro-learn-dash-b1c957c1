# Plan - Clean up Word Mini Popup UI

Remove the translation shortcut and simplify the "Common" badge to just an icon in the `WordMiniPopup` component to save space for mobile view.

## Proposed Changes

### Reader Components

#### `src/components/WordMiniPopup.tsx`
- Remove the "Translate sentence" button (`Languages` icon button).
- Modify the "Common" badge:
    - Remove the "Common" text.
    - Keep only the `✦` (or use a dedicated icon if preferred, but keeping the star symbol is requested).
    - Adjust padding to make it a small circular badge.

## Technical Details
- The `onTranslateSentence` prop in `WordMiniPopupProps` will remain for now to avoid breaking parent components, but it won't be rendered.
- The badge style will be updated from `px-1.5 py-0.5` to a more square/circular `w-5 h-5 flex items-center justify-center` style.

## Impact
- Cleaner UI in the mini popup, especially on narrow mobile screens.
- Reduced visual clutter by removing redundant text in the commonality indicator.
