## Goal
1. Update the `split-book-into-parts` skill so anchors are short, evocative chapter titles — not narrative summaries that spoil the part.
2. Rewrite the existing anchors in `lemon`, `kumo-no-ito`, `asa`, `hashire-merosu` to follow the new rule.

## 1. Skill update (`.workspace/skills/split-book-into-parts/SKILL.md`)
In "Step B — Name each boundary (anchor)", replace the current guidance with:

> For every cut, write a short **English chapter title** (2–5 words, max ~40 chars). Treat it like a book's table-of-contents entry: evocative, not a summary. **No spoilers** — do not name the event that happens, name the setting, mood, or object that opens the part. Avoid verbs that reveal outcomes ("snaps", "dies", "wins", "escapes"). Title Case.
>
> Bad (spoiler): `"Other sinners follow and the thread snaps"`
> Good: `"The Spider's Thread"`
> Bad: `"Melos confronts the king and pledges Selinuntius as hostage"`
> Good: `"The Tyrant's Court"`

Also add to the "Self-check" list: each anchor is ≤ ~40 chars and does not reveal the part's outcome.

## 2. Rewrite existing anchors

Proposed new titles (Title Case, spoiler-free):

**lemon** (`src/data/books/lemon.ts`):
1. "Malaise and Decay"
2. "The Fruit Shop"
3. "Maruzen"

**kumo-no-ito** (`src/data/books/kumo-no-ito.ts`):
1. "The Lotus Pond"
2. "Kandata's Ascent"
3. "The Spider's Thread"
4. "Paradise at Dawn"

**asa** (`src/data/books/asa.ts`):
1. "The Secret Workroom"
2. "A Drunken Night"

**hashire-merosu** (`src/data/books/hashire-merosu.ts`):
1. "Arrival in Syracuse"
2. "The Tyrant's Court"
3. "The Wedding"
4. "The Flooded River"
5. "The Final Sprint"
6. "Dawn at the Cross"

These touch only the `<id>Anchors` arrays — no other code, no grammar/token regeneration needed (anchors are pure display strings).

## Question
The proposed titles above are my best read of each book — confirm or suggest tweaks for any you'd like worded differently before I edit?
