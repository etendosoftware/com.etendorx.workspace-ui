# Expression evaluation – Phase 2: stop unrelated re-renders while typing

- **Ticket:** ETP-5641 (branch `hotfix/ETP-5641`, PR #955)
- **Status:** Approved
- **Date:** 2026-10-08
- **Previous phase:** [Phase 1 design](./2026-10-06-phase-1-linear-context-design.md)

## 1. Why the roadmap changed

Phase 1 left the evaluation context at 3.5% of the CPU of typing and 5.8% of opening a record
(benchmark at `CPU_THROTTLE=4`, production build with source maps, `perf/hotspots.mjs`). The layered
context planned for Phase 2 would save little. Typing 10 characters still costs 1.3–1.7 s per window,
and ~69% of it is React, MUI and emotion rendering components that do not depend on the edited field:

| Inclusive CPU while typing (4 windows) | Share |
|---|---|
| `components/Toolbar/Toolbar.tsx`, including `useToolbar` process-button display logic | 7.9% |
| Grid behind the form (`components/Table`, `hooks/table/useColumns.tsx`, date formatting) | 10–15% |
| `Metadata.getCachedWindow` → `CacheStore.get` → `JSON.parse` of the whole window metadata | 5.8% |
| `useEvaluationContext` (`FormHeader`, `FormFieldsContent`) | 2.2% |

## 2. Root cause

`FormView` publishes every changed form value to `TabContext` (ETP-4211, so process-button display
logic reacts before saving):

```ts
formMethods.watch((value, { name }) => setFormValues((prev) => ({ ...prev, [name]: value[name] })));
```

`formValues` is React state inside the `TabContext` value, so **every keystroke changes the context
value and re-renders every `useTabContext()` consumer** (31 files: toolbar, grid, selectors, ...).
Only `useToolbar` reads `formValues`. Instrumenting render causes confirmed it: on each keystroke the
toolbar re-renders because `processButtons` changed (its memo depends on `formValues`) and the grid
re-renders because its parent did.

`Toolbar` also calls `getDefaultImplicitFilter(tab)` on every render, which reads the window metadata
through `Metadata.getCachedWindow`, i.e. `localStorage.getItem` plus `JSON.parse` of 1–3 MB.

## 3. Design

1. **Form values leave the `TabContext` value.** `TabContextProvider` owns a small per-tab store
   (`contexts/tabFormValuesStore.ts`: `get`, `set` with the `SetStateAction` contract, `subscribe`). The
   context exposes the stable store and keeps `setFormValues` (now `store.set`, same signature), so
   `FormView` does not change. Writing a value no longer changes the context value.
2. **Selective subscription.** `useTabFormValues(names)` subscribes with `useSyncExternalStore` and
   returns a new snapshot only when one of `names` changed (or the values were reset to empty);
   otherwise it returns the previous snapshot, so the caller does not re-render.
3. **The toolbar subscribes only to what its buttons read.** `useToolbar` collects the dependencies of
   its process buttons' display logic with `extractDependenciesFromExpression` (the extractor
   `useDisplayLogic` already uses per field), plus each one's `$_identifier` (the context reads it to
   treat a cleared foreign key as empty), and passes them to `useTabFormValues`. Typing in a field no
   button depends on no longer recomputes the buttons.
4. **`Toolbar` memoizes `getDefaultImplicitFilter(tab)` on `tab`,** as `useTableData` already does.

### Behaviour

- Process-button display logic gives the same result as before for every expression whose
  dependencies the extractor finds; it is recomputed when one of those fields changes, when the
  selection or record changes, and when the form values are reset.
- Known limit, shared with per-field display logic: a field an expression reads in a form the extractor
  does not recognise does not trigger a recompute on its own. The values passed are always the latest
  snapshot taken when a dependency last changed.

## 4. Out of scope

- The whole-form `watch()` in `FormHeader` and `FormFieldsContent` (Phase 3).
- A general in-memory cache for `CacheStore.get`: callers may mutate the returned object, so sharing a
  parsed instance needs its own review.

## 5. Tests

- `contexts/__tests__/tabFormValuesStore.test.ts`: `set` with a value and with an updater, `subscribe`
  and unsubscribe, `get` identity.
- `hooks/__tests__/useTabFormValues.test.tsx`: re-renders when a watched name changes, not when an
  unwatched one does, on reset to empty, and picks up values written before a name was watched.
- `hooks/Toolbar/__tests__/useToolbar.formValues.test.tsx`: changing a field a button's display logic
  reads, or only its identifier, re-evaluates the buttons; changing another field does not call the
  context builder.
- Whole MainUI suite and Biome; data-testid codemod leaves no changes.

## 6. Acceptance

Benchmark at `CPU_THROTTLE=4`, `RUNS=3`, compared with
`perf/results/etp5641-phase1-cpu4x-2026-10-06T17-08-36-364Z.json`:

- `type-10-chars` summed over the four windows at least 30% lower.
- No other step's `settledMs` more than 10% worse.
- Instrumented check: typing in Description re-renders neither `Toolbar` nor the grid.
