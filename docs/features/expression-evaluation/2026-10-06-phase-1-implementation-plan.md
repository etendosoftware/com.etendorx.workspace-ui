# Expression Evaluation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the expression evaluation context build linear with results identical to today, behind one module API, and build it once per render in the form components, so opening a Sales Invoice record at 4x CPU drops from 47.9 s to under 5 s.

**Architecture:** The builder moves from `utils/expressions.ts` to `utils/evaluation/buildEvaluationContext.ts` and is rewritten with normalized-key indexes (O(n) build, O(1) proxy lookups). `utils/expressions.ts` stays the public import path (`createSmartContext`) so existing mocks keep working. A verbatim copy of today's builder is kept as a test oracle, and a differential test proves the new one returns the same keys, order, values and lookups for any input. Callers that rebuild the context inside loops (`FormHeader`, `FormFieldsContent`, `useToolbar`, `useFormValidation`) build it once per render, per pass or per record.

**Tech Stack:** TypeScript, React 18 hooks, react-hook-form, Jest + ts-jest + Testing Library, Biome, Playwright (benchmark).

**Spec:** `docs/features/expression-evaluation/2026-10-06-phase-1-linear-context-design.md`

**Branch:** `feature/ETP-5641` (already created from `main`). Commit messages: `Feature ETP-5641: <description>`, first line ≤ 80 characters, ending with the `Co-Authored-By` trailer.

---

## Conventions for every task

- Run commands from the repository root `/Users/santiagoalaniz/Dev/com.etendorx.workspace-ui` unless a step says otherwise.
- **`NODE_OPTIONS`:** the developer shell injects a `--require` preload that no longer exists, which makes every `node`/`pnpm`/`jest` command fail with `Cannot find module '.../restore-node-options.cjs'`. Prefix commands with `env -u NODE_OPTIONS`, as written below.
- Run one MainUI test file: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI <path>`.
- Lint/format changed files: `env -u NODE_OPTIONS pnpm exec biome check --write <files>`.
- New source files start with the same license header as `packages/MainUI/utils/expressions.ts` (lines 1–16), with the copyright year range `2021–2026`.
- **Never** stage these unrelated working-tree changes: `packages/MainUI/hooks/table/useTableData.tsx`, `packages/MainUI/utils/table/utils.ts`, `packages/MainUI/utils/table/__tests__/utils.test.ts`. Always `git add` explicit paths.

## File map

| Path | Status | Responsibility |
|---|---|---|
| `playwright-tests/perf/{bench,compare,hotspots}.mjs`, `README.md`, `results/*.json` | Add (task 1) | Benchmark tooling and baselines |
| `playwright-tests/.gitignore` | Modify (task 1) | Ignore `perf/results/profiles/` (28 MB of CPU profiles) |
| `packages/MainUI/next.config.ts` | Modify (task 1, already edited in the working tree) | Opt-in `SOURCE_MAPS` flag |
| `packages/MainUI/utils/evaluation/buildEvaluationContext.ts` | Create (task 2), rewrite (task 3) | The builder and its proxy |
| `packages/MainUI/utils/evaluation/__mocks__/legacyEvaluationContext.ts` | Create (task 2) | Verbatim copy of today's builder, test oracle only. `__mocks__/` is ignored by Biome (`files.ignore`) and Sonar (`sonar.exclusions`), and not matched by Jest's `testMatch`; it is imported directly, never through `jest.mock` |
| `packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.differential.test.ts` | Create (task 2) | Equivalence gate: new vs. oracle |
| `packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.test.ts` | Create (task 3) | Focused behavior tests of the indexed builder |
| `packages/MainUI/utils/expressions.ts` | Modify (task 2) | Public entry point: re-exports the builder as `createEvaluationContext` / `createSmartContext` |
| `packages/MainUI/utils/evaluation/lazyContext.ts` + test | Create (task 4) | Build-once getters used by `useToolbar` and `useFormValidation` |
| `packages/MainUI/hooks/evaluation/useEvaluationContext.ts` + test | Create (task 5) | Memoized, non-throwing hook over `createSmartContext` |
| `packages/MainUI/components/Form/FormView/FormHeader.tsx` + new test | Modify (task 6) | One context per render |
| `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx` + test | Modify (task 7) | One context per render |
| `packages/MainUI/hooks/Toolbar/useToolbar.ts` | Modify (task 8) | One context per selected record, built lazily |
| `packages/MainUI/hooks/useFormValidation.ts` + new test | Modify (task 9) | One context per validation pass, built lazily |

---

### Task 1: Commit the benchmark tooling and baselines (commit 0)

**Files:**
- Modify: `playwright-tests/.gitignore`
- Modify: `playwright-tests/perf/README.md`
- Add: `playwright-tests/perf/bench.mjs`, `compare.mjs`, `hotspots.mjs`, `README.md`, `results/*.json`
- Add (already modified): `packages/MainUI/next.config.ts`

- [ ] **Step 1: Check that `next.config.ts` only carries the source-maps flag**

Run: `git diff packages/MainUI/next.config.ts`
Expected: exactly these two added lines and nothing else:

```ts
  // Opt-in browser source maps for CPU profiling of production builds (SOURCE_MAPS=true pnpm build)
  productionBrowserSourceMaps: process.env.SOURCE_MAPS === "true",
```

If the diff shows anything else, stop and ask.

- [ ] **Step 2: Ignore the CPU profiles**

Append to `playwright-tests/.gitignore`:

```
perf/results/profiles/
```

- [ ] **Step 3: Document the shell workaround in the benchmark README**

Append to `playwright-tests/perf/README.md`:

```markdown

## Troubleshooting

- `Cannot find module '.../restore-node-options.cjs'`: the shell injects a `NODE_OPTIONS` preload that no
  longer exists. Run the scripts as `env -u NODE_OPTIONS node perf/bench.mjs`.
- Port 3000 taken by another dev server: start the production build on another port
  (`npx next start -p 3100` from `packages/MainUI`) and pass `BASE_URL=http://localhost:3100`.
- Classic runs need `FLAVOR=classic` and `BASE_URL=http://localhost:8080/etendo`.
```

- [ ] **Step 4: Make the scripts pass Biome**

Only the `.mjs` scripts (not `results/*.json`, which stay byte-for-byte as recorded):

1. In `playwright-tests/perf/bench.mjs`, replace the line

```js
    const e = (byEndpoint[k] ||= { count: 0, bytes: 0, waitMs: 0, durMs: 0 });
```

with

```js
    byEndpoint[k] ??= { count: 0, bytes: 0, waitMs: 0, durMs: 0 };
    const e = byEndpoint[k];
```

and the line

```js
      for (const s of steps) ((raw[`${w} / ${s.name}`] ||= [])).push(s);
```

with

```js
      for (const s of steps) {
        const key = `${w} / ${s.name}`;
        raw[key] ??= [];
        raw[key].push(s);
      }
```

2. Apply the remaining fixes (template literals, optional chain, formatting); they are "unsafe" only in Biome's classification and do not change behavior here:

Run: `env -u NODE_OPTIONS pnpm exec biome check --write --unsafe playwright-tests/perf/bench.mjs playwright-tests/perf/compare.mjs playwright-tests/perf/hotspots.mjs packages/MainUI/next.config.ts`
Expected: `Checked 4 files` with no errors left.

3. Re-check the scripts still parse: `env -u NODE_OPTIONS node --check playwright-tests/perf/bench.mjs && env -u NODE_OPTIONS node --check playwright-tests/perf/compare.mjs && env -u NODE_OPTIONS node --check playwright-tests/perf/hotspots.mjs` — expected: no output.

- [ ] **Step 5: Commit**

```bash
git add playwright-tests/.gitignore playwright-tests/perf/bench.mjs playwright-tests/perf/compare.mjs \
  playwright-tests/perf/hotspots.mjs playwright-tests/perf/README.md playwright-tests/perf/results/*.json \
  packages/MainUI/next.config.ts
git status --short   # must NOT list perf/results/profiles or the useTableData/utils files as staged
git commit -m "Feature ETP-5641: Add UI performance benchmark and baselines

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Evaluation module, test oracle and differential harness (commit 1)

The builder moves to its own module unchanged, so the differential test passes from the start and validates the harness itself.

**Files:**
- Create: `packages/MainUI/utils/evaluation/__mocks__/legacyEvaluationContext.ts`
- Create: `packages/MainUI/utils/evaluation/buildEvaluationContext.ts`
- Modify: `packages/MainUI/utils/expressions.ts` (whole file)
- Create: `packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.differential.test.ts`

- [ ] **Step 1: Create the oracle as a verbatim copy of today's builder**

From the repository root:

```bash
mkdir -p packages/MainUI/utils/evaluation/__mocks__ packages/MainUI/utils/evaluation/__tests__
git show HEAD:packages/MainUI/utils/expressions.ts > packages/MainUI/utils/evaluation/__mocks__/legacyEvaluationContext.ts
```

Then make exactly these three edits in `packages/MainUI/utils/evaluation/__mocks__/legacyEvaluationContext.ts` (nothing else):

1. Replace `import { resolvePreference } from "./propertyStore";` with `import { resolvePreference } from "@/utils/propertyStore";`
2. Replace `export const createEvaluationContext = (options: SmartContextOptions) => {` with `export const legacyCreateEvaluationContext = (options: SmartContextOptions) => {`
3. Delete the last line `export const createSmartContext = createEvaluationContext;`

And insert after the license header:

```ts
/**
 * TEST ORACLE — do not edit, do not import from application code.
 *
 * Verbatim copy of `createEvaluationContext` as it was before ETP-5641 (quadratic build). The
 * differential test compares the new builder against it. Kept under `__mocks__/` so Biome and Sonar
 * ignore it and Jest does not run it as a test suite; it is imported directly, never via jest.mock.
 */
