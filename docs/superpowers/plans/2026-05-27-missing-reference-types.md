# Missing Reference Types & Existing Type Fixes — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete field/column reference type coverage by fixing gaps in existing types (Phase 1), adding missing frequently-used types (Phase 2), and adding isolated types pending manual verification (Phase 3).

**Architecture:** All changes are frontend-only. Reference types are routed in `GenericSelector.tsx` (form view) and `getFieldReference()` (grid view). New selectors follow existing patterns: react-hook-form integration, Tailwind styling, Field prop interface.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, react-hook-form, Jest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-05-27-missing-reference-types-design.md`

**Note:** Spec section 1.2 (Upload File — Form Save Pipeline) is excluded from this plan. It requires endpoint discovery (inspecting Classic network traffic) before implementation can begin. It will be addressed in a follow-up plan once the endpoint is identified.

---

## File Structure

### Phase 1 — Fixes to Existing Types

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/MainUI/components/Form/FormView/selectors/NumericSelector.tsx` | Modify | Add min/max validation with clamping on blur |
| `packages/MainUI/components/Form/FormView/selectors/__tests__/NumericSelector.minmax.test.tsx` | Create | Tests for min/max clamping behavior |
| `packages/MainUI/utils/tableColumns.tsx` | Modify | Add `renderTextCell` with truncation + tooltip |
| `packages/MainUI/hooks/table/useColumns.tsx` | Modify | Apply `renderTextCell` for Text/Memo/RichText reference IDs |
| `packages/MainUI/utils/__tests__/tableColumns.test.tsx` | Modify | Add tests for `renderTextCell` |
| `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/AttributeSetInstanceModal.tsx` | Modify | Add mandatory lot/serial validation in `hasRequiredFields` |
| `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/AttributeSetInstanceSelector.tsx` | Modify | Add clear (X) button |
| `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx` | Modify | Add show/hide toggle via endAdornment |
| `packages/MainUI/components/Form/FormView/selectors/__tests__/PasswordSelector.test.tsx` | Create | Tests for toggle behavior |

### Phase 2 — New Reference Types

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/MainUI/utils/form/constants.ts` | Modify | Add MEMO, LINK, PRODUCT_CHARACTERISTICS constants |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Modify | Add switch cases for Memo, Link, Product Characteristics |
| `packages/MainUI/utils/index.ts` | Modify | Add `getFieldReference()` mappings for new IDs |
| `packages/MainUI/components/Form/FormView/selectors/LinkSelector.tsx` | Create | Dual-mode link/input selector |
| `packages/MainUI/components/Form/FormView/selectors/__tests__/LinkSelector.test.tsx` | Create | Tests for link rendering and edit mode |

### Phase 3 — Isolated Types (blocked on manual testing)

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/MainUI/utils/form/constants.ts` | Modify | Add ASSIGNMENT, TREE_REFERENCE constants |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Modify | Add switch cases |
| `packages/MainUI/utils/index.ts` | Modify | Add `getFieldReference()` mappings |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeSelector.tsx` | Create | Tree reference field + modal trigger |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeModal.tsx` | Create | Modal with expandable tree |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector/index.ts` | Create | Barrel export |
| `packages/MainUI/hooks/useTreeData.ts` | Create | Fetch tree datasource, build hierarchy |

---

## Phase 1: Fixes to Existing Types

### Task 1: NumericSelector min/max Validation

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/NumericSelector.tsx`
- Create: `packages/MainUI/components/Form/FormView/selectors/__tests__/NumericSelector.minmax.test.tsx`

- [ ] **Step 1: Write failing tests for min/max clamping**

Create `packages/MainUI/components/Form/FormView/selectors/__tests__/NumericSelector.minmax.test.tsx`:

