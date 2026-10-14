# Performance – Phase 3: opening a record

- **Ticket:** ETP-5641 (branch `hotfix/ETP-5641`, PR #955)
- **Status:** Approved
- **Date:** 2026-10-08
- **Previous phase:** [Phase 2 design](./2026-10-08-phase-2-render-isolation-design.md)

## 1. Why this phase

After Phase 2, typing cost 0.4–0.6 s per 10 characters on a slow machine (`CPU_THROTTLE=4`), while
opening a record still took 2.0–2.4 s against 0.6–1.0 s in Classic. Replacing the whole-form `watch()`
in `FormHeader` and `FormFieldsContent` alone would not help: about 15 selectors and `BaseSelector` read
their value with `watch(name)`, which re-renders the form root on any change, and the selectors rely on
that root re-render to refresh. That refactor is kept for a dedicated commit (section 5).

## 2. Findings

CPU profile of `open-record` in the four benchmark windows (production build with source maps):

- **8.5% in `getBoundingClientRect`,** all of it from material-react-table's row virtualizer measuring
  every row (`measureElement` ref callback) of the **Header grid while it is hidden behind the form**.
  Instrumenting renders showed that grid (`isVisible=false`) re-rendering 9 times while the record
  opens; each pass re-renders 100 rows, formats their dates and measures them.
- **The session object is replaced on every form initialization** (`mergeSessionAttributes` always
  builds a new object), even when no attribute changed, so every session subscriber re-renders and
  rebuilds its evaluation context.

## 3. Design

1. **`useFrozenWhileHidden(isVisible, value)`** (`hooks/table/useFrozenWhileHidden.ts`): returns `value`
   while visible and the last visible value while hidden. `DynamicTable` passes its
   `<MaterialReactTable>` element through it, so while the grid is hidden React receives the same
   element and skips the whole table subtree. The grid's hooks and effects (data, selection, scroll
   restore) keep running; only the rows stop rendering. The first render after it becomes visible
   renders the current state.
2. **`mergeSessionAttributes` returns the previous session** when the merge yields the same keys, in the
   same order, with `Object.is`-equal values. Key order is part of the check because the evaluation
   context resolves case-insensitive collisions by key order.
3. **`perf/hotspots.mjs` gains `CALLERS=<function>`,** which prints the call stacks into a function
   (used to attribute `getBoundingClientRect`).

## 4. Tests and acceptance

- `hooks/table/__tests__/useFrozenWhileHidden.test.tsx`: follows the value while visible, keeps it while
  hidden, resumes when visible, mounting hidden.
- `utils/hooks/useFormInitialization/__tests__/utils.test.ts`: same session object for a no-op merge,
  new object when a value or the key order changes.
- Whole MainUI suite, `tsc`, Biome, data-testid codemod.
- Benchmark at `CPU_THROTTLE=4`, `RUNS=3`, against
  `perf/results/etp5641-phase2-cpu4x-2026-10-08T11-34-12-456Z.json`: `open-record` lower in every
  window, no step's `settledMs` more than 10% worse.

Result: `open-record` 42–46% lower in the four windows (8.8 s → 4.9 s in total), typing a further
20–27% lower, no step more than 3.4% worse.

## 5. Next (dedicated commit, easy to revert)

Replace render-time `watch(name)` with component-local `useWatch` in `BaseSelector`, `Label` and the
selectors, and the whole-form `watch()` in `FormHeader` and `FormFieldsContent` with subscriptions to
the fields their display logic reads, so a keystroke re-renders only the edited field.