```

- [ ] **Step 2: Move today's builder into the module, unchanged**

From the repository root:

```bash
git show HEAD:packages/MainUI/utils/expressions.ts > packages/MainUI/utils/evaluation/buildEvaluationContext.ts
```

Edits in `packages/MainUI/utils/evaluation/buildEvaluationContext.ts`:

1. Replace `import { resolvePreference } from "./propertyStore";` with `import { resolvePreference } from "@/utils/propertyStore";`
2. Replace `interface SmartContextOptions {` with `export interface EvaluationContextOptions {`
3. After that interface, add:

```ts
/** The proxy handed to compiled expressions: a flat record with flexible (case/underscore-insensitive) reads. */
export type EvaluationContext = Record<string, any>;
```

4. Replace `export const createEvaluationContext = (options: SmartContextOptions) => {` with `export const buildEvaluationContext = (options: EvaluationContextOptions): EvaluationContext => {`
5. Delete the last line `export const createSmartContext = createEvaluationContext;`

- [ ] **Step 3: Turn `utils/expressions.ts` into the public entry point**

Replace everything after the license header (line 17 onward) of `packages/MainUI/utils/expressions.ts` with:

```ts
/**
 * Public entry point of the expression evaluation context builder.
 *
 * The implementation lives in `utils/evaluation/buildEvaluationContext`. These names stay the import
 * path for application code and for test mocks (`jest.mock("@/utils/expressions")`).
 */
import { buildEvaluationContext } from "./evaluation/buildEvaluationContext";

export type {
  EvaluationContext,
  EvaluationContextOptions,
  EvaluationContextOptions as SmartContextOptions,
} from "./evaluation/buildEvaluationContext";

export const createEvaluationContext = buildEvaluationContext;
export const createSmartContext = buildEvaluationContext;
```

- [ ] **Step 4: Run the existing expression tests to confirm the move changed nothing**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/utils/__tests__/expressions.test.ts packages/MainUI/hooks/__tests__/useDisplayLogic.test.ts packages/MainUI/components/Form/FormView/__tests__/FormFieldsContent.test.tsx`
Expected: PASS (same number of tests as before).

- [ ] **Step 5: Write the differential test**

Create `packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.differential.test.ts`:

```ts
/* license header */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { buildEvaluationContext, type EvaluationContextOptions } from "../buildEvaluationContext";
import { legacyCreateEvaluationContext } from "../__mocks__/legacyEvaluationContext";

/** Deterministic PRNG so every failure is reproducible from its seed. */
const mulberry32 = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Rnd = () => number;
const pick = <T>(rnd: Rnd, items: readonly T[]): T => items[Math.floor(rnd() * items.length)];

/** Names that collide by case and underscores, Etendo-style prefixes, integer-like and inherited names. */
const BASE_NAMES = [
  "P|Exception_ID", "$Element_OO", "AD_Client_ID", "AD_Org_ID", "C_BPartner_ID", "cBpartner", "documentNo", "DOCUMENTNO", "DocStatus",
  "docstatus", "isSOTrx", "IsSOTrx", "ISSOTRX", "productType", "PRODUCTTYPE", "product_type", "M_Product_ID",
  "mProduct", "grandTotalAmount", "GRAND_TOTAL_AMOUNT", "processed", "Processed", "_identifier", "0", "1", "42",
  "toString", "constructor", "valueOf", "__proto__",
] as const;

const VALUES = ["", null, undefined, "Y", "N", true, false, 0, 7, "abc", "A5ABE40B99F94D94A5FAAC741E659EA5"] as const;

const variantOf = (rnd: Rnd, name: string): string =>
  pick(rnd, [
    name,
    name.toLowerCase(),
    name.toUpperCase(),
    name.replace(/_/g, ""),
    name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase(),
    `#${name}`,
    `$${name}`,
    `${name}$_identifier`,
  ]);

/** A record of `size` entries mixing colliding names with unique ones. Built with fromEntries so `__proto__` is an own key. */
const genRecord = (rnd: Rnd, size: number, uniquePrefix: string): Record<string, unknown> => {
  const entries: Array<[string, unknown]> = [];
  for (let i = 0; i < size; i++) {
    const key = rnd() < 0.5 ? variantOf(rnd, pick(rnd, BASE_NAMES)) : `${uniquePrefix}${i}`;
    entries.push([key, pick(rnd, VALUES)]);
  }
  return Object.fromEntries(entries);
};

/** Field metadata mapping some value keys (hqlName) to DB column names, with and without `column`. */
const genFields = (rnd: Rnd, values: Record<string, unknown>): Record<string, Field> => {
  const fields: Record<string, Field> = {};
  for (const key of Object.keys(values)) {
    if (rnd() < 0.6) continue;
    const dbColumn = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    fields[`f_${key}`] = {
      hqlName: key,
      columnName: dbColumn,
      ...(rnd() < 0.5 ? { column: { dBColumnName: `${dbColumn}_DB` } } : {}),
    } as unknown as Field;
  }
  return fields;
};

const genOptions = (rnd: Rnd, sizes: { session: number; record: number; aux: number; parent: number }) => {
  const values = genRecord(rnd, sizes.record, "rec");
  const parentValues = rnd() < 0.7 ? genRecord(rnd, sizes.parent, "par") : undefined;
  const options: EvaluationContextOptions = {
    context: genRecord(rnd, sizes.session, "#ATTR_"),
    auxiliaryInputs: rnd() < 0.7 ? (genRecord(rnd, sizes.aux, "aux") as Record<string, string>) : undefined,
    values,
    fields: genFields(rnd, values),
    parentValues,
    parentFields: parentValues ? genFields(rnd, parentValues) : undefined,
    normalizeValues: rnd() < 0.85,
    defaultValue: rnd() < 0.2 ? "DEF" : undefined,
    windowId: rnd() < 0.5 ? "W1" : undefined,
  };
  return options;
};

/** Every key plus its case, underscore, prefixed and identifier variants, missing and inherited names. */
const probesFor = (keys: string[]): string[] => {
  const probes = new Set<string>(["missing_name", "MISSING", "toString", "constructor", "__proto__", "hasOwnProperty"]);
  for (const key of keys) {
    probes.add(key);
    probes.add(key.toLowerCase());
    probes.add(key.toUpperCase());
    probes.add(key.replace(/_/g, ""));
    probes.add(`_${key}`);
    probes.add(`@${key}@`);
    probes.add(`#${key}`);
    probes.add(`$${key}`);
    probes.add(`${key}$_identifier`);
  }
  return [...probes];
};

const expectSameContext = (actual: Record<string, any>, expected: Record<string, any>) => {
  expect(Object.keys(actual)).toEqual(Object.keys(expected));
  expect(Object.getPrototypeOf(actual)).toBe(Object.getPrototypeOf(expected));
  for (const probe of probesFor(Object.keys(expected))) {
    // Pair each value with its probe so a failure names the lookup that differs.
    expect([probe, actual[probe]]).toEqual([probe, expected[probe]]);
    expect([probe, probe in actual]).toEqual([probe, probe in expected]);
  }
};

describe("buildEvaluationContext — differential against the legacy builder", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({ productType: "PREF", productType_W1: "PREF_W1", DocStatus: true, isSOTrx: "" });
  });

  it.each([1, 2, 3])("matches the legacy builder on realistic-size data (seed %i)", (seed) => {
    const options = genOptions(mulberry32(seed), { session: 470, record: 180, aux: 20, parent: 30 });
    expectSameContext(buildEvaluationContext(options), legacyCreateEvaluationContext(options));
  });

  it("matches the legacy builder on 300 random small inputs", () => {
    for (let seed = 100; seed < 400; seed++) {
      const options = genOptions(mulberry32(seed), { session: 25, record: 15, aux: 5, parent: 6 });
      expectSameContext(buildEvaluationContext(options), legacyCreateEvaluationContext(options));
    }
  });

  it("matches the legacy builder after writes through the proxy", () => {
    const options = genOptions(mulberry32(7), { session: 40, record: 30, aux: 6, parent: 8 });
    const actual = buildEvaluationContext(options);
    const expected = legacyCreateEvaluationContext(options);
    for (const ctx of [actual, expected]) {
      ctx.extraKey = "W";
      ctx.DOCUMENTNO = "OVERRIDE";
      // Reflect.deleteProperty goes through the proxy's deleteProperty trap like `delete`
      // (which Biome's noDelete rejects in this repo).
      Reflect.deleteProperty(ctx, "AD_Org_ID");
    }
    expectSameContext(actual, expected);
  });

  it("matches the legacy builder for empty and minimal inputs", () => {
    for (const options of [{}, { context: {} }, { values: {} }, { values: { a: 1 }, normalizeValues: false }]) {
      expectSameContext(buildEvaluationContext(options), legacyCreateEvaluationContext(options));
    }
  });

  it("detects a difference (harness self-check)", () => {
    const options = { values: { isActive: true } };
    expect(() =>
      expectSameContext(
        buildEvaluationContext({ ...options, normalizeValues: false }),
        legacyCreateEvaluationContext(options)
      )
    ).toThrow();
  });
});
```

- [ ] **Step 6: Run the differential test**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.differential.test.ts`
Expected: PASS, 7 tests (the module still holds today's algorithm, so the harness must agree with itself; the self-check proves it can fail).

- [ ] **Step 7: Lint and commit**

```bash
env -u NODE_OPTIONS pnpm exec biome check --write \
  packages/MainUI/utils/evaluation/__tests__ packages/MainUI/utils/expressions.ts
env -u NODE_OPTIONS pnpm exec biome check packages/MainUI/utils/evaluation/buildEvaluationContext.ts
```

Expected: the first command reports no errors. The second reports exactly the findings today's
`utils/expressions.ts` already has on `main` (5× `lint/complexity/noForEach`, 4× `lint/style/useTemplate`
errors, plus 4× `noExplicitAny` warnings):
the file is still a verbatim move and Task 3 rewrites it. Any other finding: fix it. The oracle is in
`__mocks__/`, which Biome ignores.

```bash
git add packages/MainUI/utils/evaluation packages/MainUI/utils/expressions.ts
git commit -m "Feature ETP-5641: Add evaluation module with differential test oracle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Make the build linear (commit 2)

**Files:**
- Modify: `packages/MainUI/utils/evaluation/buildEvaluationContext.ts` (replace the function body and the proxy)
- Create: `packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.test.ts`

- [ ] **Step 1: Write focused tests for the indexed behavior**

Create `packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.test.ts`:

```ts
/* license header */

import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { buildEvaluationContext } from "../buildEvaluationContext";

describe("buildEvaluationContext", () => {
  beforeEach(() => installLocalStorageMock());

  it("overwrites session keys that share a name with a record value, ignoring case and underscores", () => {
    const ctx = buildEvaluationContext({
      context: { PRODUCTTYPE: "OLD", product_type: "OLD", Other: "keep" },
      values: { productType: "I" },
    });
    expect(ctx.PRODUCTTYPE).toBe("I");
    expect(ctx.product_type).toBe("I");
    expect(ctx.Other).toBe("keep");
  });

  it("never overwrites a non-empty value with an empty one", () => {
    const ctx = buildEvaluationContext({ context: { PRODUCTTYPE: "S" }, values: { productType: "" } });
    expect(ctx.PRODUCTTYPE).toBe("S");
  });

  it("does not let a key match keys written after it", () => {
    const ctx = buildEvaluationContext({ values: { productType: "A", PRODUCT_TYPE: "B" } });
    // PRODUCT_TYPE (second) overwrites productType (first); the first never sees the second.
    expect(ctx.productType).toBe("B");
  });

  it("resolves reads case-insensitively first, then ignoring underscores", () => {
    const ctx = buildEvaluationContext({ values: { docStatus: "CO", doc_status_x: "N" } });
    expect(ctx.DOCSTATUS).toBe("CO");
    expect(ctx.docstatusx).toBe("N");
    expect("DOCSTATUS" in ctx).toBe(true);
  });

  it("sees writes made through the proxy after creation", () => {
    const ctx = buildEvaluationContext({ values: { a: "1" } });
    ctx.NewKey = "x";
    expect(ctx.newkey).toBe("x");
    Reflect.deleteProperty(ctx, "NewKey"); // through the deleteProperty trap; Biome rejects `delete`
    expect(ctx.newkey).toBe("");
  });

  it("does not record __proto__ as a key", () => {
    const ctx = buildEvaluationContext({ values: Object.fromEntries([["__proto__", "x"], ["a", "1"]]) });
    expect(Object.keys(ctx)).not.toContain("__proto__");
  });
});
```

- [ ] **Step 2: Run them against the current (quadratic) builder**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/utils/evaluation/__tests__/buildEvaluationContext.test.ts`
Expected: PASS. These pin today's behavior; they must keep passing after the rewrite.

- [ ] **Step 3: Replace the builder with the indexed version**

In `packages/MainUI/utils/evaluation/buildEvaluationContext.ts`, keep the license header, the imports, `EvaluationContextOptions` and `EvaluationContext` exactly as they are. Replace the doc comment and the whole `buildEvaluationContext` function with:

```ts
/** Lowercase without underscores: two keys with the same form are treated as the same name. */
const normalizedForm = (key: string) => key.toLowerCase().replace(/_/g, "");

/** camelCase → SNAKE_CASE, as display logic written against DB column names expects. */
const toSnakeKey = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();

const isEmptyValue = (val: unknown) => val === "" || val === null || val === undefined;

interface LookupIndexes {
  /** First key, in Object.keys order, for each lowercase form. */
  byLowercase: Map<string, string>;
  /** First key, in Object.keys order, for each normalized form. */
  byNormalizedForm: Map<string, string>;
}

/**
 * Builds the context that compiled display/read-only logic expressions read from.
 *
 * It supports:
 * 1. Case-insensitive property access, with an underscore-insensitive fallback.
 * 2. Mapping from DB column names (e.g. C_BPARTNER_ID) to HQL property names (e.g. cBpartner)
 *    based on the provided field metadata.
 * 3. Precedence across sources: record values > parent values > auxiliary inputs > session.
 *
 * The result is identical to the pre-ETP-5641 builder (kept as a test oracle in
 * `__mocks__/legacyEvaluationContext.ts`), but the build is O(n) and reads are O(1): keys are grouped by
 * normalized form while they are written, instead of rescanning every key for each value.
 */
export const buildEvaluationContext = (options: EvaluationContextOptions): EvaluationContext => {
  const {
    values,
    fields,
    parentValues,
    parentFields,
    context = {},
    auxiliaryInputs,
    normalizeValues = true,
    defaultValue,
    windowId,
  } = options;

  // Helper to normalize values (true -> 'Y', false -> 'N')
  const normalize = (val: unknown) => {
    if (!normalizeValues) return val;
    if (typeof val === "boolean") return val ? "Y" : "N";
    return val;
  };

  const evalContext: Record<string, any> = {};
  // Own keys written so far, grouped by normalized form (step 3 overwrites every key of a group).
  const keysByNormalizedForm = new Map<string, Set<string>>();

  const write = (key: string, value: unknown) => {
    evalContext[key] = value;
    // Assigning `__proto__` calls the prototype setter and creates no own key: never record it.
    if (!Object.prototype.hasOwnProperty.call(evalContext, key)) return;
    const form = normalizedForm(key);
    let group = keysByNormalizedForm.get(form);
    if (!group) {
      group = new Set();
      keysByNormalizedForm.set(form, group);
    }
    group.add(key);
  };

  // 1. Base Context: Start with session/global context
  for (const [key, val] of Object.entries(context)) {
    write(key, normalize(val));
  }

  // 2. Tab-scoped auxiliary inputs (higher priority than session, lower than record values)
  if (auxiliaryInputs) {
    for (const [key, val] of Object.entries(auxiliaryInputs)) {
      const normalizedVal = normalize(val);
      write(key, normalizedVal);
      write(toSnakeKey(key), normalizedVal);
    }
  }

  // 3. Merge & Normalize Values (Current & Parent)
  for (const [key, val] of Object.entries({ ...parentValues, ...values })) {
    const normalizedVal = normalize(val);
    write(key, normalizedVal);

    // Case/underscore-insensitive overwrite of every key written before this one.
    // Guard: do not overwrite an existing non-empty value with an empty one.
    // Session attributes (e.g. PRODUCTTYPE:"") can case-insensitively match real field keys
    // (e.g. productType:"I") and must not corrupt them.
    const sameName = keysByNormalizedForm.get(normalizedForm(key));
    if (sameName) {
      for (const existingKey of sameName) {
        if (existingKey === key) continue;
        if (isEmptyValue(evalContext[existingKey]) || !isEmptyValue(normalizedVal)) {
          evalContext[existingKey] = normalizedVal;
        }
      }
    }

    // 4. Fallback: Auto-generate Snake Case
    if (!key.startsWith("$") && !key.startsWith("#")) {
      write(toSnakeKey(key), normalizedVal);
    }
  }

  // 5. Apply Metadata Mapping
  const mapFields = (schemaFields?: Record<string, Field>, sourceValues?: Record<string, unknown>) => {
    if (!schemaFields || !sourceValues) return;

    for (const field of Object.values(schemaFields)) {
      const dbCol = field.column?.dBColumnName || field.columnName;
      if (dbCol && field.hqlName) {
        const val = sourceValues[field.hqlName];
        if (val !== undefined) {
          const normalized = normalize(val);
          evalContext[dbCol] = normalized;
          evalContext[dbCol.toUpperCase()] = normalized;
        }
      }
    }
  };

  mapFields(parentFields, parentValues);
  mapFields(fields, values);

  // Read indexes, built on first lookup and dropped on any write through the proxy.
  let lookupIndexes: LookupIndexes | null = null;
  const getLookupIndexes = (): LookupIndexes => {
    if (lookupIndexes) return lookupIndexes;
    const byLowercase = new Map<string, string>();
    const byNormalizedForm = new Map<string, string>();
    for (const key of Object.keys(evalContext)) {
      const lower = key.toLowerCase();
      if (!byLowercase.has(lower)) byLowercase.set(lower, key);
      const form = lower.replace(/_/g, "");
      if (!byNormalizedForm.has(form)) byNormalizedForm.set(form, key);
    }
    lookupIndexes = { byLowercase, byNormalizedForm };
    return lookupIndexes;
  };
  const invalidateLookupIndexes = () => {
    lookupIndexes = null;
  };

  const resolveProperty = (target: Record<string, any>, prop: string) => {
    // 1. Exact match (including inherited properties, as before)
    if (prop in target) return target[prop];

    const { byLowercase, byNormalizedForm } = getLookupIndexes();
    const lowerProp = prop.toLowerCase();

    // 2. Case-insensitive match (Priority)
    const caseInsensitiveKey = byLowercase.get(lowerProp);
    if (caseInsensitiveKey !== undefined) return target[caseInsensitiveKey];

    // 3. Loose match (Fallback)
    const looseKey = byNormalizedForm.get(lowerProp.replace(/_/g, ""));
    return looseKey !== undefined ? target[looseKey] : undefined;
  };

  const getFromPrefs = (key: string) => {
    // Window-scoped key first, then the global one — the classic OB.PropertyStore.get resolution.
    // The exact/case-insensitive lookup lives in resolvePreference, shared with the OB shims.
    const value = resolvePreference(key, windowId);
    if (value === undefined) return undefined;
    return normalize(value);
  };
```

Then copy **verbatim** from the oracle (`__mocks__/legacyEvaluationContext.ts`) the two inner helpers that follow `getFromPrefs` there — `checkClearedIdentifier` and `resolvePrefixed`, with their comments — unchanged except for four string
concatenations in `resolvePrefixed`, written as template literals so Biome's `useTemplate` passes (same
strings, no behavior change):