```tsx
import { fireEvent, screen } from "@testing-library/react";
import { NumericSelector } from "../NumericSelector";
import { createMockField, renderWithWrapper } from "../test-utils/decimal-test-helpers";

const createFieldWithMinMax = (reference: string, minValue?: number, maxValue?: number) => {
  const field = createMockField(reference);
  field.column = { ...field.column, minValue, maxValue };
  return field;
};

describe("NumericSelector - min/max validation", () => {
  it("should clamp value to minValue on blur when below minimum", () => {
    const field = createFieldWithMinMax("11", 0, 100);
    renderWithWrapper(<NumericSelector field={field} type="integer" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("0");
  });

  it("should clamp value to maxValue on blur when above maximum", () => {
    const field = createFieldWithMinMax("11", 0, 100);
    renderWithWrapper(<NumericSelector field={field} type="integer" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("100");
  });

  it("should not clamp when value is within range", () => {
    const field = createFieldWithMinMax("11", 0, 100);
    renderWithWrapper(<NumericSelector field={field} type="integer" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("50");
  });

  it("should skip validation when no min/max defined", () => {
    const field = createMockField("11");
    renderWithWrapper(<NumericSelector field={field} type="integer" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "-999" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("-999");
  });

  it("should clamp decimal values to minValue", () => {
    const field = createFieldWithMinMax("800008", 0.5, 99.9);
    renderWithWrapper(<NumericSelector field={field} type="decimal" />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "0.1" } });
    fireEvent.blur(input);

    // getNumericFormatOptions("800008", undefined) returns { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    // so 0.5 is formatted as "0.50"
    expect(input).toHaveValue("0.50");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="NumericSelector.minmax" --no-coverage`
Expected: FAIL — clamping does not exist yet

- [ ] **Step 3: Implement min/max validation in NumericSelector**

Modify `packages/MainUI/components/Form/FormView/selectors/NumericSelector.tsx`:

In `handleBlur`, after `parseValue(localValue)`, add clamping logic. Note: the spec mentions using `validateNumber` for the validity check and a `hasError` state for visual feedback. However, since we clamp immediately on blur, the invalid value is never displayed — making visual feedback unnecessary. Direct clamping is simpler and matches `QuantitySelector`'s approach:

```tsx
// After: const parsedValue = parseValue(localValue);
// Add:
const minValue = field.column?.minValue != null ? Number(field.column.minValue) : undefined;
const maxValue = field.column?.maxValue != null ? Number(field.column.maxValue) : undefined;

let clampedValue = parsedValue;
if (clampedValue !== null) {
  if (minValue !== undefined && clampedValue < minValue) {
    clampedValue = minValue;
  }
  if (maxValue !== undefined && clampedValue > maxValue) {
    clampedValue = maxValue;
  }
}

// Then use clampedValue instead of parsedValue for setValue and formatDisplayValue
setValue(field.hqlName, clampedValue);

if (clampedValue === null) {
  setLocalValue("");
} else {
  setLocalValue(formatDisplayValue(clampedValue));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="NumericSelector.minmax" --no-coverage`
Expected: PASS

- [ ] **Step 5: Run full test suite to check for regressions**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="NumericSelector|QuantitySelector" --no-coverage`
Expected: All existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/NumericSelector.tsx \
       packages/MainUI/components/Form/FormView/selectors/__tests__/NumericSelector.minmax.test.tsx
git commit -m "Feature ETP-3931: Add min/max validation to NumericSelector"
```

---

### Task 2: Text/Memo Grid Truncation

**Files:**
- Modify: `packages/MainUI/utils/tableColumns.tsx`
- Modify: `packages/MainUI/hooks/table/useColumns.tsx`
- Modify: `packages/MainUI/utils/__tests__/tableColumns.test.tsx`

- [ ] **Step 1: Write failing test for renderTextCell**

