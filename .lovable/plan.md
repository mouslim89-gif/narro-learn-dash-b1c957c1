## Goals
1. Close the difficulty popover (`levelOpen`) when the user picks a difficulty inside it.
2. When toggling the "Show translations" header chip, keep the reader anchored on the paragraph/sentence currently at the top of the viewport so the user doesn't lose their place.

## File
`src/pages/Reader.tsx`

## Changes

### 1. Close difficulty popover on selection
The popover buttons (L849-860) currently call `setDifficulty(d)`. Update the click handler to also close the popover:

```tsx
onClick={() => {
  setDifficulty(d);
  setLevelOpen(false);
}}
```

(The in-sheet pills around L929-935 live inside the Reader Settings sheet, which is a different UI — leave them alone unless requested.)

### 2. Anchor reader on top-visible sentence when toggling translations
We already track the top-most visible sentence in `currentSentenceRef` via IntersectionObserver, and `sentenceRefs` maps idx → DOM element. Add a wrapper:

```ts
const toggleTranslations = () => {
  const anchorIdx = currentSentenceRef.current;
  setShowTranslations(!showTranslations);
  if (anchorIdx == null) return;
  // Two rAFs: let React commit + browser lay out the new/removed translation lines.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = sentenceRefs.current.get(anchorIdx);
      if (!el) return;
      const HEADER_OFFSET = 64;
      const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: y, behavior: 'auto' });
    });
  });
};
```

Wire it:
- Header chip (L874): `onClick={() => setShowTranslations(!showTranslations)}` → `onClick={toggleTranslations}`
- Settings sheet switch (L995): `onCheckedChange={setShowTranslations}` → `onCheckedChange={toggleTranslations}`

`behavior: 'auto'` (instant) avoids a jarring smooth-scroll fight after the layout shift.
