# Split 蜘蛛の糸 (kumo-no-ito) into 4 synchronized parts

Split each of the 3 difficulty versions into 4 parts aligned on the same narrative events. Concatenations (joined by `\n\n`) remain byte-identical to current blobs.

## Anchors (English, shown in UI)

1. Buddha lowers the spider's thread into hell
2. Kandata climbs the thread and rests, laughing in triumph
3. Other sinners follow and the thread snaps
4. Buddha watches in sorrow as the lotuses sway

## Cut points (per version)

**Original (kumoOriginal)**
- Part 1: `一` paragraph + 3 paragraphs through `…まっすぐにそれを御下しなさいました。`
- Part 2: `二` paragraph through `…「しめた。しめた。」と笑いました。` (split mid-paragraph 11 right after `しめた。」と笑いました。`)
- Part 3: From `ところがふと気がつきますと…` through `…短く垂れているばかりでございます。`
- Part 4: `三` paragraph + 2 closing paragraphs

**Intermediate (kumoIntermediate)**
- Part 1: `一` + 4 paragraphs (Buddha lowers the thread)
- Part 2: `二` + 3 paragraphs through `…犍陀多はそう思って、また少し元気が出てきました。`
- Part 3: From `ところが、ふと気づくと…` through `…地獄の暗闇の中へ落ちていったのです。`
- Part 4: `三` + 2 closing paragraphs

**Simplified (kumoSimplified)**
- Part 1: `一` + 4 paragraphs (lines 5-9 in current file)
- Part 2: `二` + 3 paragraphs through `…「もう少しで出られるかもしれない」と思いました。`
- Part 3: From `でも、気がつくと…` through `…犍陀多はまた地獄へ落ちていきました。`
- Part 4: `三` + 2 closing paragraphs

Note: Paragraph 11 of the original (the long one) must be split mid-paragraph. To preserve the `…parts.join('\n\n') === blob` invariant, the original blob contains `\n` (single) between consecutive sentences in that long paragraph — I'll verify with a node check; if the existing blob has no `\n\n` at the cut, I'll cut at the nearest `\n\n` boundary instead (rest pivot at end of paragraph 11). Same applies to intermediate/simplified — cuts are already on `\n\n` boundaries there.

## Files

### 1. `src/data/books/kumo-no-ito.ts` (rewrite)
Replace the 3 flat exports with:
```ts
export const kumoSimplifiedParts: string[] = [p1, p2, p3, p4];
export const kumoIntermediateParts: string[] = [p1, p2, p3, p4];
export const kumoOriginalParts: string[] = [p1, p2, p3, p4];
export const kumoAnchors: string[] = [
  "Buddha lowers the spider's thread into hell",
  "Kandata climbs the thread and rests, laughing in triumph",
  "Other sinners follow and the thread snaps",
  "Buddha watches in sorrow as the lotuses sway",
];
export const kumoSimplified = kumoSimplifiedParts.join('\n\n');
export const kumoIntermediate = kumoIntermediateParts.join('\n\n');
export const kumoOriginal = kumoOriginalParts.join('\n\n');
```

### 2. `src/data/books.ts`
- Add `kumoSimplifiedParts, kumoIntermediateParts, kumoOriginalParts, kumoAnchors` to the import.
- Add `parts: {...}` and `anchors: kumoAnchors` to the kumo-no-ito book entry (keep `content`).

### 3. `scripts/generate-grammar-for-kumo.ts` (rewrite)
Copy the lemon script's shape: iterate over `partsByDiff[diff]` and write `GrammarNote[][]` per (book, difficulty) into `src/data/book-grammar.ts`.

## Commands to run
```bash
npx tsx scripts/generate-grammar-for-kumo.ts   # 12 edge fn calls (4 parts × 3 difficulties)
npx tsx scripts/generate-tokens.ts             # regenerate flat tokens
```

Dictionary shard is NOT regenerated (no wording changed).

## Verification
- `kumoSimplifiedParts.join('\n\n') === kumoSimplified` (and same for the other two versions) — checked before writing.
- All 3 arrays have length 4.
- Each part of each version ends on `。｜！｜？｜」`.
- `/reader/kumo-no-ito/original/part-3` renders only the "sinners follow + thread snaps" passage.
- BookDetail lists 4 rows with the anchor labels.
- Grammar panel on part 3 shows only part-3 notes.
