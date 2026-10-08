# Expression evaluation – Phase 1: linear context builder and single API

- **Ticket:** ETP-5641 (branch `hotfix/ETP-5641`)
- **Status:** Draft for review
- **Date:** 2026-10-06
- **Scope of this document:** Phase 1 of 3. Phases 2 and 3 are described as a roadmap only.

## 1. Problem

Opening and editing records in the new UI is CPU-bound in the browser. Measured with the benchmark in
`playwright-tests/perf/` at `CPU_THROTTLE=4` (Chrome CPU slowed 4x, a mid/low-end machine):

| Step | Sales Invoice | Sales Order | Purchase Order | Goods Shipment |
|---|---|---|---|---|
| Open record | 47.9 s | 9.5 s | 8.3 s | 5.2 s |
| Type 10 characters | 101.2 s | — | — | 5.4 s |

Etendo Classic opens the same records in 0.6–1.0 s on the same throttled machine.

CPU profiles of 24 benchmark steps, mapped to source with production source maps, attribute **85.3% of
all CPU** to `packages/MainUI/utils/expressions.ts` (`createEvaluationContext`, exported as
`createSmartContext`). Three causes multiply each other:

1. **The build is quadratic.** For every record value, the function walks every key already in the
   context (`Object.keys(evalContext).forEach`) to apply a case- and underscore-insensitive overwrite.
   With a real session (469 attributes) and an invoice record (182 properties, plus their generated
   SNAKE_CASE keys) one call costs ~13 ms.
2. **It is rebuilt inside loops with identical inputs.** `FormHeader` and `FormFieldsContent` build one
   context per field while deciding which sections are visible; `useToolbar` builds one per process
   button and per selected record; `useFormValidation` builds one per required field.
3. **Every keystroke re-evaluates everything,** because `FormHeader` and `FormFieldsContent` subscribe
   to the whole form with `watch()`. (Out of scope for Phase 1; see Phase 3.)

The proxy returned by the function adds a smaller cost: every property read that is not an exact key
(`resolveProperty`, the `has` trap) scans all keys again.

| Caller (inclusive CPU, 24 steps at 4x) | Share |
|---|---|
| `components/Form/FormView/FormHeader.tsx` | 31.5% |
| `components/Form/FormView/FormFieldsContent.tsx` | 27.3% |
| `hooks/Toolbar/useToolbar.ts` | 18.6% |
| `BaseSelector` / `useDisplayLogic` (per-field display and read-only logic) | 4.5% |
| `hooks/useFormValidation.ts` | 3.3% |

## 2. Roadmap (three phases, one branch)

The target is a form-level expression evaluation module that, like Classic, only re-evaluates what a
change affects. It is delivered in three phases on `hotfix/ETP-5641`, each in its own commits, each
keeping evaluation results identical and each measured with the benchmark.

| Phase | Content | Expected effect |
|---|---|---|
| **1 (this document)** | Linear context builder with identical results, behind a module with a single API; build the context once per render where inputs are identical | Removes most of the 85% |
| 2 | Layered context: a stable layer (session, auxiliary inputs, parent record) built once per record and session, with the form values as a light layer on top, provided at form level | Typing stops rebuilding the session layer |
| 3 | Compile each tab's expressions once with the fields they read; re-evaluate only the expressions that depend on the changed field; replace the whole-form `watch()` | Fluid typing |

**Why Phase 1 introduces a module and an API, not just a faster function:** if callers keep calling
`createSmartContext` directly, Phases 2 and 3 would have to touch every form component again. With the
module in place, Phases 2 and 3 change its internals, not its callers.

## 3. Phase 1 goals and non-goals

**Goals**

- G1. A context builder whose output is **identical** to the current `createEvaluationContext` for any
  input: same keys, same key order, same values, and the same result for every property read through
  the proxy (`get` and `has`).
- G2. Build cost O(n) in the number of keys; proxy lookups O(1) on average.
- G3. One module API that every caller uses.
- G4. Build the context once per render, not per field, button or record, wherever the inputs are the
  same.
- G5. Meet the acceptance thresholds in section 8.

**Non-goals (later phases or other tickets)**

- Layered or shared contexts (Phase 2).
- Dependency tracking and replacing `watch()` (Phase 3).
- Changing what any expression evaluates to, or the overwrite and precedence rules.
- Metadata, cache, network or security work tracked elsewhere.

## 4. Design

### 4.1 Module layout

```
packages/MainUI/utils/evaluation/
  buildEvaluationContext.ts      # pure builder + proxy (moved from utils/expressions.ts, rewritten)
  lazyContext.ts                 # build-once getters (one per pass, one per record)
  __mocks__/
    legacyEvaluationContext.ts   # verbatim copy of the current implementation, test-only oracle
  __tests__/
    buildEvaluationContext.test.ts
    buildEvaluationContext.differential.test.ts
    lazyContext.test.ts
packages/MainUI/hooks/evaluation/
  useEvaluationContext.ts        # memoized hook over the builder
```

