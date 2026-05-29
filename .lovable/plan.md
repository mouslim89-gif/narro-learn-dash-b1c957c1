Apply the `split-book-into-parts` skill to three books. None have `parts` or `chapters` today; all three originals are above the 2500-char threshold.

## Scope per book (derived from `original` length, ~1300–1700 chars/part)

| Book | Original chars | Target parts |
|---|---|---|
| hana (鼻 — Akutagawa) | ~17,300 | ~10–12 |
| matsu (松井 — Kajii) | ~6,200 | ~4 |
| sakura (桜の樹の下には — Kajii) | ~5,300 | ~3–4 |

Exact count locked in once I read each `original` end-to-end and find narrative ruptures.

## Per-book pipeline (applied to each of the 3)

1. Read all three difficulty versions; identify narrative ruptures on `original`, cut into 1300–1700-char segments ending only on `。！？」`.
2. Write short, spoiler-free English anchors (Title Case, 2–5 words) for each cut.
3. Align `intermediate` and `simplified` to the same narrative beats — same part count, same anchor order.
4. Self-check: concat byte-identical, equal counts, each part ends on `。！？」`.
5. Rewrite `src/data/books/<id>.ts` with `…SimplifiedParts`, `…IntermediateParts`, `…OriginalParts`, `…Anchors` + back-compat aliases (`<id>Simplified = …Parts.join('\n\n')`).
6. Update entry in `src/data/books.ts`: add `parts` + `anchors`, extend imports, keep `content`.
7. **STOP and confirm anchors with you before grammar generation** (costs API calls — one batch per book).
8. After approval, per book:
   - Copy `scripts/generate-grammar-for-lemon.ts` → `scripts/generate-grammar-for-<id>.ts`, swap identifiers.
   - `npx tsx scripts/generate-grammar-for-<id>.ts` (≈ N parts × 3 difficulties calls).
9. After all three books: `npx tsx scripts/generate-tokens.ts` once (regenerates flat tokens for the new text shape).
10. Verify: Reader `/reader/<id>/<diff>/part-N` renders only that slice; BookDetail lists anchors; grammar panel scopes to `partIdx`.

## Skipped

- Dictionary shard regen (no wording is changed, only segmentation).
- Audio (out of scope per skill).
- `konbini-ningen` (uses `chapters` model, not in this request).

## Execution order

I'll do **sakura → matsu → hana** (shortest to longest) so you can sanity-check the anchor style on the small ones before committing to ~12 anchors on hana. After step 6 for each book, I'll paste the proposed anchors in chat and wait for your go-ahead before running the grammar script.

## Open question

Anchors language: the skill mandates **English Title Case** (e.g. `"The Spider's Thread"`). Confirm that's still what you want for these three Japanese classics — or do you prefer Japanese anchors (e.g. `「桜の樹の下」`)? Default = English per the skill.