```ts
      const fromContext = resolveProperty(target, `#${original}`) ?? resolveProperty(target, `$${original}`);
```

```ts
      const fromPrefs = getFromPrefs(original) ?? getFromPrefs(`#${original}`) ?? getFromPrefs(`$${original}`);
```

Then finish with:

```ts
  return new Proxy(evalContext, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }

      const val = resolveProperty(target, prop);

      // If the field has an empty identifier, treat as empty (Classic behavior for cleared foreign keys)
      const cleared = checkClearedIdentifier(target, prop, val);
      if (cleared !== undefined) return cleared;

      if (val !== undefined && val !== null) return val;

      // Handle @property@, #property, $property access patterns
      const prefixed = resolvePrefixed(target, prop);
      if (prefixed !== undefined) return prefixed;

      // Fallback to default value, then empty string (matching Classic behavior).
      // In Classic, unresolved context variables always resolve to '' (empty string).
      // parseDynamicExpression replaces OB.Utilities.getValue(obj, prop) with obj["prop"],
      // removing the null->'' conversion that getValue provided. The Proxy must handle it.
      return defaultValue !== undefined ? defaultValue : "";
    },
    has(target, prop) {
      if (typeof prop !== "string") return Reflect.has(target, prop);
      if (prop in target) return true;
      return getLookupIndexes().byLowercase.has(prop.toLowerCase());
    },
    // Writes are not expected, but must stay visible to later reads exactly as before.
    set(target, prop, value, receiver) {
      const ok = Reflect.set(target, prop, value, receiver);
      invalidateLookupIndexes();
      return ok;
    },
    defineProperty(target, prop, descriptor) {
      const ok = Reflect.defineProperty(target, prop, descriptor);
      invalidateLookupIndexes();
      return ok;
    },
    deleteProperty(target, prop) {
      const ok = Reflect.deleteProperty(target, prop);
      invalidateLookupIndexes();
      return ok;
    },
  });
};
```

- [ ] **Step 4: Run the focused, differential and existing tests**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/utils/evaluation packages/MainUI/utils/__tests__/expressions.test.ts packages/MainUI/utils/__tests__/parseDynamicExpression.test.ts`
Expected: all PASS. A differential failure prints the probe that differs: fix the builder, never the oracle.

