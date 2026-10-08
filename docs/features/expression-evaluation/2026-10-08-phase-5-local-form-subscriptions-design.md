# Performance – Phase 5: local form subscriptions

- **Ticket:** ETP-5641 (branch `hotfix/ETP-5641`, PR #955)
- **Status:** Approved (dedicated commit, easy to revert)
- **Date:** 2026-10-08
- **Previous phases:** [3](./2026-10-08-phase-3-open-record-design.md), [4](./2026-10-08-phase-4-selection-settling-design.md)

## 1. Problem

In react-hook-form, `watch(name)` called while rendering re-renders the component that owns `useForm`
(`FormView`), not the caller. `BaseSelector`, `Label` and about fifteen selectors read their own value
that way, and `FormHeader` and `FormFieldsContent` subscribed to the whole form with `watch()`. Each
keystroke in any field re-rendered `FormView`, and because `FormProvider` passes a new value on every
render, every `useFormContext()` consumer re-rendered with it: instrumenting Sales Invoice showed
`FormView`, `FormHeader`, `FormFields` and 34 `BaseSelector`s rendering per keystroke in Description.
The selectors relied on that root re-render to see their new value.

## 2. Design

1. Render-time `watch(name)` becomes `useWatch({ name })` in `BaseSelector`, `Label` and the selectors
   (String, TextLong, Link, Password, Numeric, Quantity, Date, Time, Image, Modal, MultiRecord, Tree,
   Location, AttributeSetInstance, `Select`): each component re-renders only when its own value changes.
2. `watch()` inside a callback (`LocationSelector`) becomes `getValues()`, which reads the same value
   without registering a root subscription.
3. `AttributeSetInstanceSelector` reads the product and attribute set from other fields while rendering,
   so it follows the whole form with `useWatch()`. It is rare, and only it re-renders.
4. `FormHeader` and `FormFieldsContent` use `useDisplayLogicFormValues(fields, extraNames)`
   (`hooks/evaluation/useDisplayLogicFormValues.ts`): a `useWatch` over the fields their display logic
   reads (plus their `$_identifier`, and `_identifier` for the attachments section), returning
   `getValues()` once per change. The values are the whole form, so section visibility is the same as
   with `watch()` for every expression whose dependencies the extractor finds (the same known limit as
   per-field display logic and the toolbar).
5. `collectExpressionDependencies` (`utils/expressions/dependencies.ts`) is shared by this hook and
   `useToolbar`.

## 3. Results

Benchmark at `CPU_THROTTLE=4`, `RUNS=3`, against `perf/results/etp5641-prewatch-cpu4x-…`:

- `type-10-chars`: 52–65% lower in the four windows (about 0.3 s → 0.12 s), blocking time 0.
- `form-next-5`: 4–9% lower; `open-record` lower in three of four windows.
- Grid-only steps (`open-cold`, `reload-warm`, `load-unfiltered`) do not touch the form and moved within
  noise in both directions.

A scripted check on Sales Order confirmed: Next and Previous replace every field's value (the reset path
of `useWatch`), typing shows in the field, and choosing a value in a select shows it.

## 4. Tests

- `hooks/evaluation/__tests__/useDisplayLogicFormValues.test.tsx`: whole values, update on a watched
  field, same object for an unrelated field, extra names, reset.
- Selector tests updated to mock `useWatch`; whole MainUI suite, `tsc`, Biome, data-testid codemod.