Add to `packages/MainUI/utils/__tests__/tableColumns.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { renderTextCell } from "../tableColumns";

describe("renderTextCell", () => {
  it("should render the value in a span with truncate class", () => {
    const result = renderTextCell("A very long text that should be truncated");
    render(<div>{result}</div>);
    const span = screen.getByText("A very long text that should be truncated");
    expect(span).toBeInTheDocument();
    expect(span.className).toContain("truncate");
  });

  it("should return empty string for null/undefined", () => {
    expect(renderTextCell(null)).toBe("");
    expect(renderTextCell(undefined)).toBe("");
  });

  it("should handle empty string", () => {
    expect(renderTextCell("")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="tableColumns" --no-coverage`
Expected: FAIL — `renderTextCell` does not exist

- [ ] **Step 3: Implement renderTextCell**

Add to `packages/MainUI/utils/tableColumns.tsx`:

```tsx
import Tooltip from "@workspaceui/componentlibrary/src/components/Tooltip";

export const renderTextCell = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value);
  return (
    <Tooltip title={text} position="top">
      <span className="block truncate max-w-full">{text}</span>
    </Tooltip>
  );
};
```

- [ ] **Step 4: Apply renderTextCell in useColumns for Text/Memo/RichText reference IDs**

Modify `packages/MainUI/hooks/table/useColumns.tsx` — in the column definition logic, add a `cell` renderer for columns whose `column.reference` matches:
- `"14"` (Text)
- `"34"` (Memo)
- `"7CB371C13D204EB69BF370217F692999"` (Rich Text)

The exact integration point depends on how `useColumns` builds column definitions — look for where `accessorFn` or `cell` is set per column and add the text cell renderer for these reference IDs.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="tableColumns" --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/utils/tableColumns.tsx \
       packages/MainUI/hooks/table/useColumns.tsx \
       packages/MainUI/utils/__tests__/tableColumns.test.tsx
git commit -m "Feature ETP-3931: Add grid truncation with tooltip for Text fields"
```

---

### Task 3: PAttribute Mandatory Validation & Clear Button

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/AttributeSetInstanceModal.tsx`
- Modify: `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/AttributeSetInstanceSelector.tsx`

- [ ] **Step 1: Check if backend sends isMandatoryLot/isMandatorySerNo**

Before implementing, inspect the backend response. In the browser devtools, open a window with a PAttribute field (e.g., Sales Order Lines), trigger the attribute modal, and check the network response from the CONFIG action. Look for `isMandatoryLot`/`isMandatorySerNo` fields.

If these fields exist: proceed with Steps 2-5 below.
If not: skip steps 2-3 and proceed directly to Step 4 (clear button only).

- [ ] **Step 2: Add mandatory lot/serial validation (conditional)**

Modify `AttributeSetInstanceModal.tsx` — extend the `hasRequiredFields` useMemo:

```tsx
const hasRequiredFields = useMemo(() => {
  if (!config) return false;
  // Validate mandatory lot
  if (config.isMandatoryLot && !formData.lot) return false;
  // Validate mandatory serial number
  if (config.isMandatorySerNo && !formData.serialNo) return false;
  // Existing custom attribute validation
  for (const attr of customAttributes) {
    if (attr.isMandatory && !formData.customAttributes[attr.id]) {
      return false;
    }
  }
  return true;
}, [config, customAttributes, formData]);
```

Also update `types.ts` to add the new fields to `AttributeSetConfig`, and `useAttributeSetConfig.ts` to parse them from the response.

- [ ] **Step 3: Run existing tests**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="AttributeSet" --no-coverage`
Expected: PASS (no existing tests should break)

- [ ] **Step 4: Add clear button to AttributeSetInstanceSelector**

Modify `AttributeSetInstanceSelector.tsx` — add an X icon button visible when `value` is set and `!isReadOnly`:

```tsx
import X from "@workspaceui/componentlibrary/src/assets/icons/x.svg";

