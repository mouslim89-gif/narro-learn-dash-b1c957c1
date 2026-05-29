## Changes to `src/components/GrammarPanel.tsx`

1. **Wrap long titles instead of truncating**
   - Remove `truncate` on the pattern `<span>` (line 139), replace with `break-words leading-snug` so long patterns wrap onto multiple lines and stay fully readable on mobile.
   - Change the title row container to `items-start` and make the JLPT badge stay aligned top (`mt-0.5`) so the badge doesn't stretch when the title wraps.

2. **Sort notes by JLPT ascending (N5 → N1)**
   - Sort the `notes` array before rendering using order `["N5","N4","N3","N2","N1"]`. Done as a derived `const sortedNotes = [...notes].sort(...)` right before the `.map`, so we don't mutate state and it applies both to pre-baked data and edge-function fallbacks.

No data regeneration, no edge-function changes, no other files touched.