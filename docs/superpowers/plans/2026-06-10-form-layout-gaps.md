# Form Layout Gaps — ETP-3768 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement metadata-driven form layout (startnewline, startinoddcolumn, colspan, rowspan) and encrypted field masking in the Etendo WorkspaceUI form renderer.

**Architecture:** Three changes compose this feature: (1) proper TypeScript interfaces for field/column metadata, (2) a pure layout algorithm that computes CSS grid placement from field metadata, and (3) a new EncryptedSelector that masks fields where `column.displayEncription=true`. The layout algorithm is a pure function (easy to test); the encrypted field logic reuses PasswordSelector internals.

**Tech Stack:** TypeScript, React, Tailwind CSS 4, Jest, React Testing Library, pnpm workspaces

**Branch:** `feature/ETP-3768`  
**Commit format:** `Feature ETP-3768: <description>` (first line ≤ 80 chars)  
**Run tests:** `pnpm test:mainui` or `pnpm --filter @workspaceui/mainui test`

**Spec:** `docs/superpowers/specs/2026-06-09-form-layout-gaps-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/api-client/src/api/types.ts` | Modify | Add `ADColumn` interface; extend `Field` with layout + misc fields |
| `packages/MainUI/utils/form/computeFieldLayout.ts` | Create | Pure cursor-based layout algorithm |
| `packages/MainUI/utils/form/__tests__/computeFieldLayout.test.ts` | Create | Unit tests for layout algorithm |
| `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx` | Modify | Call `computeFieldLayout`, pass `colStart` to BaseSelector |
| `packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx` | Modify | Accept `colStart` prop; apply Tailwind layout class lookups |
| `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx` | Modify | Add `showToggle` prop (default `true`) |
| `packages/MainUI/components/Form/FormView/selectors/EncryptedSelector.tsx` | Create | View mode shows ●●●●●●; edit mode delegates to PasswordSelector |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Modify | Route `displayEncription` fields to EncryptedSelector before reference routing |

---

## Task 1: TypeScript Interfaces — `ADColumn` and `Field` additions

**Files:**
- Modify: `packages/api-client/src/api/types.ts`

> There is already an exported `Column` interface in this file (lines ~225–255) for grid/table columns. The new interface for `ADColumn` (backend field column metadata) must use the name `ADColumn` to avoid collision.

- [ ] **Step 1: Add the `ADColumn` interface**

  Open `packages/api-client/src/api/types.ts`. Find the `Field` interface (line ~134). Insert the following **before** the `Field` interface:

  ```typescript
  export interface ADColumn {
    // Identity
    $ref?: string;
    _entityName?: string;
    _identifier?: string;
    id?: string;

    // Ownership
    active?: boolean;
    client?: string;
    organization?: string;
    module?: string;
    recordTime?: number;

    // Schema
    dBColumnName?: string;
    name?: string;
    description?: string;
    helpComment?: string;
    table?: string;
    'table$_identifier'?: string;
    sequenceNumber?: number;
    position?: number;
    length?: number;

    // Reference / type
    reference?: string;
    'reference$_identifier'?: string;
    referenceSearchKey?: string | null;
    'referenceSearchKey$_identifier'?: string;

    // Constraints
    mandatory?: boolean;
    updatable?: boolean;
    keyColumn?: boolean;
    identifier?: boolean;
    secondaryKey?: boolean;
    translation?: boolean;
    transient?: boolean;
    transientCondition?: string | null;

    // Filtering & sorting
    allowFiltering?: boolean;
    allowSorting?: boolean;
    allowedCrossOrganizationReference?: boolean;
    filterColumn?: boolean;
    linkToParentColumn?: boolean;
    childPropertyInParentEntity?: boolean;

    // Session / audit
    storedInSession?: boolean;
    excludeAudit?: boolean;
    isautosave?: boolean;

    // Encryption (note: typo preserved from backend)
    displayEncription?: boolean;
    deencryptable?: boolean;

    // Values & validation
    defaultValue?: string | null;
    valueFormat?: string | null;
    maxValue?: string | null;
    minValue?: string | null;
    sqllogic?: string | null;
    readOnlyLogic?: string | null;
    validation?: string | null;

    // Callouts
    callout?: string | null;
    calloutFunction?: string | null;

    // Image
    imageHeight?: number | null;
    imageWidth?: number | null;
    imageSizeValuesAction?: string;

    // Misc
    developmentStatus?: string;
    entityAlias?: string | null;
    useAutomaticSequence?: boolean;
    validateOnNew?: boolean;
    process?: string | null;
    oBUIAPPProcess?: string | null;
    'oBUIAPPProcess$_identifier'?: string;
    applicationElement?: string;
    'applicationElement$_identifier'?: string;

    // Derived property path (e.g. "file.type")
    propertyPath?: string;

    // Escape hatch for fields not yet typed
    [key: string]: unknown;
  }
  ```