// Inside the component, add a clear handler:
const handleClear = useCallback(
  (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    setValue(fieldName, null, { shouldDirty: true, shouldTouch: true });
    setValue(`${fieldName}$_identifier`, null, { shouldDirty: true });
    setValue(`${fieldName}_data`, null, { shouldDirty: true });
    setDisplayValue("");
    setLastSavedInstanceId(null);
  },
  [fieldName, setValue]
);

// In the JSX, next to the SearchOutlined icon:
{value && !isReadOnly && (
  <button
    type="button"
    onClick={handleClear}
    className="p-0.5 hover:text-gray-600 transition-colors"
  >
    <X className="w-3.5 h-3.5 text-gray-400" />
  </button>
)}
```

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/
git commit -m "Feature ETP-3931: Improve PAttribute mandatory validation and clear"
```

---

### Task 4: Password Show/Hide Toggle

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx`
- Create: `packages/MainUI/components/Form/FormView/selectors/__tests__/PasswordSelector.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/MainUI/components/Form/FormView/selectors/__tests__/PasswordSelector.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { PasswordSelector } from "../PasswordSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

// Mock context dependencies that TextInput may transitively import
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

const mockField: Field = {
  id: "pwd-1",
  name: "Password",
  hqlName: "password",
  columnName: "password",
  isMandatory: false,
  column: { reference: "C5C21C28B39E4683A91779F16C112E40", length: 60 },
} as Field;

const Wrapper = ({ defaultValue = "" }: { defaultValue?: string }) => {
  const methods = useForm({ defaultValues: { password: defaultValue } });
  return (
    <FormProvider {...methods}>
      <PasswordSelector field={mockField} />
    </FormProvider>
  );
};

