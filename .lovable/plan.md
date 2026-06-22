I will propose several icon options for the "Grammar Notes" header chip in the reader, replacing the current "文" character.

### Proposed Icon Options (from Lucide React)

1. **BookMarked** (&nbsp;): Represents a reference book or a specific study point, perfect for grammar rules.
2. **GraduationCap** (&nbsp;): Emphasizes the learning aspect of grammar notes.
3. **ScrollText** (&nbsp;): Suggests a list of rules or a detailed guide, fitting for grammar explanations.
4. **SpellCheck** (&nbsp;): Directly relates to language structure and correctness.
5. **PencilLine** (&nbsp;): Suggests annotations and study notes.

### Technical Details

- Import the chosen icon from `lucide-react` in `src/pages/Reader.tsx`.
- Update the `HeaderChip` component for grammar notes to use the selected icon component with the class `h-5 w-5`.
- Remove the temporary `<span>文</span>` element.

Which of these icons would you prefer for the Grammar Notes ? answer : 1