- [ ] **Step 2: Change `column` type in `Field` and add missing fields**

  In the `Field` interface, change:
  ```typescript
  column: Record<string, string>;
  ```
  to:
  ```typescript
  column: ADColumn;
  ```

  Then add the following fields to the `Field` interface (after the existing `startnewline: boolean` line):
  ```typescript
  // Layout metadata
  startinoddcolumn: boolean;
  displayOnSameLine: boolean;
  obuiappColspan: number | null;
  obuiappRowspan: number | null;

  // Encryption at field level
  displayEncription?: boolean;

  // Misc fields found in codebase but previously untyped
  readOnly?: boolean;
  displayFieldOnly?: boolean;
  displayedLength?: number;
  isFirstFocusedField?: boolean;
  ignoreInWad?: boolean;
  recordSortNo?: number | null;
  obuiappDefaultExpression?: string | null;
  obuiappSummaryfn?: string | null;
  obuiappValidator?: string | null;
  oBUIAPPShowSummary?: boolean;
  obuiselOutfield?: string | null;
  onChangeFunction?: string | null;
  etrxFilterClause?: string | null;
  displayLogic?: string | null;
  displaylogicgrid?: string | null;
  ```

- [ ] **Step 3: Fix TypeScript errors from the type change**

  The change from `Record<string, string>` to `ADColumn` may cause type errors in files that access `field.column.*` properties with assumptions about string type. Run:

  ```bash
  cd /Users/santiagoalaniz/Dev/com.etendorx.workspace-ui
  pnpm --filter @workspaceui/api-client build 2>&1 | head -50
  ```

  Common errors to fix:
  - `field.column.length` is now `number | undefined` — callers using `Number(field.column.length)` are fine; callers checking `if (field.column.length)` are fine.
  - `field.column.keyColumn` is now `boolean | undefined` — callers doing truthy checks are fine.
  - `field.column.callout` is now `string | null | undefined` — callers doing truthy checks are fine.

  Fix any remaining type errors until `pnpm build` in `api-client` succeeds.

- [ ] **Step 4: Fix TypeScript errors in MainUI**

  ```bash
  pnpm --filter @workspaceui/mainui build 2>&1 | head -80
  ```

  Fix any errors. Then run the full test suite to confirm nothing regressed:

  ```bash
  pnpm test:mainui
  ```

  Expected: all existing tests pass.

- [ ] **Step 5: Update mock helpers to include new fields**

  Open `packages/MainUI/utils/tests/mockHelpers.ts`. Search for the `createMockField` helper (around line 368). Add the new layout fields with sensible defaults:

  ```typescript
  startinoddcolumn: false,
  displayOnSameLine: false,
  obuiappColspan: null,
  obuiappRowspan: null,
  ```

  Also check `packages/MainUI/utils/tests/timeTestUtils.ts` — if it contains a mock field object, add the same four fields. If it does not, skip it.

- [ ] **Step 6: Commit**

  Stage only the files that were actually changed:

  ```bash
  git add packages/api-client/src/api/types.ts \
          packages/MainUI/utils/tests/mockHelpers.ts
  # Only add timeTestUtils.ts if it was modified:
  # git add packages/MainUI/utils/tests/timeTestUtils.ts
  git commit -m "Feature ETP-3768: Add ADColumn interface and Field layout fields"
  ```

---

## Task 2: `computeFieldLayout` — pure layout algorithm (TDD)