describe("PasswordSelector", () => {
  it("should render as password type by default", () => {
    render(<Wrapper defaultValue="secret123" />);
    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should toggle to text type when eye icon is clicked", () => {
    render(<Wrapper defaultValue="secret123" />);
    const toggle = screen.getByTestId(/eye-toggle/);
    fireEvent.click(toggle);
    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "text");
  });

  it("should toggle back to password on second click", () => {
    render(<Wrapper defaultValue="secret123" />);
    const toggle = screen.getByTestId(/eye-toggle/);
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should not show toggle when value is placeholder ***", () => {
    render(<Wrapper defaultValue="***" />);
    expect(screen.queryByTestId(/eye-toggle/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="PasswordSelector" --no-coverage`
Expected: FAIL — no toggle exists

- [ ] **Step 3: Implement show/hide toggle**

Modify `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx`:

```tsx
import { useState } from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext, type FieldValues } from "react-hook-form";
import { PASSWORD_PLACEHOLDER } from "@/utils/form/constants";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

export const PasswordSelector = (props: { field: Field } & React.ComponentProps<typeof TextInput>) => {
  const { register, watch, setValue } = useFormContext<FieldValues>();
  const fieldName = props.field.hqlName;
  const currentValue = watch(fieldName);
  const [showPassword, setShowPassword] = useState(false);

  const handleSetValue = (value: string) => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  const isPlaceholder = currentValue === PASSWORD_PLACEHOLDER;

  const eyeToggle = !isPlaceholder && currentValue ? (
    <button
      type="button"
      data-testid={`eye-toggle__${props.field.id}`}
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
    >
      <EyeIcon open={showPassword} />
    </button>
  ) : null;

  return (
    <TextInput
      {...register(fieldName)}
      field={props.field}
      setValue={handleSetValue}
      showClearButton={false}
      endAdornment={eyeToggle}
      value={currentValue}
      type={showPassword ? "text" : "password"}
      maxLength={Number(props.field.column.length)}
      autoComplete="new-password"
      data-testid="TextInput__1b1414"
    />
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="PasswordSelector" --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx \
       packages/MainUI/components/Form/FormView/selectors/__tests__/PasswordSelector.test.tsx
git commit -m "Feature ETP-3931: Add show/hide toggle to PasswordSelector"
```

---

## Phase 2: New Reference Types

### Task 5: Add Memo, Link, Product Characteristics Constants

**Files:**
- Modify: `packages/MainUI/utils/form/constants.ts`
- Modify: `packages/MainUI/utils/index.ts`

- [ ] **Step 1: Add constants to FIELD_REFERENCE_CODES**

Add to `packages/MainUI/utils/form/constants.ts` inside `FIELD_REFERENCE_CODES`:

```typescript
// Memo — large text area (same rendering as Text)
MEMO: { id: "34", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

// Link — URL field, renders as clickable hyperlink in read-only
LINK: { id: "800101", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },

// Product Characteristics — always read-only concatenated description
PRODUCT_CHARACTERISTICS: { id: "C632F1CFF5A1453EB28BDF44A70478F8", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR },
```

- [ ] **Step 2: Add getFieldReference mappings**

Add cases to `getFieldReference()` in `packages/MainUI/utils/index.ts`:

```typescript
case FIELD_REFERENCE_CODES.MEMO.id:
case FIELD_REFERENCE_CODES.TEXT_LONG.id:
  return FieldType.TEXT;
case FIELD_REFERENCE_CODES.LINK.id:
  return FieldType.TEXT;
case FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id:
  return FieldType.TEXT;
```

Note: `TEXT_LONG` (14) already falls through to the default `FieldType.TEXT`, but adding it explicitly alongside MEMO makes the intent clear and prevents issues if the default ever changes.

- [ ] **Step 3: Run existing tests**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="constants|tableColumns" --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/MainUI/utils/form/constants.ts packages/MainUI/utils/index.ts
git commit -m "Feature ETP-3931: Add Memo, Link, Product Characteristics reference constants"
```

---

### Task 6: Route Memo to TextLongSelector

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

- [ ] **Step 1: Add Memo case in GenericSelector**

In the switch statement inside `GenericSelector.tsx`, add a case for MEMO alongside TEXT_LONG:

```tsx
case FIELD_REFERENCE_CODES.MEMO.id:
case FIELD_REFERENCE_CODES.TEXT_LONG.id:
  return <TextLongSelector field={effectiveField} readOnly={isReadOnly} data-testid="TextLongSelector__6e80fa" />;
```

Replace the existing `TEXT_LONG` case with this combined block.

- [ ] **Step 2: Verify manually**

Open a window with a Memo field (e.g., Tables and Columns > Table > Observation field, or Report and Process > Parameter > Default Value) and confirm it renders as a textarea, not a single-line input.

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
git commit -m "Feature ETP-3931: Route Memo reference type to TextLongSelector"
```

---

### Task 7: LinkSelector Component

**Files:**
- Create: `packages/MainUI/components/Form/FormView/selectors/LinkSelector.tsx`
- Create: `packages/MainUI/components/Form/FormView/selectors/__tests__/LinkSelector.test.tsx`
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/MainUI/components/Form/FormView/selectors/__tests__/LinkSelector.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { LinkSelector } from "../LinkSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

const mockField: Field = {
  id: "link-1",
  name: "URL",
  hqlName: "url",
  columnName: "url",
  isMandatory: false,
  column: { reference: "800101" },
} as Field;

const Wrapper = ({ defaultValue = "", readOnly = false }: { defaultValue?: string; readOnly?: boolean }) => {
  const methods = useForm({ defaultValues: { url: defaultValue } });
  return (
    <FormProvider {...methods}>
      <LinkSelector field={mockField} isReadOnly={readOnly} />
    </FormProvider>
  );
};

describe("LinkSelector", () => {
  it("should render as text input in edit mode", () => {
    render(<Wrapper defaultValue="https://example.com" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("https://example.com");
  });

  it("should render as clickable link in read-only mode", () => {
    render(<Wrapper defaultValue="https://example.com" readOnly />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should render empty in read-only mode when no value", () => {
    render(<Wrapper defaultValue="" readOnly />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="LinkSelector" --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement LinkSelector**

Create `packages/MainUI/components/Form/FormView/selectors/LinkSelector.tsx`:

```tsx
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext, type FieldValues } from "react-hook-form";

interface LinkSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

export const LinkSelector = ({ field, isReadOnly }: LinkSelectorProps) => {
  const { register, watch, setValue } = useFormContext<FieldValues>();
  const fieldName = field.hqlName;
  const currentValue = watch(fieldName);

  if (isReadOnly) {
    if (!currentValue) {
      return <span className="text-sm text-gray-400 h-10.5 flex items-center px-3">—</span>;
    }

    return (
      <a
        href={currentValue}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 underline hover:text-blue-800 truncate block h-10.5 flex items-center px-3 max-w-full"
        title={currentValue}
      >
        {currentValue}
      </a>
    );
  }

  const handleSetValue = (value: string) => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  return (
    <TextInput
      {...register(fieldName)}
      field={field}
      setValue={handleSetValue}
      showClearButton={true}
      value={currentValue}
      placeholder="https://..."
      data-testid={`LinkSelector__${field.id}`}
    />
  );
};
```

- [ ] **Step 4: Route in GenericSelector**

Add to `GenericSelector.tsx` switch:

```tsx
case FIELD_REFERENCE_CODES.LINK.id:
  return <LinkSelector field={effectiveField} isReadOnly={isReadOnly} />;
```

Add the import at the top:

```tsx
import { LinkSelector } from "./LinkSelector";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="LinkSelector" --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/LinkSelector.tsx \
       packages/MainUI/components/Form/FormView/selectors/__tests__/LinkSelector.test.tsx \
       packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
git commit -m "Feature ETP-3931: Add LinkSelector for URL reference fields"
```

---

### Task 8: Route Product Characteristics as Read-Only

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

- [ ] **Step 1: Add Product Characteristics case**

Add to `GenericSelector.tsx` switch:

```tsx
// Product Characteristics: always read-only — composed from Product Characteristics window, not editable inline.
// This hardcoded readOnly={true} intentionally overrides the isReadOnly prop from GenericSelector.
case FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id:
  return <StringSelector field={effectiveField} readOnly={true} data-testid={`StringSelector__prodchar__${field.id}`} />;
```

- [ ] **Step 2: Verify manually**

Find a Product with characteristics and confirm the field shows the concatenated description as read-only text in both new and edit modes.

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
git commit -m "Feature ETP-3931: Route Product Characteristics as read-only string"
```

---

## Phase 3: Isolated Types (Blocked on Manual Testing)

> **STOP**: Do not start Phase 3 until manual verification of metadata responses is complete. See prerequisites in spec sections 3.1 and 3.2.

### Task 9: Assignment Reference Type

**Files:**
- Modify: `packages/MainUI/utils/form/constants.ts`
- Modify: `packages/MainUI/utils/index.ts`
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

**Prerequisites** (verify before implementing):
1. Open a window with an Assignment field (S_ResourceAssignment_ID) in the new UI
2. Check browser devtools: does the metadata response include `referencedEntity: "ResourceAssignment"`?
3. If yes → route to `TableDirSelector` (Option A below)
4. If no → create a custom `AssignmentSelector` wrapper (Option B — details in spec)

- [ ] **Step 1: Add constant**

Add to `packages/MainUI/utils/form/constants.ts`:

```typescript
ASSIGNMENT: { id: "33", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
```

- [ ] **Step 2: Add getFieldReference mapping**

Add to `getFieldReference()` in `packages/MainUI/utils/index.ts`:

```typescript
case FIELD_REFERENCE_CODES.ASSIGNMENT.id:
  return FieldType.TABLEDIR;
```

- [ ] **Step 3: Route in GenericSelector (Option A — TableDirSelector)**

Add to `GenericSelector.tsx` switch, alongside the existing TABLEDIR cases:

```tsx
case FIELD_REFERENCE_CODES.ASSIGNMENT.id:
```

This falls into the existing block that routes to `TableDirSelector`.

- [ ] **Step 4: Test manually**

Open a window with `S_ResourceAssignment_ID` and verify the selector loads options and allows selection.

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/utils/form/constants.ts \
       packages/MainUI/utils/index.ts \
       packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
git commit -m "Feature ETP-3931: Add Assignment reference type support"
```

---

### Task 10: Tree Reference Selector

**Files:**
- Create: `packages/MainUI/hooks/useTreeData.ts`
- Create: `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeSelector.tsx`
- Create: `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeModal.tsx`
- Create: `packages/MainUI/components/Form/FormView/selectors/TreeSelector/index.ts`
- Modify: `packages/MainUI/utils/form/constants.ts`
- Modify: `packages/MainUI/utils/index.ts`
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

**Prerequisites** (verify before implementing):
1. Call the tree datasource endpoint and examine response structure
2. Confirm fields per node: `id`, `name`/`_identifier`, `parentId`
3. Confirm: can any level be selected, or only leaf nodes?
4. Confirm: approximate number of nodes (is client-side tree building viable?)

- [ ] **Step 1: Add constant and mapping**

Add to `constants.ts`:

```typescript
TREE_REFERENCE: { id: "8C57A4A2E05F4261A1FADF47C30398AD", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
```

Add to `getFieldReference()`:

```typescript
case FIELD_REFERENCE_CODES.TREE_REFERENCE.id:
  return FieldType.SELECT;
```

- [ ] **Step 2: Create useTreeData hook**

Create `packages/MainUI/hooks/useTreeData.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

export interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: TreeNode[];
}

interface UseTreeDataResult {
  tree: TreeNode[];
  loading: boolean;
  error: string | null;
}

const buildTree = (flatNodes: TreeNode[]): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const node of flatNodes) {
    nodeMap.set(node.id, { ...node, children: [] });
  }

  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
};

export const useTreeData = (datasourceId: string | null): UseTreeDataResult => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!datasourceId) return;
    setLoading(true);
    setError(null);

    try {
      // The exact endpoint and response parsing will depend on manual testing findings.
      // This is the expected structure — adjust field names after verifying the datasource response.
      const response = await Metadata.client.request(`api/datasource/${datasourceId}`, {
        method: "GET",
      });

      const data = response?.data?.response?.data || [];
      const flatNodes: TreeNode[] = data.map((item: any) => ({
        id: String(item.id),
        name: String(item._identifier || item.name || ""),
        parentId: item.parentId || item.treeNode || null,
        children: [],
      }));

      setTree(buildTree(flatNodes));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading tree data");
    } finally {
      setLoading(false);
    }
  }, [datasourceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tree, loading, error };
};
```

- [ ] **Step 3: Create TreeModal**

Create `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeModal.tsx`:

```tsx
import { useState, useCallback } from "react";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import type { TreeNode } from "@/hooks/useTreeData";

interface TreeModalProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (node: TreeNode) => void;
  tree: TreeNode[];
  loading: boolean;
  error: string | null;
  currentId?: string | null;
}

