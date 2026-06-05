## Problem

When the audio sync highlight lands on a sentence, the line wrapping shifts. Cause: in `src/pages/Reader.tsx` (line 1352), the active sentence span gets `bg-primary/10 px-0.5`. The added horizontal padding (`px-0.5` = 2px each side) widens the sentence by 4px, which is enough to push tokens onto the next line in places — so the whole paragraph re-flows when the highlight moves from one sentence to the next.

## Fix

Compensate the padding with an equal negative margin so the box looks the same but takes the exact same horizontal space as the unhighlighted state.

In `Reader.tsx` around line 1352, change:

```
${activeAudio ? 'bg-primary/10 px-0.5' : ''}
```

to:

```
${activeAudio ? 'bg-primary/10 px-0.5 -mx-0.5' : ''}
```

That's a zero-layout-impact highlight — width contribution is `+0px` instead of `+4px`, so the surrounding text keeps its line breaks as the highlight moves between sentences.

### Why not just remove `px-0.5`?

Without any horizontal padding, the tint hugs the glyphs too tightly and looks cramped (especially against neighbouring kanji). Keeping the visual padding but cancelling it with `-mx-0.5` preserves the current look while eliminating the reflow.

### Files touched

- `src/pages/Reader.tsx` — single className change on the sentence wrapper span.
