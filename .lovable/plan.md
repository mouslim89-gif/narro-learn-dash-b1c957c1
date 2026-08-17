# Stop grammar generation when opening a grammar point

## Verified cause

- The database already contains **518 cached grammar-example rows**.
- **505 of those 518 keys use the legacy slug format** with repeated or leading/trailing hyphens, such as `te-form---ある`.
- The grammar index now creates canonical IDs by collapsing and trimming hyphens, such as `te-form-ある`.
- Slug generation is currently inconsistent:
  - the grammar index collapses and trims hyphens;
  - the detail preloader, backfill script, and `grammar-examples` function do not;
  - the recent rename migration targets simplified old keys that do not match the real legacy database keys.
- Therefore, renamed grammar points miss both local and database caches. The function interprets that miss as permission to generate new content immediately.

## Plan

1. **Create one canonical grammar slug function**
   - Use the same lowercase, replacement, repeated-hyphen collapse, and edge trimming rules everywhere.
   - Apply it to the grammar index, local preloader, backfill script, saved grammar IDs, and backend cache lookup.

2. **Repair the existing cache instead of regenerating it**
   - Build a migration from the actual legacy database keys to the current canonical grammar patterns.
   - Preserve existing `examples` and `formations` payloads.
   - Merge collisions safely when multiple legacy labels now represent one canonical point.
   - Update matching saved grammar IDs without deleting a user's existing canonical save.

3. **Remove AI generation from the user click path**
   - Grammar Detail will read local cache first, then the shared database cache.
   - A cache miss will return a clear unavailable state and will not call AI from the app UI.
   - Keep generation exclusively in the explicit admin/backfill process, so opening a page can never spend credits.

4. **Finish and verify the preload**
   - Compare every canonical grammar point in the catalog against the repaired database cache.
   - Generate only genuinely missing points, sequentially, with bounded retry for `429`/`5xx` only.
   - Re-check until every catalog slug has a valid examples/formations payload.

5. **Regression coverage**
   - Test representative unchanged, renamed, Japanese-containing, and punctuation-heavy patterns.
   - Verify that opening each test point performs a cache read only, returns its stored content, and creates no AI Gateway request.

## Technical scope

- Frontend: `src/pages/GrammarDetail.tsx`, `src/lib/grammar.ts`, `src/lib/grammar-preload.ts`
- Backend: `supabase/functions/grammar-examples/index.ts`
- Backfill tooling: `scripts/preload-grammar-examples.ts`
- Database: a corrective cache/save migration based on actual legacy keys
