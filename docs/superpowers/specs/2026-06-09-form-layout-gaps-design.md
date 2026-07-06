# Form Layout Gaps — Design Spec
**Task:** ETP-3768  
**Date:** 2026-06-09  
**Branch:** feature/ETP-3768 (from epic/ETP-3931)

---

## Context

The Etendo WorkspaceUI form renderer currently uses a hardcoded `grid-cols-3` layout with no interpretation of the layout metadata that the backend sends per field. Additionally, fields marked as encrypted (`column.displayEncription`) are displayed as plain text.

This spec covers two independent concerns:

1. **Layout metadata**: interpret `startnewline`, `startinoddcolumn`, `displayOnSameLine`, `obuiappColspan`, and `obuiappRowspan` from the field metadata to control field placement in the grid.
2. **Encrypted fields**: detect `column.displayEncription` and render masked output in view mode and a masked input in edit mode.

A third concern — label alignment and field widths — was intentionally excluded: the WorkspaceUI has its own design language and does not replicate Classic UI proportions.

Text/Memo fields were also excluded: the existing `row-span-3` + resizable textarea behavior already provides adequate UX parity.

---

## Backend Metadata Reference

The metadata endpoint returns fields as `ADField` objects with a nested `ADColumn` object. The relevant layout and encryption fields are:

### On `ADField`
| Field | Type | Meaning |
|-------|------|---------|
| `startnewline` | `boolean` | Force this field to start at column 1 of a new row |
| `startinoddcolumn` | `boolean` | Force this field to start on an odd column (1 or 3) |
| `displayOnSameLine` | `boolean` | Hint: do not force a line break before this field (default CSS behavior) |
| `obuiappColspan` | `number \| null` | How many grid columns this field should span |
| `obuiappRowspan` | `number \| null` | How many grid rows this field should span |

### On `ADField.column` (`ADColumn`)
| Field | Type | Meaning |
|-------|------|---------|
| `displayEncription` | `boolean` | Render this field as masked/encrypted |
| `deencryptable` | `boolean` | Whether the user can toggle visibility of the value |

---

## Part 1: TypeScript Interfaces

### New `ADColumn` interface (replaces `Record<string, string>`)

Located in `packages/api-client/src/api/types.ts`.

> **Note:** The name `ADColumn` is used (not `Column`) because `Column` is already exported from `types.ts` as a grid/table column interface used in 35+ files. Renaming the existing one is out of scope.

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

  // Escape hatch for unknown fields
  [key: string]: unknown;
}
```

### Additions to `Field` interface

```typescript
// Layout metadata (previously untyped / missing)
startinoddcolumn: boolean;
displayOnSameLine: boolean;
obuiappColspan: number | null;
obuiappRowspan: number | null;

// Encryption (also present at field level)
displayEncription?: boolean;

// Misc fields found in codebase but missing from interface
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

The `column` field type changes from `Record<string, string>` to `ADColumn`.

> **Note on `startnewline`:** this field is already declared in the existing `Field` interface (line 143 of `types.ts`). No change needed for it.

---

## Part 2: Layout Algorithm

### Approach

A **hybrid** strategy is used:

- `startnewline`, `obuiappColspan`, `obuiappRowspan`, `displayOnSameLine` — handled via Tailwind CSS classes applied directly in `BaseSelector`.
- `startinoddcolumn` — requires tracking the current column cursor; handled by a pure function in `FormFieldsContent` before rendering.

`displayOnSameLine` requires no extra work: CSS Grid auto-placement already keeps consecutive fields on the same row unless overridden.

### `computeFieldLayout` (new pure function)

**File:** `packages/MainUI/utils/form/computeFieldLayout.ts`

```typescript
export function computeFieldLayout(
  fields: Field[]
): Map<string, { colStart?: number }> {
  const result = new Map<string, { colStart?: number }>();
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
        // already on odd column → no override needed
        cursor += colspan;
      }
    } else {
      cursor += colspan;
    }

    if (cursor > 3) cursor = 1; // wrap to next row
  }

  return result;
}
```