const TreeNodeItem = ({
  node,
  level,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) => {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-sm transition-colors
          ${isSelected ? "bg-blue-100 text-blue-800 font-medium" : "hover:bg-gray-100"}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          >
            <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
            </svg>
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <TreeNodeItem
          key={child.id}
          node={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

const TreeModal = ({ open, onCancel, onSelect, tree, loading, error, currentId }: TreeModalProps) => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedNode(node);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedNode) onSelect(selectedNode);
  }, [selectedNode, onSelect]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      tittleHeader="Select Value"
      descriptionText=""
      HeaderIcon={SearchOutlined}
      showHeader
      buttons={
        <div className="flex gap-2 flex-1">
          <Button className="flex-[1_0_0]" variant="outlined" onClick={onCancel}>Cancel</Button>
          <Button className="flex-[1_0_0]" variant="filled" onClick={handleConfirm} disabled={!selectedNode}>
            OK
          </Button>
        </div>
      }
    >
      <div className="p-4 max-h-80 overflow-y-auto">
        {loading && <div className="flex justify-center p-8"><Spinner /></div>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && tree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedNode?.id || currentId || null}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </Modal>
  );
};

export default TreeModal;
```

- [ ] **Step 4: Create TreeSelector**

Create `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeSelector.tsx`:

```tsx
import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import type { Field } from "@workspaceui/api-client/src/api/types";
import TreeModal from "./TreeModal";
import { useTreeData, type TreeNode } from "@/hooks/useTreeData";