- [ ] **Step 5: Measure one build (sanity, not a test)**

Add temporarily at the end of the differential test file, run it, then remove it:

```ts
it("timing (temporary)", () => {
  const options = genOptions(mulberry32(1), { session: 470, record: 180, aux: 20, parent: 30 });
  const time = (fn: () => unknown) => { const t = performance.now(); for (let i = 0; i < 20; i++) fn(); return (performance.now() - t) / 20; };
  console.log({ legacyMs: time(() => legacyCreateEvaluationContext(options)), newMs: time(() => buildEvaluationContext(options)) });
});
```

Expected: `newMs` below 0.5 and at least 10x below `legacyMs`. Remove the block before committing.

- [ ] **Step 6: Run the whole MainUI suite**

Run: `env -u NODE_OPTIONS pnpm test:mainui`
Expected: PASS (same failures as on `main`, if any; compare with a run on `main` before treating a failure as new).

- [ ] **Step 7: Lint and commit**

Run: `env -u NODE_OPTIONS pnpm exec biome check --write packages/MainUI/utils/evaluation`
Expected: no errors (the rewrite has no `forEach` and uses template literals; `__mocks__/` is ignored).

```bash
git add packages/MainUI/utils/evaluation
git commit -m "Feature ETP-5641: Make evaluation context build linear

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Build-once helpers

**Files:**
- Create: `packages/MainUI/utils/evaluation/lazyContext.ts`
- Create: `packages/MainUI/utils/evaluation/__tests__/lazyContext.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
/* license header */