The oracle lives in `__mocks__/` because Biome (`files.ignore`) and Sonar (`sonar.exclusions`) ignore
that folder and Jest does not run it as a suite (any `.ts` under `__tests__/` would be). It is imported
directly by the differential test, never through `jest.mock`.

`utils/expressions.ts` stays the **public import path** of the builder in Phase 1: it re-exports
`buildEvaluationContext` as `createEvaluationContext` and `createSmartContext`. Callers that keep
building per field (`useDisplayLogic`, `BaseSelector`, `TabsContainer`, `processExpressionUtils`) keep
their current import, and `useEvaluationContext` calls the builder **by the name
`createSmartContext` imported from `@/utils/expressions`** (not `buildEvaluationContext` or
`createEvaluationContext`): `FormFieldsContent.test.tsx` replaces the module with a mock that defines
only `createSmartContext`, and any other name would be `undefined` there. Existing tests that `jest.mock("@/utils/expressions")`
(`hooks/__tests__/useDisplayLogic.test.ts`, `components/Form/FormView/__tests__/FormFieldsContent.test.tsx`)
therefore keep intercepting every build. `SmartContextOptions` moves to the new module (as
`EvaluationContextOptions`, re-exported under the old name).

### 4.2 API

```ts
// utils/evaluation/buildEvaluationContext.ts
export interface EvaluationContextOptions {
  values?: Record<string, unknown>;
  fields?: Record<string, Field>;
  parentValues?: Record<string, unknown>;
  parentFields?: Record<string, Field>;
  context?: Record<string, unknown>;
  auxiliaryInputs?: Record<string, string>;
  normalizeValues?: boolean;
  defaultValue?: unknown;
  windowId?: string;
}
export type EvaluationContext = Record<string, any>; // the proxy, as today
export function buildEvaluationContext(options: EvaluationContextOptions): EvaluationContext;

// hooks/evaluation/useEvaluationContext.ts
export function useEvaluationContext(options: EvaluationContextOptions): EvaluationContext | null;
```

`useEvaluationContext` is `useMemo` over a build wrapped in `try/catch`: it returns the context, or
`null` if the build throws (logged with `logger.warn`). It never throws, so moving the build out of a
caller's per-field `try` cannot crash rendering (see section 5). It is a hook: callers call it
unconditionally, before any early return. In Phase 1 it memoizes per render (callers such as
`FormHeader` still pass a new `formData` object every render). Phase 2 changes its internals to the
layered context without changing its signature.

Per-field hooks (`useDisplayLogic`, `BaseSelector` read-only logic) build their context inside their
own `useMemo`, conditionally, with per-field values from `useExpressionDependencies`. They keep calling
`createSmartContext` from `@/utils/expressions` (section 4.1), now backed by the linear builder; they
cannot share one context in Phase 1 without changing which values each field sees.

### 4.3 Builder: same algorithm, indexed

The build keeps the current steps in the current order. Only the key matching changes.

1. Copy the session `context`, normalized (booleans to `Y`/`N`).
2. Copy `auxiliaryInputs`, each also under its SNAKE_CASE key.
3. For each entry of `{ ...parentValues, ...values }`: set the key; overwrite every **other** key whose
   lowercase form, or lowercase form without underscores, equals the incoming key's, applying the
   current empty-value guard (an existing non-empty value is never overwritten with `""`, `null` or
   `undefined`); then set the SNAKE_CASE key unless the key starts with `$` or `#`.
4. Map `parentFields` then `fields`: `dBColumnName` (or `columnName`) and its uppercase form get the
   value of `hqlName`.

**Index for step 3.** A `Map<normalizedKey, Set<key>>`, where `normalizedKey` is the key lowercased
with underscores removed, records every key written to the context in steps 1–4 at the moment it is
written. The current inner loop matches `existingLower === lowerKey || existingLower without "_" ===
normalizedKey`; the first condition implies the second, so the set of keys sharing the incoming key's
`normalizedKey` is exactly the set the current loop visits. Each matched key is updated from its own
current value, so the result does not depend on the order in which the matches are visited.

The set reflects only keys written **before** the incoming entry, exactly like the current loop, which
reads `Object.keys(evalContext)` at that moment. A key is recorded only if the write created an own
property (`Object.prototype.hasOwnProperty.call(evalContext, key)`): assigning `__proto__` calls the
prototype setter instead of creating a key, and the current loop never sees it.

**Indexes for the proxy.** After the build, one pass over `Object.keys(target)` builds:

