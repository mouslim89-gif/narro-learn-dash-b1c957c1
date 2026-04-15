

## Dictionary Page — Cards Redesign + Clear Button

### Changes to `src/pages/Dictionary.tsx`

**Clear search button**
- Import `X` from lucide-react
- Add an `X` button inside the search input container (right side), visible only when query is non-empty
- Clicking it clears the query and focuses the input

**Cards redesign**
- Word + reading on same line: `食べる（たべる）` style, with PlayWordButton inline
- Tag row below: JLPT badge + "Common" green badge when `result.is_common` is true + parts of speech as subtle muted chips
- Save star as a small absolute-positioned icon at top-right of card
- Meanings with slightly larger text and better spacing
- Card gets a subtle left border accent (teal `border-l-4 border-primary` for common words)
- Better padding and section spacing throughout

### Files to modify
| File | Change |
|------|--------|
| `src/pages/Dictionary.tsx` | Cards redesign + clear button |