import { lazyContext, lazyContextByKey } from "../lazyContext";

describe("lazyContext", () => {
  it("builds on first call and reuses the result", () => {
    const build = jest.fn(() => ({ a: 1 }));
    const get = lazyContext(build);
    expect(build).not.toHaveBeenCalled();
    expect(get()).toBe(get());
    expect(build).toHaveBeenCalledTimes(1);
  });

  it("does not cache a build that throws", () => {
    const build = jest.fn().mockImplementationOnce(() => { throw new Error("boom"); }).mockReturnValue({ a: 1 });
    const get = lazyContext(build);
    expect(() => get()).toThrow("boom");
    expect(get()).toEqual({ a: 1 });
    expect(build).toHaveBeenCalledTimes(2);
  });
});

describe("lazyContextByKey", () => {
  it("builds once per key, lazily", () => {
    const recordA = { id: "A" };
    const recordB = { id: "B" };
    const build = jest.fn((record: { id: string }) => ({ id: record.id }));
    const get = lazyContextByKey(build);
    expect(get(recordA)).toBe(get(recordA));
    get(recordB);
    expect(build).toHaveBeenCalledTimes(2);
  });

  it("does not cache a build that throws", () => {
    const record = { id: "A" };
    const build = jest.fn().mockImplementationOnce(() => { throw new Error("boom"); }).mockReturnValue({ ok: true });
    const get = lazyContextByKey(build);
    expect(() => get(record)).toThrow("boom");
    expect(get(record)).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/utils/evaluation/__tests__/lazyContext.test.ts`
Expected: FAIL, `Cannot find module '../lazyContext'`.

- [ ] **Step 3: Implement**

`packages/MainUI/utils/evaluation/lazyContext.ts`:

```ts
/* license header */

import type { EvaluationContext } from "./buildEvaluationContext";

/**
 * Returns a getter that builds the context on its first call and reuses it afterwards.
 * A build that throws is not cached: the next call tries again, as each caller's fallback expects.
 */
export const lazyContext = (build: () => EvaluationContext): (() => EvaluationContext) => {
  let built: EvaluationContext | undefined;
  return () => {
    if (built === undefined) built = build();
    return built;
  };
};

/** Same as {@link lazyContext}, one context per key object (e.g. one per selected record). */
export const lazyContextByKey = <K extends object>(
  build: (key: K) => EvaluationContext
): ((key: K) => EvaluationContext) => {
  const cache = new Map<K, EvaluationContext>();
  return (key: K) => {
    let built = cache.get(key);
    if (built === undefined) {
      built = build(key);
      cache.set(key, built);
    }
    return built;
  };
};
```

- [ ] **Step 4: Run to see it pass**

Run: same as step 2. Expected: PASS, 4 tests.

(No commit yet: tasks 4–9 form commit 3.)

---

### Task 5: `useEvaluationContext` hook

**Files:**
- Create: `packages/MainUI/hooks/evaluation/useEvaluationContext.ts`
- Create: `packages/MainUI/hooks/evaluation/__tests__/useEvaluationContext.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
/* license header */

import { renderHook } from "@testing-library/react";
import { createSmartContext } from "@/utils/expressions";
import { logger } from "@/utils/logger";
import { useEvaluationContext } from "../useEvaluationContext";

jest.mock("@/utils/expressions", () => {
  const actual = jest.requireActual("@/utils/expressions");
  return { ...actual, createSmartContext: jest.fn(actual.createSmartContext) };
});
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn() } }));

