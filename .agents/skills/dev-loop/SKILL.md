---
name: dev-loop
description: Autonomous development loop for Tsundoku. Reads the codebase, identifies what's done vs missing, picks the next most useful feature, implements it, then summarizes progress. Designed to be invoked repeatedly to advance the app incrementally without human-driven feature selection.
---

# dev-loop

Autonomous incremental development cycle. One invocation = one meaningful feature shipped + a status summary. Repeatable indefinitely.

## When to trigger

- User says "dev-loop", "/dev-loop", "lance un dev-loop", "fais avancer l'app", "continue le dev", or similar open-ended "make progress" requests.
- Do NOT trigger when the user gives a specific task — execute that task directly instead.

## The loop (always in this order)

### 1. Read state
- Read `.lovable/plan.md` if present (current roadmap / in-flight work).
- Read `mem://index.md` and any memory file relevant to features/structure.
- Scan `src/pages/`, `src/components/`, `src/stores/`, `src/lib/` headers to map what exists.
- Check recent git-tracked changes via file mtimes in `src/` (use `ls -lt` on relevant dirs) to know what was just touched — don't redo it.

### 2. Identify gaps
Build a mental list of candidates from these sources, in priority order:
1. **Bugs visible in console logs / runtime errors** (use `code--read_runtime_errors`, `code--read_console_logs`).
2. **TODO / FIXME / XXX comments** in `src/` (use `rg -n "TODO|FIXME|XXX" src/`).
3. **Half-built features**: components imported but unused, routes defined without UI, stores with unused actions, Supabase tables without UI.
4. **Missing core UX**: empty states, loading states, error states, missing keyboard/touch affordances.
5. **Polish gaps**: animations missing on new surfaces, inconsistent spacing/typography vs the design system in project knowledge.
6. **Roadmap items** from `.lovable/plan.md` not yet implemented.

### 3. Pick ONE next feature
Selection rules:
- **Smallest useful unit**: must be shippable in one cycle (one or two files ideally, max ~5).
- **High user value / low risk**: prefer bugs > missing core UX > polish > new features.
- **Self-contained**: no half-finished cross-cutting refactors.
- **Respect Tsundoku conventions**: mobile-first, warm paper palette, Merriweather headings, `tap-scale`/`card-lift`, `rounded-full` pills, NO HOVER states, English UI, never rename `reading-progress` / `yomimasu-flashcards` storage keys.
- If multiple candidates tie, pick the one closest to what the user was last working on (visible in recent file mtimes or last chat turn).

### 4. Implement
- Read all target files in parallel before editing.
- Make the change. Keep it tight — no scope creep, no drive-by refactors of unrelated code.
- Preload dictionary/grammar for any new book content added.
- Use design tokens, never hardcoded colors.
- If touching a Supabase table, ensure GRANTs + RLS per project rules.

### 5. Verify
- Run `tsgo` to confirm no type errors.
- If the change is UI-visible and non-trivial, drive Playwright per the browser-use guidance to screenshot the result.
- Check console logs for new errors.

### 6. Summarize (the final chat message)
Output format — strict, short:

```
**Cycle N — <feature title>**

✅ Done this cycle:
- <one-line description of what shipped>
- <files touched, e.g. `src/pages/Foo.tsx`>

📋 Remaining gaps (top 3-5):
- <gap 1, one line>
- <gap 2, one line>
- <gap 3, one line>

▶️ Next cycle would tackle: <one-line preview>
```

Keep the summary under 12 lines. No marketing fluff.

## Hard rules

- **One feature per cycle.** Never bundle multiple unrelated changes.
- **Never re-pick something already done** — check recent edits first.
- **Never invent features the user has rejected** — check `mem://` constraints.
- **Stop and ask** only if every candidate is ambiguous or risky. Otherwise execute.
- **Do not modify** `src/integrations/lovable/index.ts`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, or `lovable-tagger` in `vite.config.ts`.
- **Reader and flashcard review UIs** are excluded from app-wide uniformity passes — don't touch them in polish cycles unless the gap is in those screens themselves.

## Anti-patterns to avoid

- Writing a plan instead of shipping code (this skill ships; if planning is needed, the user will say "plan").
- Refactoring "while I'm here" — never.
- Picking the same kind of polish task every cycle (rotate: bug → UX → polish → new feature).
- Long preambles in the chat — the summary block IS the response.
