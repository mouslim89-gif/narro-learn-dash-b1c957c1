I will update the `DrawerContent` component in `src/components/ui/drawer.tsx` to ensure a consistent visual style across all bottom sheets.

### Proposed Changes

#### UI Components

- **`src/components/ui/drawer.tsx`**
    - Replace the existing drag handle (`<div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"/>`) with a more discreet, standard handle.
    - Adjust the handle dimensions to be `h-1.5 w-12` and use a softer `bg-foreground/10` or `bg-muted` color.
    - Change the top corner radius of the drawer from `rounded-t-[10px]` to `rounded-t-[20px]` (or matching the book text card radius, which is typically `3xl` or `20px` in this app's "relief-raised" style).

### Technical Details

- The "relief-raised" cards in this project typically use `rounded-2xl` or `rounded-3xl` depending on the context. I'll use `rounded-t-[24px]` to match the prominent rounded look of the reader's text container.
- I will ensure the handle is centered and has consistent margins.

```text
DrawerContent
├── Handle (Centered, discreet)
└── Children
```

I will verify the changes by checking the visual appearance of the Reader settings and Grammar panels.