- `firstByLower: Map<lowercaseKey, key>` – the first key in `Object.keys` order for each lowercase form
  (the current case-insensitive match, which has priority);
- `firstByNormalized: Map<normalizedKey, key>` – the first key in `Object.keys` order for each
  normalized form (the current loose fallback).

Building them from `Object.keys` (not from insertion order) preserves JavaScript's key ordering rules,
including integer-like keys, which are listed first.

`resolveProperty(prop)` keeps its three steps: `prop in target` (including inherited properties such as
`toString`, as today), then `firstByLower`, then `firstByNormalized`. The `has` trap uses `prop in
target`, then `firstByLower`. `checkClearedIdentifier`, the prefixed lookups (`@prop@`, `#prop`,
`$prop`, `_prop`) and preference resolution through `resolvePreference(key, windowId)` call the same
`resolveProperty` and are otherwise unchanged.

**Writes after creation.** Nothing in the codebase is known to write to the context, but the current
proxy has no `set` trap, so a write would land on the target and be visible to later lookups. To stay
identical, the new proxy adds `set`, `defineProperty` and `deleteProperty` traps that forward to the
target with `Reflect.set(target, prop, value, receiver)` (and the matching `Reflect` call), then mark
the proxy indexes stale; the next lookup rebuilds them. They cost nothing on the read path.

### 4.4 Caller changes

| File | Change |
|---|---|
| `FormHeader.tsx` | `const ctx = useEvaluationContext({ values: formData, fields: tab?.fields, context: session, windowId: tab?.window })` once; the section filter reuses `ctx` inside its existing `try`. If `ctx` is `null`, each field takes the current catch fallback (`true`). The `tabs` `useMemo` dependency list gains `ctx` and drops the inputs it no longer reads directly |
| `FormFieldsContent.tsx` | Same: one context per render, reused for every section and field; fallback `true` when `ctx` is `null`. The hook call goes before the early `if (loading && !hasLoadedOnce) return <Spinner/>` |
| `useToolbar.ts` | Inside the existing `processButtons` `useMemo`, a **lazy** per-record cache (`Map<record, context>`): a record's context is built the first time a button needs it and reused by the next buttons. Builds stay inside the per-button `try`, so a throw keeps today's fallback (`true`). The existing short-circuits (not displayed, multi-select, no display logic, `.some` stopping at the first match) keep avoiding builds |
| `useFormValidation.ts` | One context per validation pass through a **lazy holder**: `validateRequiredFields` creates `getCtx = once(() => createSmartContext({ values: formValues, fields: tab?.fields, context: session, windowId: tab?.window }))` (the same options `isFieldDisplayed` passes today, `formValues` being the pass's `getValues()` snapshot) and passes it to `isFieldDisplayed(field, getCtx?)`. `isFieldDisplayed` keeps its order: no display logic → `field.displayed`; empty values → `field.displayed`; then, inside its existing `try`, `getCtx ? getCtx() : build its own`. A throwing build is therefore caught per field (fallback `field.displayed`, as today) and, since `once` caches only a successful result, retried by the next field. Called without a holder (it is part of the hook's public return), it behaves exactly as today. Its dependency list gains `tab`, which the closure already reads |
| `useDisplayLogic.ts`, `BaseSelector.tsx`, `TabsContainer.tsx`, `ProcessModal/utils/processExpressionUtils.ts` | No change: they keep calling `createSmartContext` from `@/utils/expressions`, now backed by the linear builder |

Every changed caller passes exactly the options it passes today, including `windowId` and
`defaultValue` where present.

Hoisting means `FormHeader` and `FormFieldsContent` build one context per render even when no field
has display logic. At the expected ~0.5 ms per build this is negligible, and it replaces up to one
build per field.

## 5. Error handling

Observable behavior is unchanged. The builder throws in the same situations as today (for example,
`mapFields` reading `field.column` on a `null` entry of `fields`). Today those throws happen inside each
caller's per-field `try` and end in that caller's fallback (`true` in `FormHeader`, `FormFieldsContent`
and `useToolbar`; `field.displayed` in `useFormValidation`). In Phase 1:

- builds that move out of a loop go through `useEvaluationContext`, which catches and returns `null`;
  callers treat `null` exactly like a caught throw and apply the same fallback per field;
- builds that stay inside a loop (`useToolbar`, `useFormValidation`) stay inside the existing `try`.

## 6. Testing

