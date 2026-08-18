# Fix: nothing scrolls anymore

## Cause (verified)

`src/index.css` sets `html, body { height: 100%; overflow: hidden }`, and `App.tsx` now scrolls inside a container using `h-full` (`.relative.h-full` → `flex-1 overflow-y-auto`). But there is no rule giving `#root` a height: `src/index.css` contains no `#root` selector at all. So `#root` is `height: auto`, the `h-full` wrapper resolves to 0, the scroll container has no height, and the page cannot scroll while `body` overflow stays hidden.

## Fix

One rule in `src/index.css` (base layer):

```css
#root {
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

That restores the height chain `html → body → #root → app shell → scroll container`, so the internal scroller works again and the overscroll/scrollbar/zoom behaviour from the previous change stays intact.

## Verification

After the change, check in the preview that Library, My Books, Dictionary and Settings scroll, that the collapsing headers still animate (they read the container's `scrollTop`), and that the reader scrolls normally.

## Fallback if headers misbehave

If the internal scroller still causes trouble, the alternative is to revert to body scrolling (`html, body { overflow: auto }`, remove the container) and rely only on `overscroll-behavior: none` plus the Capacitor `scrollEnabled: false` / `overScrollMode: 'never'` settings for the native bounce. Not preferred: it weakens the iOS fix.
