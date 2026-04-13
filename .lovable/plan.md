

## Text presentation modes for the Reader

### Idea

Add a "Display Mode" selector in the reader settings with these modes:

1. **Normal** (default) — Current clean, book-like presentation. No color coding.
2. **Grammar Colors** — Color-code each word by its grammatical role using the existing POS data (`token.p`):
   - **Verbs** (動詞) → teal/primary
   - **Nouns** (名詞) → coral/accent  
   - **Adjectives** (形容詞) → purple/secondary
   - **Particles** (助詞) → muted gray with slight opacity
   - **Adverbs** (副詞) → amber/warm
   - **Other** → default text color
   
   A small legend appears at the top of the reading area showing the color mapping.

3. **JLPT Focus** — (future idea, would require JLPT level data per word — skip for now unless you want it)

### Why it works

Every token already carries `p` (part of speech from Kuromoji), e.g. `"動詞/自立"`, `"名詞/固有名詞"`, `"助詞/格助詞"`. We just need to map the first segment to a color class.

### Technical plan

**1. New type and store update (`src/stores/reading-progress.ts`)**
- Add `DisplayMode = 'normal' | 'grammar'` type
- Add `displayMode` state + `setDisplayMode` action (persisted, default `'normal'`)

**2. Color mapping utility (new file `src/lib/pos-colors.ts`)**
- Function `getPosColorClass(pos?: string): string` that maps POS prefix to a Tailwind text color class
- Mapping: 動詞 → `text-teal-600 dark:text-teal-400`, 名詞 → `text-rose-500 dark:text-rose-400`, 形容詞 → `text-violet-500 dark:text-violet-400`, 助詞 → `text-slate-400`, 副詞 → `text-amber-600 dark:text-amber-400`

**3. Reader UI (`src/pages/Reader.tsx`)**
- Add a "Display Mode" toggle in the settings panel (Normal / Grammar Colors)
- When `grammar` mode is active, pass POS to token spans and apply color classes
- Show a compact color legend below the settings or at the top of the article

**4. FuriganaWord (`src/components/FuriganaWord.tsx`)**
- Accept an optional `colorClass` prop and apply it to the rendered text

### Files to create/modify
1. `src/lib/pos-colors.ts` — New: POS-to-color mapping
2. `src/stores/reading-progress.ts` — Add `displayMode` state
3. `src/pages/Reader.tsx` — Display mode toggle + apply colors + legend
4. `src/components/FuriganaWord.tsx` — Accept and apply `colorClass` prop