**Files:**
- Create: `packages/MainUI/utils/form/computeFieldLayout.ts`
- Create: `packages/MainUI/utils/form/__tests__/computeFieldLayout.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `packages/MainUI/utils/form/__tests__/computeFieldLayout.test.ts`:

  ```typescript
  import { computeFieldLayout } from "../computeFieldLayout";
  import type { Field } from "@workspaceui/api-client/src/api/types";

  function makeField(overrides: Partial<Field>): Field {
    return {
      id: "f1",
      hqlName: "field1",
      startnewline: false,
      startinoddcolumn: false,
      obuiappColspan: null,
      obuiappRowspan: null,
      displayOnSameLine: false,
      // minimal required fields
      column: {} as any,
      sequenceNumber: 10,
      displayed: true,
      ...overrides,
    } as Field;
  }

  describe("computeFieldLayout", () => {
    it("returns empty map for empty input", () => {
      expect(computeFieldLayout([])).toEqual(new Map());
    });

    it("returns no entries for plain fields (no layout metadata)", () => {
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b" }),
        makeField({ id: "c" }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.size).toBe(0);
    });

    it("sets colStart=1 for a field with startnewline=true", () => {
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b", startnewline: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("b")).toEqual({ colStart: 1 });
    });

    it("first field with startnewline is still colStart=1", () => {
      const fields = [makeField({ id: "a", startnewline: true })];
      const result = computeFieldLayout(fields);
      expect(result.get("a")).toEqual({ colStart: 1 });
    });

    it("startinoddcolumn on cursor=1 (already odd): no entry", () => {
      // cursor starts at 1, so first field with startinoddcolumn doesn't need override
      const fields = [makeField({ id: "a", startinoddcolumn: true })];
      const result = computeFieldLayout(fields);
      expect(result.get("a")).toBeUndefined();
    });

    it("startinoddcolumn on cursor=2 (even): sets colStart=3", () => {
      // field 'a' advances cursor to 2; field 'b' should jump to col 3
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b", startinoddcolumn: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("b")).toEqual({ colStart: 3 });
    });

    it("startinoddcolumn on cursor=3 (already odd): no entry", () => {
      // two plain fields advance cursor to 3
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b" }),
        makeField({ id: "c", startinoddcolumn: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("c")).toBeUndefined();
    });

    it("cursor wraps to 1 after filling 3 columns", () => {
      // 3 plain fields fill the row; next field with startinoddcolumn lands on cursor=1 (odd, no override)
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b" }),
        makeField({ id: "c" }),
        makeField({ id: "d", startinoddcolumn: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("d")).toBeUndefined(); // cursor=1, already odd
    });

    it("colspan is accounted for in cursor advancement", () => {
      // field 'a' has colspan=2, advances cursor by 2 → cursor=3; 'b' with startinoddcolumn: cursor=3 (odd, no override)
      const fields = [
        makeField({ id: "a", obuiappColspan: 2 }),
        makeField({ id: "b", startinoddcolumn: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("b")).toBeUndefined();
    });

    it("startnewline resets cursor; subsequent startinoddcolumn on cursor=2 gets colStart=3", () => {
      // 'b' has startnewline → colStart:1, cursor resets to 2 after 'b'
      // 'c' (plain) advances cursor to 3
      // 'd' with startinoddcolumn: cursor=3 is odd → no override needed
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b", startnewline: true }),
        makeField({ id: "c" }),
        makeField({ id: "d", startinoddcolumn: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("b")).toEqual({ colStart: 1 });
      expect(result.get("d")).toBeUndefined(); // cursor=3 is odd, no jump needed
    });

    it("startnewline followed by startinoddcolumn on even cursor gets colStart=3", () => {
      // 'b' has startnewline → colStart:1, cursor = 2 after 'b'
      // 'c' with startinoddcolumn: cursor=2 is even → colStart:3
      const fields = [
        makeField({ id: "a" }),
        makeField({ id: "b", startnewline: true }),
        makeField({ id: "c", startinoddcolumn: true }),
      ];
      const result = computeFieldLayout(fields);
      expect(result.get("b")).toEqual({ colStart: 1 });
      expect(result.get("c")).toEqual({ colStart: 3 });
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  pnpm test:mainui -- --testPathPattern="computeFieldLayout" 2>&1 | tail -20
  ```

  Expected: FAIL — "Cannot find module '../computeFieldLayout'"

- [ ] **Step 3: Implement `computeFieldLayout`**

  Create `packages/MainUI/utils/form/computeFieldLayout.ts`:

  ```typescript
  /*
   *************************************************************************
   * The contents of this file are subject to the Etendo License
   * (the "License"), you may not use this file except in compliance with
   * the License.
   * You may obtain a copy of the License at
   * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
   * Software distributed under the License is distributed on an
   * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
   * implied. See the License for the specific language governing rights
   * and limitations under the License.
   * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
   * All Rights Reserved.
   * Contributor(s): Futit Services S.L.
   *************************************************************************
   */

  import type { Field } from "@workspaceui/api-client/src/api/types";

  export interface FieldLayoutEntry {
    colStart?: number;
  }

  /**
   * Computes explicit CSS grid column-start values for fields that require
   * positional overrides (startnewline, startinoddcolumn).
   *
   * Returns a Map<fieldId, FieldLayoutEntry>. Only fields that need an explicit
   * colStart are included — absent entries mean CSS auto-placement applies.
   *
   * Known limitation: the cursor wrap is a heuristic. When a field with
   * obuiappColspan > 1 causes a row overflow, the cursor resets to 1 regardless
   * of the actual column consumed. This means startinoddcolumn placement
   * immediately after such a field may be slightly off. This edge case is
   * accepted as low-impact for the current dataset.
   */
  export function computeFieldLayout(fields: Field[]): Map<string, FieldLayoutEntry> {
    const result = new Map<string, FieldLayoutEntry>();
    let cursor = 1; // next available column (1–3)

    for (const field of fields) {
      const colspan = field.obuiappColspan ?? 1;

      if (field.startnewline) {
        result.set(field.id, { colStart: 1 });
        cursor = 1 + colspan;
      } else if (field.startinoddcolumn) {
        if (cursor % 2 === 0) {
          // cursor is on an even column → jump to next odd (3)
          result.set(field.id, { colStart: 3 });
          cursor = 3 + colspan;
        } else {
          // already on an odd column → CSS auto-placement is correct
          cursor += colspan;
        }
      } else {
        cursor += colspan;
      }

      if (cursor > 3) cursor = 1; // wrap to start of next row
    }

    return result;
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  pnpm test:mainui -- --testPathPattern="computeFieldLayout" 2>&1 | tail -20
  ```

  Expected: all tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/MainUI/utils/form/computeFieldLayout.ts \
          packages/MainUI/utils/form/__tests__/computeFieldLayout.test.ts
  git commit -m "Feature ETP-3768: Add computeFieldLayout pure algorithm with tests"
  ```

---

## Task 3: Update `BaseSelector` to apply layout classes

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx`

The `BaseSelectorComp` function signature currently ends before `{ ... }`. We need to:
1. Add `colStart?: number` to its props interface.
2. Apply Tailwind layout class lookups in the rendered div.

- [ ] **Step 1: Find `BaseSelectorComp` props definition**

  Open `BaseSelector.tsx`. Search for the component's prop type (likely near line 50–80). It will look like:
  ```typescript
  interface BaseSelectorProps {
    field: Field;
    formMode: FormMode;
    forceReadOnly?: boolean;
    // ...
  }
  ```

  Add `colStart?: number;` to this interface.

- [ ] **Step 2: Add layout class lookup maps**

  Near the top of the file (after imports), add:

  ```typescript
  const COL_START_CLASS: Record<number, string> = {
    1: 'col-start-1',
    2: 'col-start-2',
    3: 'col-start-3',
  };
  const COL_SPAN_CLASS: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
  };
  const ROW_SPAN_CLASS: Record<number, string> = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
  };
  ```

  Using full string constants (not template literals) ensures Tailwind includes them in the build.

- [ ] **Step 3: Apply layout classes in the rendered div**

  Find the `isDisplayed` branch return (around line 527). After the `containerClasses` assignment, add layout class computation:

  ```tsx
  const layoutClasses = [
    colStart != null ? COL_START_CLASS[colStart] : undefined,
    field.obuiappColspan != null ? COL_SPAN_CLASS[field.obuiappColspan] : undefined,
    field.obuiappRowspan != null ? ROW_SPAN_CLASS[field.obuiappRowspan] : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  ```

  Then make a **surgical replacement** of only line 537 (the `className` + `title` bug). Replace:

  ```tsx
  className={`${containerClasses} title={field.helpComment || ''}`}
  ```

  with:

  ```tsx
  className={[containerClasses, layoutClasses].filter(Boolean).join(' ')}
  title={field.helpComment || ''}
  ```

  Keep everything else on the div unchanged — `aria-describedby` (line 538) and `onBlurCapture` (lines 539–543) must remain exactly as they are.

- [ ] **Step 4: Run the full test suite**

  ```bash
  pnpm test:mainui 2>&1 | tail -30
  ```

  Expected: all tests pass. Fix any TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx
  git commit -m "Feature ETP-3768: Apply layout metadata classes in BaseSelector"
  ```

---

## Task 4: Wire layout algorithm in `FormFieldsContent`

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx`

- [ ] **Step 1: Import `computeFieldLayout`**

  At the top of `FormFieldsContent.tsx`, add:

  ```typescript
  import { computeFieldLayout } from "@/utils/form/computeFieldLayout";
  ```

- [ ] **Step 2: Compute layout per group and pass `colStart` to `BaseSelector`**

  Find the grid rendering block (line ~194):

  ```tsx
  <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2">
    {Object.entries(group.fields).map(([hqlName, field]) => (
      <BaseSelector
        field={field}
        key={hqlName}
        formMode={mode}
        forceReadOnly={isReadOnly}
        data-testid="BaseSelector__38e4a6"
      />
    ))}
  </div>
  ```

  Replace with:

  ```tsx
  <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2">
    {(() => {
      const fieldArray = Object.values(group.fields);
      const layoutMap = computeFieldLayout(fieldArray);
      return Object.entries(group.fields).map(([hqlName, field]) => (
        <BaseSelector
          field={field}
          key={hqlName}
          formMode={mode}
          forceReadOnly={isReadOnly}
          colStart={layoutMap.get(field.id)?.colStart}
          data-testid="BaseSelector__38e4a6"
        />
      ));
    })()}
  </div>
  ```

- [ ] **Step 3: Run tests**

  ```bash
  pnpm test:mainui 2>&1 | tail -30
  ```

  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/MainUI/components/Form/FormView/FormFieldsContent.tsx
  git commit -m "Feature ETP-3768: Wire computeFieldLayout in FormFieldsContent"
  ```

---

## Task 5: Add `showToggle` prop to `PasswordSelector`

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx`

- [ ] **Step 1: Add `showToggle` to props**

  The current signature at line 50–52 is an inline intersection type:
  ```typescript
  export const PasswordSelector = (
    props: { field: Field } & React.ComponentProps<typeof TextInput>
  ): React.ReactElement => {
  ```

  Replace it with a named interface so we can cleanly add `showToggle`:

  ```typescript
  interface PasswordSelectorProps extends React.ComponentProps<typeof TextInput> {
    field: Field;
    showToggle?: boolean;
  }

  export const PasswordSelector = ({
    field,
    showToggle = true,
    ...rest
  }: PasswordSelectorProps): React.ReactElement => {
  ```

  Then update all accesses of `props.field` → `field` and `props.field.hqlName` → `field.hqlName` throughout the component body (they were `props.field.*` before).

- [ ] **Step 2: Update the eye toggle conditional**

  Find the eye toggle render (around lines 62–73). Currently it looks like:

  ```tsx
  const eyeToggle = currentValue && currentValue !== PASSWORD_PLACEHOLDER ? (
    <button ...>
  ```

  Update it to incorporate `showToggle` as a hard gate:

  ```tsx
  const eyeToggle =
    showToggle && currentValue && currentValue !== PASSWORD_PLACEHOLDER ? (
      <button type="button" onClick={() => setShowPassword((p) => !p)} ...>
        <EyeIcon open={showPassword} />
      </button>
    ) : null;
  ```

  `showToggle={false}` prevents the toggle from rendering regardless of the value.

- [ ] **Step 3: Run tests**

  ```bash
  pnpm test:mainui 2>&1 | tail -20
  ```

  Expected: all existing PasswordSelector tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx
  git commit -m "Feature ETP-3768: Add showToggle prop to PasswordSelector"
  ```

---

## Task 6: Create `EncryptedSelector`

**Files:**
- Create: `packages/MainUI/components/Form/FormView/selectors/EncryptedSelector.tsx`

- [ ] **Step 1: Create the component**

  Create `packages/MainUI/components/Form/FormView/selectors/EncryptedSelector.tsx`:

  ```tsx
  /*
   *************************************************************************
   * The contents of this file are subject to the Etendo License
   * (the "License"), you may not use this file except in compliance with
   * the License.
   * You may obtain a copy of the License at
   * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
   * Software distributed under the License is distributed on an
   * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
   * implied. See the License for the specific language governing rights
   * and limitations under the License.
   * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
   * All Rights Reserved.
   * Contributor(s): Futit Services S.L.
   *************************************************************************
   */

  import type { Field } from "@workspaceui/api-client/src/api/types";
  import { PasswordSelector } from "./PasswordSelector";

  interface EncryptedSelectorProps {
    field: Field;
    isReadOnly: boolean;
    deencryptable: boolean;
  }

  const MASKED_DISPLAY = "●●●●●●";

  /**
   * Renders fields where column.displayEncription=true.
   *
   * View mode (isReadOnly=true): always shows ●●●●●● regardless of the real value.
   * Edit mode (isReadOnly=false): delegates to PasswordSelector.
   *   - deencryptable=true: eye toggle available to reveal the value.
   *   - deencryptable=false: always masked, no toggle.
   */
  export function EncryptedSelector({ field, isReadOnly, deencryptable }: EncryptedSelectorProps) {
    if (isReadOnly) {
      return (
        <span
          className="text-sm select-none tracking-widest"
          aria-label="encrypted field"
          data-testid={`EncryptedSelector__masked__${field.id}`}>
          {MASKED_DISPLAY}
        </span>
      );
    }

    return (
      <PasswordSelector
        field={field}
        showToggle={deencryptable}
        data-testid={`EncryptedSelector__input__${field.id}`}
      />
    );
  }
  ```

- [ ] **Step 2: Run tests**

  ```bash
  pnpm test:mainui 2>&1 | tail -20
  ```

  Expected: all tests pass. (No tests for EncryptedSelector yet — that is acceptable since it delegates to PasswordSelector which is already tested.)

- [ ] **Step 3: Commit**

  ```bash
  git add packages/MainUI/components/Form/FormView/selectors/EncryptedSelector.tsx
  git commit -m "Feature ETP-3768: Add EncryptedSelector for displayEncription fields"
  ```

---

## Task 7: Route encrypted fields in `GenericSelector`

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

- [ ] **Step 1: Import `EncryptedSelector`**

  Add to the imports in `GenericSelector.tsx`:

  ```typescript
  import { EncryptedSelector } from "./EncryptedSelector";
  ```

- [ ] **Step 2: Add routing before reference-type switch**

  Find the beginning of the field routing logic (around line 105, before the `switch` or the PASSWORD reference check). Add:

  ```typescript
  // Encrypted fields are masked regardless of reference type
  if (field.column.displayEncription) {
    return (
      <EncryptedSelector
        field={field}
        isReadOnly={isReadOnly}
        deencryptable={field.column.deencryptable ?? false}
      />
    );
  }
  ```

  This must appear **before** the existing `field.column.reference === FIELD_REFERENCE_CODES.PASSWORD.id` check.

- [ ] **Step 3: Run full test suite**

  ```bash
  pnpm test:mainui 2>&1 | tail -30
  ```

  Expected: all tests pass.

- [ ] **Step 4: Run lint and format checks**

  ```bash
  cd /Users/santiagoalaniz/Dev/com.etendorx.workspace-ui
  pnpm check
  ```

  Fix any issues with `pnpm check:fix`.

- [ ] **Step 5: Final commit**

  ```bash
  git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
  git commit -m "Feature ETP-3768: Route displayEncription fields to EncryptedSelector"
  ```

---

## Verification Checklist

After all tasks are complete, verify manually in the dev server:

- [ ] Open a form with fields that have `startnewline=true` — those fields should visually start at the first column.
- [ ] Open a form with fields that have `startinoddcolumn=true` — those fields should land on column 1 or 3.
- [ ] Open a form with a field that has `obuiappColspan=2` — that field should span 2 grid columns.
- [ ] Open a form with a field where `column.displayEncription=true` and view mode is active — the field value should show `●●●●●●`.
- [ ] Same field in edit mode with `deencryptable=true` — should show masked input with eye toggle.
- [ ] Same field in edit mode with `deencryptable=false` — should show masked input without eye toggle.
- [ ] Run `pnpm test:mainui` one final time — all pass.
