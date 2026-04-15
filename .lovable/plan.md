## Conjugation Table in Dictionary + Global Dark Mode

### 1. Conjugation table in Dictionary results

The `ConjugationTable` component already supports both verbs and i-adjectives. It's used in `WordPopup` but not in `Dictionary.tsx`.

**File: `src/pages/Dictionary.tsx**`

- Import `ConjugationTable` from `@/components/ConjugationTable`
- After the example sentence in each result card, add:
  ```tsx
  <ConjugationTable
    dictForm={result.japanese[0]?.word || result.slug}
    partsOfSpeech={result.senses.flatMap(s => s.parts_of_speech)}
  />
  ```
- The component already handles detecting verb type vs i-adjective and returns null for non-conjugable words

### 2. Global Dark Mode

Currently dark mode only exists for the reader (`readerDarkMode`). Add a global toggle.

**File: `src/stores/reading-progress.ts**`

- Add `darkMode: boolean` (default false) and `setDarkMode` action to the store

**File: `src/App.tsx**`

- Read `darkMode` from store, apply `dark` class to `<html>` element via `useEffect`

**File: `src/pages/Library.tsx**`

- Add a dark mode toggle button (Moon/Sun icon) in the header area

### Files to modify

1. `src/pages/Dictionary.tsx` — add ConjugationTable to results
2. `src/stores/reading-progress.ts` — add global darkMode state
3. `src/App.tsx` — apply dark class to html
4. `src/pages/Library.tsx` — add dark mode toggle button