## Make Reader animations match the app menu + add Book→Reader transition

### 1. Stronger entrance animations in the Reader
- Replace the subtle `.reader-stagger` (28ms, 6px) with the same feel as the rest of the app:
  - Reuse `.stagger-children` (which uses `fade-in-up`: 0.42s, 8px translateY, `--ease-out-soft`) on the paragraphs container.
  - Header chrome + bottom chapter nav: keep `animate-fade-in-soft` but bump to match (0.42s) for consistency.
- Apply on **every** chapter/part change via the existing `key={\`${id}-${chapterId}\`}` (already in place).

### 2. Also play on scroll-restoring
- Remove the `skipEntrance` guard. Animations always play, even when resuming at a saved sentence.
- Scroll restoration runs after layout — paragraphs animate from `translateY(8px)` to `0` while the browser scrolls to the target. Since animation is short (~0.42s) and `animation-fill-mode: both`, the target paragraph ends in its final position; no visual jump.
- Delete `.no-anim` / `skipEntrance` logic from `Reader.tsx` and the `.no-anim` rule from `index.css` (no longer needed).

### 3. Transition Book → Reader (and back)
Currently `App.tsx` wraps routes in `AnimatePresence` with an opacity-only fade (0.28s). The Reader feels instant because:
- It re-uses the same opacity transition as every other page.
- The page itself mounts without any distinct entrance.

Two complementary changes:

**a. Page-level transition for Reader route**
- In `App.tsx`, detect when navigating into `/reader/*` from `/book/*` (or any non-reader route) and use a slightly richer transition for the Reader page: fade + small `translateY(12px) → 0` over 0.32s with `--ease-out-soft`. Implementation: use `motion.div` `variants` that read a `data-route-kind` (reader vs other) — simplest is to override `pageVariants` when `location.pathname.startsWith('/reader/')`.
- Keep current fade for all other route changes.

**b. Inner Reader mount animation**
- The Reader's outer container gets `animate-fade-in-up` once on mount (in addition to the per-chapter stagger inside).
- This gives the "the reader opens" feel even before the paragraph stagger kicks in.

### Files
- `src/index.css` — drop `.reader-stagger`/`.no-anim` blocks (or keep `.reader-stagger` as an alias to `.stagger-children`). Cleaner: remove and use `.stagger-children` directly.
- `src/pages/Reader.tsx`:
  - Replace `'reader-stagger'` with `'stagger-children'` on the paragraphs container.
  - Remove `skipEntrance` memo + `no-anim` class.
  - Add `animate-fade-in-up` on the Reader's outer wrapper (mount-once).
  - Keep existing `animate-fade-in-soft` on header + bottom nav.
- `src/App.tsx` — branch `pageVariants`/`pageTransition` when route is `/reader/*` to add translateY and a slightly longer duration (0.32s).

### Out of scope
- No changes to audio player, settings panel, chapter drawer, or token rendering.
- No Framer Motion inside the Reader (CSS stagger is enough and avoids re-render cost).
- No changes to other page transitions.