interface TreeSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

const TreeSelector = ({ field, isReadOnly }: TreeSelectorProps) => {
  const { watch, setValue } = useFormContext();
  const fieldName = field.hqlName || field.columnName || field.name;
  const value = watch(fieldName);
  const identifier = watch(`${fieldName}$_identifier`);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // The datasource ID comes from the field's selector configuration.
  // Adjust this property path after manual testing confirms where it lives.
  const datasourceId = (field.selector?.datasourceName as string) || null;
  const { tree, loading, error } = useTreeData(isModalOpen ? datasourceId : null);

  const handleSelect = useCallback(
    (node: TreeNode) => {
      setValue(fieldName, node.id, { shouldDirty: true, shouldTouch: true });
      setValue(`${fieldName}$_identifier`, node.name, { shouldDirty: true });
      setIsModalOpen(false);
    },
    [fieldName, setValue]
  );

  const displayValue = identifier || value || "";

  return (
    <>
      <div
        className={`flex items-center w-full px-3 rounded-t h-10.5 border-0 border-b-2 transition-colors outline-none ${
          isReadOnly
            ? "bg-transparent cursor-not-allowed border-dotted border-(--color-transparent-neutral-40)"
            : "bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) hover:border-(--color-transparent-neutral-100) cursor-pointer"
        }`}
        onClick={() => !isReadOnly && setIsModalOpen(true)}
        tabIndex={isReadOnly ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isReadOnly) {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <span className={`text-sm truncate flex-1 font-medium ${displayValue ? "text-(--color-transparent-neutral-80)" : "text-baseline-60"}`}>
          {displayValue || "Select..."}
        </span>
        <SearchOutlined fill="currentColor" className="w-4 h-4 flex-shrink-0 text-(--color-transparent-neutral-60)" />
      </div>
      {isModalOpen && (
        <TreeModal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onSelect={handleSelect}
          tree={tree}
          loading={loading}
          error={error}
          currentId={value}
        />
      )}
    </>
  );
};

export default TreeSelector;
```

- [ ] **Step 5: Create barrel export**

Create `packages/MainUI/components/Form/FormView/selectors/TreeSelector/index.ts`:

```typescript
export { default as TreeSelector } from "./TreeSelector";
```

- [ ] **Step 6: Route in GenericSelector**

Add import and case:

```tsx
import { TreeSelector } from "./TreeSelector";

// In switch:
case FIELD_REFERENCE_CODES.TREE_REFERENCE.id:
  return <TreeSelector field={effectiveField} isReadOnly={isReadOnly} />;
```

- [ ] **Step 7: Test manually**

Open a window with `M_Ch_Value_ID` (Characteristic Value) and verify:
1. Field shows current value as text
2. Click opens tree modal
3. Tree loads and displays nodes hierarchically
4. Selecting a node and clicking OK updates the field

- [ ] **Step 8: Commit**

```bash
git add packages/MainUI/hooks/useTreeData.ts \
       packages/MainUI/components/Form/FormView/selectors/TreeSelector/ \
       packages/MainUI/utils/form/constants.ts \
       packages/MainUI/utils/index.ts \
       packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
git commit -m "Feature ETP-3931: Add TreeSelector for tree reference fields"
```
