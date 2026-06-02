## Entrance animations in Reader

Add subtle, fast entrance animations that replay on chapter/part change.

### Scope
- **Text paragraphs**: stagger fade-in-up (subtle, ~250ms, translateY ~6px, stagger 30ms, capped at first ~10 paragraphs for perf).
- **Header chrome** (top sticky bar with title/progress): light fade-in on mount, ~200ms.
- **Bottom chapter nav pills** (Prev/Next at end of part): fade-in soft.
- Skip: audio player (already persistent, avoid jitter on chapter change).

### Trigger
- Replay on each chapter/part change, not just initial mount.
- Use a `key` tied to `${id}-${chapterId ?? 'main'}` on the article wrapper so React remounts the children → CSS animations replay naturally.
- Guard: do **not** play entrance animation when we're scroll-restoring to a saved sentence (would feel laggy). Detect via the existing `suppressSaveUntilRef` window or a new `skipEntranceRef` set true when `sentenceIdx` restore is pending; the article still mounts but children get a `no-anim` class.

### Implementation
- Reuse existing utilities from `index.css`: `.animate-fade-in-soft` (header, nav) and `.animate-fade-in-up` (paragraphs).
- Add a small helper class `.reader-stagger > *:nth-child(n)` with `animation-delay` up to ~10 children (300ms total max), `animation-fill-mode: both`. Add it once to `index.css`.
- In `Reader.tsx`:
  - Wrap the paragraphs container with `className={cn('reader-stagger', skipEntrance && 'no-anim')}` and add `key={\`${id}-${chapterId ?? 'main'}\`}`.
  - Add `.animate-fade-in-soft` to the sticky top header and to the bottom Prev/Next nav.
  - `.no-anim > *` → `animation: none`.

### Files
- `src/index.css` — add `.reader-stagger` delays + `.no-anim` override.
- `src/pages/Reader.tsx` — add classes + key, wire `skipEntrance` flag from the existing sentence-restore logic.

### Out of scope
- No Framer Motion (CSS only — lighter, no re-render cost on tokens).
- No animation on individual tokens or furigana.
- No changes to audio player, settings panel, chapter drawer.