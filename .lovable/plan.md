
# Lemon — synchronized 3-part split

## Narrative anchors (shared spine across the 3 levels)

| # | Title (English) | Starting event |
|---|---|---|
| **A1** | *Malaise and the lure of decay* | Opening line « えたいの知れない不吉な塊… » |
| **A2** | *Wandering, the fruit shop, the lemon* | After aimless wandering, the narrator stops in front of the 八百卯 fruit stand |
| **A3** | *Maruzen — the book tower and the lemon-bomb* | Approaches/enters Maruzen, joy fades, builds the tower |

All cuts fall on **existing paragraph boundaries** (so each part ends on 。 or 」). No mid-sentence breaks, no furigana splits.

## Exact cuts (paragraphs separated by `\n\n` in the source)

### Original (5015 chars, 30 paragraphs)
- **Part 1** = §1 → §7 (~1578 chars) — ends « 借金取りの亡霊のように私には見えるのだった。 »
- **Part 2** = §8 → §18 (~2058 chars) — starts « ある朝――… », ends « そして私はずかずか入って行った。 »
- **Part 3** = §19 → §30 (~1379 chars) — starts « しかしどうしたことだろう… », ends « 京極を下って行った。 »

(P2 exceeds ~1700 target but the lemon arc is narratively indivisible.)

### Intermediate (2804 chars, 12 paragraphs)
- **Part 1** = §1 → §3 (~812 chars)
- **Part 2** = §4 → §7 (~1205 chars) — starts « 私は、自分がどこを歩いているのか分からなくなるまで… »
- **Part 3** = §8 → §12 (~765 chars) — starts « 私は丸善に入っていった。しかし、どうしたことだろう。… »

### Beginner / simplified (1851 chars, 9 paragraphs)
- **Part 1** = §1 → §2 (~481 chars)
- **Part 2** = §3 → §5 (~620 chars) — starts « 寺町通りや、二条通りを歩きました。… »
- **Part 3** = §6 → §9 (~734 chars) — starts « 「今日は、あの丸善に入ってみよう」と私は思いました。… »

Integrity check: `parts.join("\n\n")` per level reproduces the currently exported string byte-for-byte (titles are metadata, NOT injected in the prose).

## Technical changes

### 1. `src/data/books/lemon.ts`
```ts
export const lemonSimplifiedParts: string[] = [ "...", "...", "..." ];
export const lemonIntermediateParts: string[] = [ ... ];
export const lemonOriginalParts:    string[] = [ ... ];

export const lemonAnchors: string[] = [
  "Malaise and the lure of decay",
  "Wandering, the fruit shop, the lemon",
  "Maruzen — the book tower and the lemon-bomb",
];

// Back-compat aliases — kept until the Reader is migrated
export const lemonSimplified   = lemonSimplifiedParts.join("\n\n");
export const lemonIntermediate = lemonIntermediateParts.join("\n\n");
export const lemonOriginal     = lemonOriginalParts.join("\n\n");
```

### 2. `src/data/books.ts`
Extend `BookContent`, keep back-compat:
```ts
type LevelContent = string | { parts: string[] };
type BookContent = {
  simplified:   LevelContent;
  intermediate: LevelContent;
  original:     LevelContent;
};

// Lemon entry:
content: {
  simplified:   { parts: lemonSimplifiedParts },
  intermediate: { parts: lemonIntermediateParts },
  original:     { parts: lemonOriginalParts },
},
anchors: lemonAnchors,
```

### 3. Tokens — **no change** (decision: keep flat)
The Kuromoji token list per difficulty stays flat. Because `parts.join("\n\n")` is byte-identical to the original string, the existing tokens still align perfectly. Splitting by part will be done at render time later (cumulative char-offset slicing). No regen, no touch to `src/data/book-tokens/books/lemon.ts`.

### 4. Grammar — **segmented by part**
Change the shape of `bookGrammar[bookId][difficulty]` from `GrammarNote[]` to `GrammarNote[][]` (one sub-array per part).

- `src/data/book-grammar.ts`
  - Update the type: `Record<string, Record<string, GrammarNote[][]>>`
  - For Lemon, replace the current flat arrays with 3 sub-arrays (one per part). **In this iteration we just split Lemon's existing flat notes by re-running generation per part** (see step 4b).
  - All other books temporarily wrapped as `[existingArray]` (single-part) so the new type is uniform without regenerating them now. A follow-up will resplit them as they get chaptered.

- 4b. Update `scripts/generate-grammar-for-lemon.ts` to:
  - Import `lemonSimplifiedParts` / `lemonIntermediateParts` / `lemonOriginalParts`.
  - Call the `grammar-notes` edge function once per `(difficulty, partIndex)` (= 9 calls total for Lemon).
  - Write back as `GrammarNote[][]` keyed `lemon → difficulty → [part0Notes, part1Notes, part2Notes]`.
  - Run the script once now to materialize Lemon's per-part notes.

- Any consumer of `bookGrammar[id][diff]` (e.g., `GrammarPanel`) keeps working because the back-compat helper:
  ```ts
  export function getGrammarFlat(bookId: string, diff: string): GrammarNote[] {
    const v = bookGrammar[bookId]?.[diff];
    if (!v) return [];
    return Array.isArray(v[0]) ? (v as GrammarNote[][]).flat() : (v as unknown as GrammarNote[]);
  }
  ```
  And the new chapter-aware helper:
  ```ts
  export function getGrammarForPart(bookId, diff, partIndex): GrammarNote[] {
    const v = bookGrammar[bookId]?.[diff];
    if (!v) return [];
    return Array.isArray(v[0]) ? v[partIndex] ?? [] : (v as unknown as GrammarNote[]);
  }
  ```

### 5. Dictionary — **no change**
The dictionary already lives in Supabase + IndexedDB, hydrated by encountered words. No per-part indexing now.

## Out of scope (intentionally)
- Reader UI (chapter navigation, title rendering, per-part grammar panel filtering)
- Per-part reading progress persistence
- Resplitting tokens / grammar for the other 11 books (will follow as each gets chaptered)
- Dictionary per-part prefetch index