This function is pure (no side effects) and easily unit-testable.

> **Known limitation:** the cursor wrap is a heuristic — it resets to column 1 whenever `cursor > 3`, regardless of how many columns were visually consumed on the last row. In practice this means `startinoddcolumn` placement after a field with `obuiappColspan > 1` may be slightly off. This combination is rare in the current dataset and is accepted as a known edge case for now.



### CSS class application in `BaseSelector`

Full class name strings are used (no dynamic string interpolation) so Tailwind can detect them at build time:

```typescript
const COL_START = { 1: 'col-start-1', 2: 'col-start-2', 3: 'col-start-3' } as const;
const COL_SPAN  = { 1: 'col-span-1',  2: 'col-span-2',  3: 'col-span-3'  } as const;
const ROW_SPAN  = { 1: 'row-span-1',  2: 'row-span-2',  3: 'row-span-3'  } as const;
```

`BaseSelector` receives an optional `colStart?: number` prop (computed by `FormFieldsContent`).

### Changes to `FormFieldsContent`

Before rendering the field list inside each group:

```typescript
const fieldArray = Object.values(group.fields);
const layoutMap = computeFieldLayout(fieldArray);

// Pass colStart to each BaseSelector:
layoutMap.get(field.id)?.colStart
```

---

## Part 3: Encrypted Fields

### Detection

`GenericSelector` currently receives `{ field: Field; isReadOnly: boolean }`. To distinguish view vs edit mode, `isReadOnly` is used (view mode always renders read-only). No `formMode` prop threading is needed.

`EncryptedSelector` determines its mode from `isReadOnly`:
- `isReadOnly === true` → view mode (show `●●●●●●`)
- `isReadOnly === false` → edit mode (masked input)

In `GenericSelector`, check `field.column.displayEncription` **before** all reference-based routing:

```typescript
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

### `EncryptedSelector` behavior

**View mode:** always renders `●●●●●●` regardless of the actual field value. No toggle.

**Edit mode:**
- Renders `<input type="password">` with the real form value masked by the browser.
- If `deencryptable === true`: eye icon toggle to reveal/hide the value (reuses `PasswordSelector` toggle logic).
- If `deencryptable === false`: always masked, no toggle rendered.

### Relationship with `PasswordSelector`

`PasswordSelector` is updated to accept a `showToggle` prop (defaults to `true` to preserve existing behavior). The eye icon is shown only when **all** of the following are true:

```
showToggle && currentValue !== PASSWORD_PLACEHOLDER && !!currentValue
```

`showToggle={false}` is a hard override — the toggle is never rendered regardless of the value.

`EncryptedSelector` is a thin wrapper that:

1. In view mode (`isReadOnly === true`), always renders `●●●●●●` — ignores the actual field value.
2. In edit mode (`isReadOnly === false`), delegates to `PasswordSelector` with `showToggle={deencryptable}`.

### New file

**`packages/MainUI/components/Form/FormView/selectors/EncryptedSelector.tsx`**

---

## Files Changed

| File | Change |
|------|--------|
| `packages/api-client/src/api/types.ts` | Add `ADColumn` interface; add layout + misc fields to `Field`; change `column` type from `Record<string, string>` to `ADColumn` |
| `packages/MainUI/utils/form/computeFieldLayout.ts` | **New** — pure cursor-based layout function |
| `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx` | Call `computeFieldLayout`, pass `colStart` to `BaseSelector` |
| `packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx` | Accept `colStart` prop; apply layout class lookups |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add `displayEncription` routing before reference-type routing |
| `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx` | Add `showToggle` prop (default `true`) |
| `packages/MainUI/components/Form/FormView/selectors/EncryptedSelector.tsx` | **New** — encrypted field selector |

---

## Out of Scope

- Label alignment / fixed column widths (intentional design divergence from Classic UI)
- Text/Memo colspan (already handled via row-span + resizable textarea)
- `numcols` / `startrow` Classic UI layout metadata (not applicable to the new design)
- Encryption at rest or server-side decryption logic