const mockedCreate = createSmartContext as jest.Mock;

describe("useEvaluationContext", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds through createSmartContext with the given options", () => {
    const values = { docStatus: "CO" };
    const { result } = renderHook(() => useEvaluationContext({ values, windowId: "W1" }));
    expect(result.current?.DOCSTATUS).toBe("CO");
    expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ values, windowId: "W1" }));
  });

  it("reuses the context while the inputs are the same objects", () => {
    const values = { a: "1" };
    const { result, rerender } = renderHook(() => useEvaluationContext({ values }));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it("returns null and logs instead of throwing when the build throws", () => {
    mockedCreate.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => useEvaluationContext({ values: { a: "1" } }));
    expect(result.current).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/hooks/evaluation/__tests__/useEvaluationContext.test.ts`
Expected: FAIL, `Cannot find module '../useEvaluationContext'`.

- [ ] **Step 3: Implement**

`packages/MainUI/hooks/evaluation/useEvaluationContext.ts`:

```ts
/* license header */

import { useMemo } from "react";
import { createSmartContext, type EvaluationContext, type EvaluationContextOptions } from "@/utils/expressions";
import { logger } from "@/utils/logger";

/**
 * The evaluation context for display/read-only logic, built once per change of its inputs.
 *
 * Never throws: a failed build returns `null`, and callers apply the same per-field fallback they
 * apply when an expression fails. Calls the builder as `createSmartContext` from `@/utils/expressions`
 * on purpose, so tests that mock that module keep intercepting it.
 *
 * Phase 2 of ETP-5641 replaces the internals with a layered context; the signature stays.
 */
export function useEvaluationContext(options: EvaluationContextOptions): EvaluationContext | null {
  const {
    values,
    fields,
    parentValues,
    parentFields,
    context,
    auxiliaryInputs,
    normalizeValues,
    defaultValue,
    windowId,
  } = options;

  return useMemo(() => {
    try {
      return createSmartContext({
        values,
        fields,
        parentValues,
        parentFields,
        context,
        auxiliaryInputs,
        normalizeValues,
        defaultValue,
        windowId,
      });
    } catch (error) {
      logger.warn("Error building the expression evaluation context:", error);
      return null;
    }
  }, [values, fields, parentValues, parentFields, context, auxiliaryInputs, normalizeValues, defaultValue, windowId]);
}
```

Passing `undefined` for an option the caller omitted is equivalent to omitting it: the builder's defaults (`context = {}`, `normalizeValues = true`) apply to `undefined`.

- [ ] **Step 4: Run to see it pass**

Run: same as step 2. Expected: PASS, 3 tests.

---

### Task 6: `FormHeader` builds the context once per render

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/FormHeader.tsx`
- Create: `packages/MainUI/components/Form/FormView/__tests__/FormHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
/* license header */

import { render, screen } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { createSmartContext } from "@/utils/expressions";
import { FormHeader } from "../FormHeader";

jest.mock("@mui/material", () => ({
  useTheme: () => ({ palette: { baselineColor: { neutral: { 0: "#fff", 80: "#333" } } } }),
}));
// Same object on every call, like react-hook-form between edits, so the hook's memo holds across renders.
const mockFormValues = { docStatus: "CO" };
jest.mock("react-hook-form", () => ({ useFormContext: () => ({ watch: () => mockFormValues }) }));
jest.mock("@/stores/userStore", () => ({ useUserStore: (selector: any) => selector({ session: {} }) }));
jest.mock("@/contexts/tab", () => ({ useTabContext: () => ({ tab: { fields: {}, window: "W1" } }) }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../contexts/FormViewContext", () => ({
  useFormViewContext: () => ({ selectedTab: "", handleTabChange: jest.fn(), getIconForGroup: () => null }),
}));
jest.mock("../StatusBar", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/StatusModal", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/info.svg", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/PrimaryTab", () => ({
  __esModule: true,
  default: ({ tabs }: { tabs: Array<{ id: string; label: string }> }) => (
    <ul>
      {tabs.map((tab) => (
        <li key={tab.id}>{tab.label}</li>
      ))}
    </ul>
  ),
}));
jest.mock("../selectors/BaseSelector", () => ({ compileExpression: jest.fn(() => () => true) }));
jest.mock("@/utils/expressions", () => ({ createSmartContext: jest.fn(() => ({})) }));

const fieldWithLogic = (hqlName: string) =>
  ({ hqlName, displayed: true, displayLogicExpression: "@docStatus@ = 'CO'" }) as unknown as Field;

const sectionOf = (name: string, count: number): [string, { identifier: string; fields: Record<string, Field> }] => [
  name,
  {
    identifier: name,
    fields: Object.fromEntries(Array.from({ length: count }, (_, i) => [`${name}${i}`, fieldWithLogic(`${name}${i}`)])),
  },
];

const renderHeader = () =>
  render(
    <FormHeader
      statusBarFields={{}}
      groups={[sectionOf("Main", 3), sectionOf("Dimensions", 3)]}
      statusModal={{ open: false } as any}
      hideStatusModal={jest.fn()}
    />
  );

describe("FormHeader section tabs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds the evaluation context once per render, not once per field", () => {
    renderHeader();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
    // 6 fields with display logic: the old code built 2+ contexts (one per field evaluated).
    expect(createSmartContext).toHaveBeenCalledTimes(1);
  });

  it("still shows the sections when the context build throws", () => {
    (createSmartContext as jest.Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    renderHeader();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
  });
});
```

Note: `.some` stops at the first visible field, so the old code built one context per section here (2 in total); the new code builds 1.

- [ ] **Step 2: Run to see it fail**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/components/Form/FormView/__tests__/FormHeader.test.tsx`
Expected: FAIL on `toHaveBeenCalledTimes(1)` (received 2). If it fails for another reason (an unmocked import), add the missing `jest.mock` and re-run until only that assertion fails.

- [ ] **Step 3: Implement**

In `packages/MainUI/components/Form/FormView/FormHeader.tsx`:

1. Add the import next to the other `@/` imports:

```ts
import { useEvaluationContext } from "@/hooks/evaluation/useEvaluationContext";
```

2. Remove `import { createSmartContext } from "@/utils/expressions";`.
3. Right after `const formData = watch();` add:

```ts
  const evaluationContext = useEvaluationContext({
    values: formData,
    fields: tab?.fields,
    context: session,
    windowId: tab?.window,
  });
```

4. Replace the inner `.some` callback body and the `useMemo` dependency list of `tabs` with:

```ts
        return Object.values(group.fields).some((field) => {
          if (!field.displayed) return false;
          if (!field.displayLogicExpression) return true;
          const compiledExpr = compileExpression(field.displayLogicExpression);
          try {
            // A failed context build shows the section, like a failed expression always has.
            if (!evaluationContext) return true;
            return compiledExpr(evaluationContext, evaluationContext, tab?.window);
          } catch {
            return true;
          }
        });
```

```ts
  }, [groups, evaluationContext, tab?.window, getIconForGroup, theme.palette.baselineColor.neutral, t]);
```

- [ ] **Step 4: Run to see it pass**

Run: same as step 2. Expected: PASS, 2 tests.

---

### Task 7: `FormFieldsContent` builds the context once per render

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx`
- Modify: `packages/MainUI/components/Form/FormView/__tests__/FormFieldsContent.test.tsx`

- [ ] **Step 1: Add the failing tests**

The component renders twice on mount (its effect runs `setHasLoadedOnce(true)`), and the context's
memo depends on `values` and `session`. Both must be the same objects across renders, as they are in
the app between edits.

First, make the file's `userStore` mock return a stable session. Replace:

```ts
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: any) => selector({ session: {} }),
}));
```

with:

```ts
const mockSession = {};
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: any) => selector({ session: mockSession }),
}));
```

Then add to the imports:

```ts
import { useFormContext } from "react-hook-form";
import { createSmartContext } from "@/utils/expressions";
```

and append at the end of the file:

```tsx
describe("FormFields — expression evaluation context", () => {
  // The module mock's watch() returns a new object per call; here it returns the same one, like
  // react-hook-form between edits, so the mount re-render (setHasLoadedOnce) reuses the context.
  const stableFormValues = { a: "Y" };
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({ watch: jest.fn(() => stableFormValues) });
  });

  const withLogic = (hqlName: string) => makeField({ hqlName, displayLogicExpression: "@a@ = 'Y'" } as any);
  const groups = [
    ["main", { identifier: "Main", fields: { f1: withLogic("f1"), f2: withLogic("f2") } }],
    ["more", { identifier: "More", fields: { f3: withLogic("f3"), f4: withLogic("f4") } }],
  ] as typeof baseProps.groups;

  it("builds the evaluation context once per render, not once per section", () => {
    render(<FormFields {...baseProps} groups={groups} mode={FormMode.EDIT} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
    expect(createSmartContext).toHaveBeenCalledTimes(1);
  });

  it("still shows the sections when the context build throws", () => {
    (createSmartContext as jest.Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    render(<FormFields {...baseProps} groups={groups} mode={FormMode.EDIT} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });
});
```

With stable form values the new code builds exactly one context however many times the component renders; the old code builds one per section per render (at least 2). `mockReturnValue` persists after this `describe`; if an earlier `describe` in the file relies on the module-level `watch` mock, keep this block last (it is appended at the end).

- [ ] **Step 2: Run to see it fail**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/components/Form/FormView/__tests__/FormFieldsContent.test.tsx`
Expected: the first new test FAILS (received 2 or more calls); the existing tests PASS.

- [ ] **Step 3: Implement**

In `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx`:

1. Replace `import { createSmartContext } from "@/utils/expressions";` with:

```ts
import { useEvaluationContext } from "@/hooks/evaluation/useEvaluationContext";
```

2. Right after `const formData = watch();` (line 83), before any early return, add:

```ts
  // Built once per render and shared by every section's visibility check below.
  // Must stay above the `loading` early return (rules of hooks).
  const sectionContext = useEvaluationContext({
    values: formData,
    fields: tab.fields,
    context: session,
    windowId: tab.window,
  });
```

3. In `hasVisibleFields`, replace the `try` block body:

```ts
          try {
            // Use SmartContext to normalize boolean values (false → 'N', true → 'Y') so that
            // displayLogicExpressions comparing against 'N'/'Y' (after parseDynamicExpression
            // transforms === false → === 'N') evaluate correctly against raw RHF form data.
            // A failed context build shows the section, like a failed expression always has.
            if (!sectionContext) return true;
            return compiledExpr(sectionContext, sectionContext, tab.window);
          } catch (error) {
            console.warn("Error executing expression:", field.displayLogicExpression, error);
            return true;
          }
```

- [ ] **Step 4: Run to see it pass**

Run: same as step 2. Expected: all PASS.

---

### Task 8: `useToolbar` builds one context per selected record

**Files:**
- Modify: `packages/MainUI/hooks/Toolbar/useToolbar.ts:135-177`

The build-once behavior is covered by `lazyContextByKey`'s tests (task 4); the existing `useToolbar` tests cover the results.

- [ ] **Step 1: Implement**

1. Add the import:

```ts
import { lazyContextByKey } from "@/utils/evaluation/lazyContext";
```

2. In the `processButtons` `useMemo`, right after `const buttons = Object.values(actionFields) || [];`, add:

```ts
    // One context per selected record, built the first time a button needs it and shared by the
    // rest. Built inside each button's try below, so a failed build keeps that button's fallback.
    const contextForRecord = lazyContextByKey((record: Record<string, unknown>) =>
      createSmartContext({
        values: { ...record, ...formValues },
        fields: tab.fields,
        auxiliaryInputs: effectiveAuxInputs,
        parentValues: parentRecord || undefined,
        parentFields: parentTab?.fields,
        context: session,
        defaultValue: "",
        windowId: tab.window,
      })
    );
```

3. Replace the `checkRecord` definition with:

```ts
        const checkRecord = (record: Record<string, unknown>) => {
          const smartContext = contextForRecord(record);
          return toClassicBoolean(compiledExpr(smartContext, smartContext, tab.window));
        };
```

Dependencies of the `useMemo` do not change (it already lists every input of the build).

- [ ] **Step 2: Run the toolbar tests**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/hooks/Toolbar`
Expected: PASS.

---

### Task 9: `useFormValidation` builds one context per validation pass

**Files:**
- Modify: `packages/MainUI/hooks/useFormValidation.ts:85-110` and `:248-271`
- Create: `packages/MainUI/hooks/__tests__/useFormValidation.evaluationContext.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
/* license header */

import type React from "react";
import { renderHook } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { createSmartContext } from "@/utils/expressions";
import { useFormValidation } from "../useFormValidation";

jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn(() => () => true),
}));
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: any) => any) => selector({ session: {} }),
}));
jest.mock("@/utils/expressions", () => {
  const actual = jest.requireActual("@/utils/expressions");
  return { ...actual, createSmartContext: jest.fn(actual.createSmartContext) };
});

const mockedCreate = createSmartContext as jest.Mock;

const requiredWithLogic = (hqlName: string) =>
  ({
    hqlName,
    name: hqlName,
    isMandatory: true,
    displayed: true,
    isReadOnly: false,
    column: { reference: "10" },
    displayLogicExpression: "@a@ = 'Y'",
  }) as unknown as Field;

const tab = {
  id: "t1",
  window: "W1",
  fields: { f1: requiredWithLogic("f1"), f2: requiredWithLogic("f2"), f3: requiredWithLogic("f3") },
} as unknown as Tab;

const wrapperWith =
  (defaultValues: Record<string, unknown>) =>
  ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

describe("useFormValidation — evaluation context", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds one context per validation pass, not one per required field", () => {
    const { result } = renderHook(() => useFormValidation(tab), {
      wrapper: wrapperWith({ f1: "x", f2: "y", f3: "z" }),
    });
    result.current.validateRequiredFields();
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it("builds no context while the form has no values", () => {
    const { result } = renderHook(() => useFormValidation(tab), { wrapper: wrapperWith({}) });
    result.current.validateRequiredFields();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("falls back per field and retries when a build throws", () => {
    mockedCreate.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => useFormValidation(tab), {
      wrapper: wrapperWith({ f1: "x", f2: "y", f3: "z" }),
    });
    expect(() => result.current.validateRequiredFields()).not.toThrow();
    expect(mockedCreate).toHaveBeenCalledTimes(2);
  });

  it("isFieldDisplayed without a getter still builds its own context", () => {
    const { result } = renderHook(() => useFormValidation(tab), {
      wrapper: wrapperWith({ f1: "x" }),
    });
    expect(result.current.isFieldDisplayed(requiredWithLogic("f1"))).toBe(true);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/hooks/__tests__/useFormValidation.evaluationContext.test.tsx`
Expected: FAIL on the first test (received 3 calls) and on the third (received 3); the other two PASS.

- [ ] **Step 3: Implement**

In `packages/MainUI/hooks/useFormValidation.ts`:

1. Add imports:

```ts
import type { EvaluationContext } from "@/utils/expressions";
import { lazyContext } from "@/utils/evaluation/lazyContext";
```

2. Replace `isFieldDisplayed` with:

```ts
  const isFieldDisplayed = useCallback(
    (field: Field, getContext?: () => EvaluationContext): boolean => {
      if (!field.displayLogicExpression) {
        return field.displayed;
      }

      try {
        const currentValues = getValues();
        if (!currentValues || Object.keys(currentValues).length === 0) {
          return field.displayed; // Default to displayed while form loads
        }

        const compiledExpression = compileExpression(field.displayLogicExpression);
        // A validation pass shares one context across fields; standalone calls build their own.
        const ctx = getContext
          ? getContext()
          : createSmartContext({
              values: currentValues,
              fields: tab?.fields,
              context: session,
              windowId: tab?.window,
            });
        return compiledExpression(ctx, ctx, tab?.window);
      } catch (error) {
        logger.warn(`Error evaluating display logic for field ${field.hqlName}:`, error);
        return field.displayed; // Default to displayed on error
      }
    },
    [getValues, session, tab]
  );
```

3. In `validateRequiredFields`, right after `const formValues = getValues();`, add:

```ts
    // Built on the first field that needs it, inside isFieldDisplayed's try; a failed build is retried.
    const getContext = lazyContext(() =>
      createSmartContext({ values: formValues, fields: tab?.fields, context: session, windowId: tab?.window })
    );
```

change `if (!isFieldDisplayed(field)) {` to `if (!isFieldDisplayed(field, getContext)) {`, and the dependency list to:

```ts
  }, [requiredFields, getValues, isFieldDisplayed, validateField, tab, session]);
```

- [ ] **Step 4: Run the new and existing validation tests**

Run: `env -u NODE_OPTIONS pnpm jest --selectProjects MainUI packages/MainUI/hooks/__tests__/useFormValidation`
Expected: PASS (both files).

- [ ] **Step 5: Run the whole MainUI suite, lint and commit (commit 3)**

```bash
env -u NODE_OPTIONS pnpm test:mainui
env -u NODE_OPTIONS pnpm exec biome check --write \
  packages/MainUI/utils/evaluation packages/MainUI/hooks/evaluation \
  packages/MainUI/components/Form/FormView/FormHeader.tsx packages/MainUI/components/Form/FormView/FormFieldsContent.tsx \
  packages/MainUI/components/Form/FormView/__tests__/FormHeader.test.tsx \
  packages/MainUI/components/Form/FormView/__tests__/FormFieldsContent.test.tsx \
  packages/MainUI/hooks/Toolbar/useToolbar.ts packages/MainUI/hooks/useFormValidation.ts \
  packages/MainUI/hooks/__tests__/useFormValidation.evaluationContext.test.tsx
git add packages/MainUI/utils/evaluation/lazyContext.ts packages/MainUI/utils/evaluation/__tests__/lazyContext.test.ts \
  packages/MainUI/hooks/evaluation \
  packages/MainUI/components/Form/FormView/FormHeader.tsx packages/MainUI/components/Form/FormView/FormFieldsContent.tsx \
  packages/MainUI/components/Form/FormView/__tests__/FormHeader.test.tsx \
  packages/MainUI/components/Form/FormView/__tests__/FormFieldsContent.test.tsx \
  packages/MainUI/hooks/Toolbar/useToolbar.ts packages/MainUI/hooks/useFormValidation.ts \
  packages/MainUI/hooks/__tests__/useFormValidation.evaluationContext.test.tsx
git commit -m "Feature ETP-5641: Build evaluation context once per render in forms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: the suite PASSES; `git status --short` afterwards still shows the three unrelated files as modified and unstaged.

---

### Task 10: Acceptance measurement

No commit unless a regression must be fixed. Requires the local Etendo Classic running on `http://localhost:8080/etendo` (backend of the new UI).

- [ ] **Step 1: Production build and start**

```bash
cd packages/MainUI
env -u NODE_OPTIONS pnpm build
env -u NODE_OPTIONS npx next start -p 3100   # in the background; wait for http://localhost:3100/api/health = 200
```

- [ ] **Step 2: Run the benchmark at 4x CPU**

```bash
cd playwright-tests
env -u NODE_OPTIONS BASE_URL=http://localhost:3100 LABEL=etp5641-phase1-cpu4x CPU_THROTTLE=4 RUNS=3 node perf/bench.mjs
env -u NODE_OPTIONS node perf/compare.mjs perf/results/local-react-cpu4x-2026-10-01T19-32-25-746Z.json perf/results/etp5641-phase1-cpu4x-*.json
```

Keep the machine otherwise idle while it runs (other heavy processes distort the numbers).

- [ ] **Step 3: Check the acceptance criteria (spec section 8)**

- `Sales Invoice / open-record` `visibleMs` < 5000.
- Sum of `blockingMs` of `open-record` over the four windows: at least 80% lower than the baseline.
- No other step's `settledMs` more than 10% worse than the baseline.

If they hold, record the numbers in the PR description. If `open-record` misses the target, run once more with `PROFILE=1` and `node perf/hotspots.mjs perf/results/profiles/<LABEL>` (build with `SOURCE_MAPS=true pnpm build` first) and report what remains on top before changing anything.
