I will standardize the "Common" chip across the application. Based on the "warm editorial" design system, I will use a consistent appearance for this chip: `bg-primary/10`, `text-primary`, and `ring-1 ring-primary/20` with the `✦` icon.

### Technical Details
- **`src/pages/WordDetail.tsx`**: Already uses the correct classes (`bg-primary/10`, `text-primary`, `ring-1 ring-primary/20`).
- **`src/pages/Dictionary.tsx`**: Already uses the correct classes.
- **`src/components/WordPopup.tsx`**: Currently uses `bg-accent/10`, `text-accent`, `ring-1 ring-accent/20`. I will change it to use `primary` colors to match the others.
- **`src/components/WordMiniPopup.tsx`**: Currently uses `bg-primary/10`, `text-primary/80`, `ring-1 ring-primary/15` and only shows the `✦` icon. I will update it to match the standard style (adding the "Common" text and ensuring color consistency) while keeping its compact size in mind.

### Plan
1.  **Update `src/components/WordPopup.tsx`**: Change the "Common" chip colors from `accent` to `primary`.
2.  **Update `src/components/WordMiniPopup.tsx`**: Update the "Common" chip to include the "Common" text and ensure color consistency with the other components.
