# Plan - Refine Grammar Formation Highlighting

The current logic for highlighting grammar formations in `GrammarDetail.tsx` relies on a simple regex check for Japanese characters (`[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]`). While effective for many cases, it incorrectly highlights grammatical categories that happen to include Japanese labels (e.g., "Volitional form" generated as "意向形" or mixed terms) or fails when categories are purely English but intended to be muted. The user wants to ensure grammatical categories remain muted (gray) and literal Japanese pattern parts are highlighted (amber).

## Proposed Changes

### Logic Improvements
- Refine the detection logic in `GrammarDetail.tsx` to better distinguish between literal Japanese patterns and grammatical descriptions.
- Instead of just checking for "any Japanese character", I will check if the part is one of a set of known grammatical placeholders (e.g., "Verb", "Noun", "Plain form", etc.) or if it matches common description patterns.
- I will also add a fallback to check for purely Japanese strings (literal particles/suffixes) to be highlighted.

### Implementation Details
- Update the condition in `GrammarDetail.tsx` (around line 241) to use a more robust helper function for determining the highlight style.
- This helper will prioritize muting common grammatical terms (in both English and common Japanese terminology used by the AI) and highlighting literal strings that are likely the target pattern parts.

## Technical Details

### `src/pages/GrammarDetail.tsx`
- Replace the inline regex check with a logic that:
    1. Checks for a list of common grammatical terms (e.g., "Verb", "Noun", "i-Adjective", "na-Adjective", "Dictionary form", "Masu stem", "Volitional", "Plain", "Te-form").
    2. Checks for terms containing "form", "stem", "base", "clause".
    3. Highlights parts that are entirely Japanese (no Latin characters) AND are not specifically in a "blacklist" of Japanese grammatical terms (like 意向形, 辞書形).