1. **Differential test (the equivalence gate).** `__mocks__/legacyEvaluationContext.ts` is a verbatim copy of the
   current implementation at the start of the branch, with the same `resolvePreference` dependency
   (mocked identically for both). For every input set, the test asserts:
   - `Object.keys(newCtx)` equals `Object.keys(legacyCtx)`, in order, and every value is equal;
   - for a list of probe names, `newCtx[name]` and `name in newCtx` equal the legacy results. Probes:
     every key, every key in different casing, with underscores removed and added, as `@key@`, `#key`,
     `$key` and `_key`, as `key$_identifier`, missing names, inherited names (`toString`,
     `constructor`), and a `__proto__` key in the inputs;
   - after a write through the proxy, later lookups still match.

   Input sets:
   - **Shape-realistic generated data:** a seeded generator (no real customer data is committed)
     producing a session of ~470 attributes with Etendo naming patterns (`#AD_CLIENT_ID`,
     `$Element_OO`, `P|...`, SNAKE and camel case), a record of ~180 properties with `$_identifier`
     companions, auxiliary inputs, parent values, and field metadata mapping `hqlName` to
     `dBColumnName`.
   - **Collision cases:** keys that collide by case and by underscores in all directions (session vs.
     auxiliary input vs. value vs. generated SNAKE key), empty-value guard cases (`""`, `null`,
     `undefined`, `false` normalized to `"N"`), `normalizeValues: false`, `defaultValue`, and `windowId`.
   - **Property-based:** a few hundred seeded random combinations of the above.
2. **Existing tests** (`utils/__tests__/expressions.test.ts`, `compileExpression.propertyStore.test.ts`,
   `useDisplayLogic.test.ts`, `FormFieldsContent.test.tsx`, and the toolbar and validation tests) keep
   their mocks and expected results. The only edits allowed are expectations about **how many times**
   the builder is called (where a test asserted one call per field) and about log output (none
   asserts on it today).
3. **Caller tests:** `FormHeader`, `FormFieldsContent` and `useFormValidation` assert that the builder is
   called once per render or pass, that visibility results are unchanged, and that a throwing build ends
   in the same fallback as today. `useToolbar`'s build-once-per-record behavior is covered by the unit
   tests of `lazyContextByKey` (built lazily, cached per record, a throwing build not cached), and its
   results by the existing `useToolbar` tests.
4. **Micro-benchmark** (not part of CI): one build with the realistic generated data drops from ~13 ms
   to under 0.5 ms on the developer machine.
5. **Benchmark** (acceptance, section 8).

## 7. Commits on `hotfix/ETP-5641` (Phase 1)

0. `Hotfix ETP-5641: Add UI performance benchmark and baselines`
   – `playwright-tests/perf/` (`bench.mjs`, `compare.mjs`, `hotspots.mjs`, README, the baseline result
   files) and the opt-in `SOURCE_MAPS` flag in `next.config.ts` that `hotspots.mjs` needs. No
   application behavior changes.
1. `Hotfix ETP-5641: Add evaluation module with differential test oracle`
   – the module, the verbatim legacy copy and the differential test; the new builder still delegates to
   the legacy algorithm, so the test establishes the harness.
2. `Hotfix ETP-5641: Make evaluation context build linear`
   – the indexed builder and proxy; differential and existing tests green.
3. `Hotfix ETP-5641: Build evaluation context once per render in forms`
   – the caller changes in section 4.4 and their tests.

## 8. Acceptance criteria (Phase 1)

Measured with `playwright-tests/perf/bench.mjs` at `CPU_THROTTLE=4`, `RUNS=3`, against the production
build, compared with the baseline `local-react-cpu4x-2026-10-01T19-32-25-746Z.json` using
`compare.mjs`:

- Opening a Sales Invoice record (`open-record`, `visibleMs`) takes **less than 5 s** (baseline 47.9 s).
- `blockingMs` of `open-record`, summed over the four windows, drops by **at least 80%**.
- No other step regresses by more than 10% (the run-to-run noise observed is a few percent).
- The differential test, the existing tests and SonarQube's coverage gate pass.

## 9. Risks

| Risk | Mitigation |
|---|---|
| A subtle ordering difference changes an expression's result | Differential test against a verbatim copy, including `Object.keys` order, integer-like keys and inherited names |
| A caller relied on getting a fresh context per field | The builder output is identical; a context is read-only by convention; write traps keep later lookups identical |
| Phase 1 alone misses the 5 s target | Per-field hooks still build one context each; if the target is missed, the profile shows how much remains in them, and Phase 2 is where it is addressed |
| Logging changes when a hoisted build throws | `useEvaluationContext` logs with `logger.warn`; today `FormFieldsContent` uses `console.warn` and `FormHeader` logs nothing. Outcomes are identical; tests that assert on console output are adjusted |

## 10. Decisions

- The measurement tooling and its baselines are committed on this branch as commit 0 (section 7), so
  the acceptance criteria in section 8 are reproducible by the reviewer.
- Benchmark commands need `NODE_OPTIONS` unset where the developer shell injects a preload that no
  longer exists (`env -u NODE_OPTIONS node perf/bench.mjs`); the README documents it.
