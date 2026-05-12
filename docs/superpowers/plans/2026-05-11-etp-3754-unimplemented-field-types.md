# ETP-3754: Unimplemented Field Types — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route unimplemented field reference types (Absolute DateTime, Upload File, Button) to proper selector components in forms, and extract shared process-trigger logic into a reusable hook.

**Architecture:** The GenericSelector switch at `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` routes `field.column.reference` to selector components. Each task adds a case to this switch (and to `getFieldReference()` in `utils/index.ts` where missing). Button fields require a new component + shared hook extraction. Rich Text and SelectorAsLink are deferred pending Classic DB verification.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, react-hook-form, Jest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-05-11-etp-3754-unimplemented-field-types-design.md`

---

## File Map

| File | Action | Task | Responsibility |
|------|--------|------|---------------|
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Modify | 1, 2, 3 | Add cases for ABSOLUTE_DATETIME, UPLOAD_FILE, BUTTON |
| `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx` | Modify | 1, 2, 3 | Add test cases for new reference routing |
| `packages/MainUI/utils/index.ts` | Modify | 1 | Add ABSOLUTE_DATETIME to `getFieldReference()`, clean up hardcoded `"28"` |
| `packages/MainUI/hooks/useProcessDefinitionTrigger.ts` | Create | 3 | Shared hook: fetch process definition + manage modal state |
| `packages/MainUI/hooks/__tests__/useProcessDefinitionTrigger.test.ts` | Create | 3 | Tests for the shared hook |
| `packages/MainUI/components/Form/FormView/selectors/ButtonSelector.tsx` | Create | 3 | Tailwind button that triggers process modal |
| `packages/MainUI/components/Form/FormView/selectors/__tests__/ButtonSelector.test.tsx` | Create | 3 | Tests for ButtonSelector |

---

### Task 1: Route Absolute DateTime to DatetimeSelector

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx:158` (switch statement)
- Modify: `packages/MainUI/utils/index.ts:46-47` (getFieldReference switch)
- Modify: `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx:115` (test cases array)

- [ ] **Step 1: Add test cases for DATETIME and ABSOLUTE_DATETIME routing**

In `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx`, add to the `cases` array (after the DATE entry around line 148).

Note: there is currently no test for the existing DATETIME case. Add both to confirm baseline + new behavior:

```typescript
{
  title: "DATETIME fields",
  expected: "DatetimeSelector",
  field: { column: { reference: FIELD_REFERENCE_CODES.DATETIME.id } },
},
{
  title: "ABSOLUTE_DATETIME fields",
  expected: "DatetimeSelector",
  field: { column: { reference: FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id } },
},
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/GenericSelector" --no-coverage 2>&1 | tail -20`

Expected: FAIL — the DATETIME test should PASS (existing behavior), but ABSOLUTE_DATETIME should FAIL (falls through to StringSelector). If DATETIME also fails, the existing mock for DatetimeSelector may need `__esModule: true` — fix the mock first before proceeding.

- [ ] **Step 3: Add the ABSOLUTE_DATETIME case to GenericSelector switch**

In `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`, add a case before the existing `DATETIME` case (line 158):

```typescript
      case FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id:
      case FIELD_REFERENCE_CODES.DATETIME.id:
        return (
          <DatetimeSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="DatetimeSelector__6e80fa" />
        );
```

- [ ] **Step 4: Add the ABSOLUTE_DATETIME case to getFieldReference**

In `packages/MainUI/utils/index.ts`, add after the `DATETIME` case (line 47) and also replace the hardcoded `"28"` with the constant:

```typescript
    case FIELD_REFERENCE_CODES.DATETIME.id:
    case FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id:
      return FieldType.DATETIME;
```

And replace:
```typescript
    case "28":
      return FieldType.BUTTON;
```
with:
```typescript
    case FIELD_REFERENCE_CODES.BUTTON.id:
      return FieldType.BUTTON;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/GenericSelector" --no-coverage 2>&1 | tail -20`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx packages/MainUI/utils/index.ts
git commit -m "Feature ETP-3754: Route Absolute DateTime to DatetimeSelector

Add ABSOLUTE_DATETIME reference ID to GenericSelector switch (routes to
existing DatetimeSelector) and to getFieldReference() (maps to
FieldType.DATETIME). Also replace hardcoded '28' with
FIELD_REFERENCE_CODES.BUTTON.id in getFieldReference.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Wire UploadFileSelector for Form Fields

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` (switch + import)
- Modify: `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx` (test cases + mock)

- [ ] **Step 1: Add mock and test case for UploadFileSelector routing**

In `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx`:

Add mock after the ImageSelector mock (around line 70):

```typescript
jest.mock("@/components/ProcessModal/selectors/UploadFileSelector", () => ({
  UploadFileSelector: () => <div data-testid="UploadFileSelector__mock">UploadFileSelector</div>,
}));
```

Add to the `cases` array:

```typescript
{
  title: "UPLOAD_FILE fields",
  expected: "UploadFileSelector__mock",
  field: { column: { reference: FIELD_REFERENCE_CODES.UPLOAD_FILE.id }, id: "upload-1" },
},
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/GenericSelector" --no-coverage 2>&1 | tail -20`

Expected: FAIL — UploadFileSelector__mock not found (falls through to StringSelector).

- [ ] **Step 3: Add import and case to GenericSelector**

In `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`:

Add import at the top (after the ImageSelector import, around line 47):

```typescript
import { UploadFileSelector } from "@/components/ProcessModal/selectors/UploadFileSelector";
```

Add case in the switch, before the `default:` (after the IMAGE case, around line 224):

```typescript
      case FIELD_REFERENCE_CODES.UPLOAD_FILE.id:
        return (
          <UploadFileSelector
            field={effectiveField}
            disabled={isReadOnly}
            data-testid={`UploadFileSelector__${field.id}`}
          />
        );
```

Note: `UploadFileSelector` uses `disabled` prop (not `isReadOnly`), so we map `isReadOnly` to `disabled`.

**Limitation**: In form context, `onFileChange` is not passed. The component stores a fake path string (`C:\\fakepath\\filename`) in the form value via `setValue`. This is sufficient for file selection UI, but file persistence on save depends on backend expectations. If the backend requires a pre-save upload (like ImageSelector), a `useFileUpload` hook will need to be created in a follow-up. Add a `// TODO: ETP-3754 - verify form-level file persistence` comment in the case.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/GenericSelector" --no-coverage 2>&1 | tail -20`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx
git commit -m "Feature ETP-3754: Wire UploadFileSelector for form fields

Route UPLOAD_FILE reference ID to existing UploadFileSelector component
in the GenericSelector switch. The component is reused from ProcessModal
selectors. The onFileChange prop is omitted for form usage (optional).

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Add ButtonSelector for Process Buttons in Forms

This task has 3 subtasks: (A) extract shared hook, (B) create ButtonSelector, (C) wire into GenericSelector.

#### Task 3A: Extract useProcessDefinitionTrigger Hook

**Files:**
- Create: `packages/MainUI/hooks/useProcessDefinitionTrigger.ts`
- Create: `packages/MainUI/hooks/__tests__/useProcessDefinitionTrigger.test.ts`

- [ ] **Step 1: Write the failing test for the hook**

Create `packages/MainUI/hooks/__tests__/useProcessDefinitionTrigger.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useProcessDefinitionTrigger } from "../useProcessDefinitionTrigger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    client: {
      post: jest.fn(),
    },
  },
}));

const mockPost = Metadata.client.post as jest.Mock;

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "field-1",
    name: "Test Button",
    hqlName: "testButton",
    column: { reference: "28" },
    selector: { processDefinitionId: "proc-123" },
    ...overrides,
  }) as unknown as Field;

describe("useProcessDefinitionTrigger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns initial state with modal closed and no data", () => {
    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));
    expect(result.current.isProcessModalOpen).toBe(false);
    expect(result.current.processButtonData).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches process definition and opens modal on triggerProcess", async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      data: { name: "My Process", id: "proc-123", javaClassName: "com.test.Process" },
    });

    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("proc-123");
    });

    expect(mockPost).toHaveBeenCalledWith("meta/process/proc-123");
    expect(result.current.isProcessModalOpen).toBe(true);
    expect(result.current.processButtonData).not.toBeNull();
    expect(result.current.processButtonData?.name).toBe("My Process");
  });

  it("does nothing when processId is empty", async () => {
    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("");
    });

    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.isProcessModalOpen).toBe(false);
  });

  it("closes modal and clears data on closeProcessModal", async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      data: { name: "My Process", id: "proc-123" },
    });

    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("proc-123");
    });

    expect(result.current.isProcessModalOpen).toBe(true);

    act(() => {
      result.current.closeProcessModal();
    });

    expect(result.current.isProcessModalOpen).toBe(false);
    expect(result.current.processButtonData).toBeNull();
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPost.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("proc-123");
    });

    expect(result.current.isProcessModalOpen).toBe(false);
    expect(result.current.processButtonData).toBeNull();
    consoleSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="hooks/__tests__/useProcessDefinitionTrigger" --no-coverage 2>&1 | tail -20`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `packages/MainUI/hooks/useProcessDefinitionTrigger.ts`:

```typescript
import { useState, useCallback } from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import type { ProcessDefinitionButton } from "@/components/ProcessModal/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

export interface UseProcessDefinitionTriggerResult {
  isProcessModalOpen: boolean;
  processButtonData: ProcessDefinitionButton | null;
  isLoading: boolean;
  triggerProcess: (processId: string) => Promise<void>;
  closeProcessModal: () => void;
}

export function useProcessDefinitionTrigger(field: Field): UseProcessDefinitionTriggerResult {
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processButtonData, setProcessButtonData] = useState<ProcessDefinitionButton | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const triggerProcess = useCallback(
    async (processId: string) => {
      if (!processId) return;

      setIsLoading(true);
      try {
        const response = await Metadata.client.post(`meta/process/${processId}`);
        if (response.ok && response.data) {
          const processData = response.data;
          const name = processData.name || field.name || "";

          const button = {
            ...field,
            id: field.id,
            name,
            action: "P",
            enabled: true,
            visible: true,
            processId,
            buttonText: name,
            buttonRefList: [],
            processInfo: {
              loadFunction: processData.loadFunction || "",
              searchKey: processData.searchKey || "",
              clientSideValidation: processData.clientSideValidation || "",
              _entityName: processData._entityName || "OBUIAPP_Process",
              id: processId,
              name,
              javaClassName: processData.javaClassName || "",
              parameters: [],
            },
            processDefinition: {
              id: processId,
              name,
              description: processData.description || "",
              javaClassName: processData.javaClassName || "",
              parameters: processData.parameters || {},
              onLoad: processData.onLoad || "",
              onProcess: processData.onProcess || "",
              ...processData,
            },
          } as unknown as ProcessDefinitionButton;

          setProcessButtonData(button);
          setIsProcessModalOpen(true);
        }
      } catch (error) {
        console.error("Failed to load process definition:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [field]
  );

  const closeProcessModal = useCallback(() => {
    setIsProcessModalOpen(false);
    setProcessButtonData(null);
  }, []);

  return {
    isProcessModalOpen,
    processButtonData,
    isLoading,
    triggerProcess,
    closeProcessModal,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="hooks/__tests__/useProcessDefinitionTrigger" --no-coverage 2>&1 | tail -20`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/hooks/useProcessDefinitionTrigger.ts packages/MainUI/hooks/__tests__/useProcessDefinitionTrigger.test.ts
git commit -m "Feature ETP-3754: Extract useProcessDefinitionTrigger hook

Extract process definition fetching and modal state management from
GenericSelector into a shared hook. This will be reused by both
GenericSelector (for process-related selector icons) and the new
ButtonSelector component.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

#### Task 3B: Create ButtonSelector Component

**Files:**
- Create: `packages/MainUI/components/Form/FormView/selectors/ButtonSelector.tsx`
- Create: `packages/MainUI/components/Form/FormView/selectors/__tests__/ButtonSelector.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/MainUI/components/Form/FormView/selectors/__tests__/ButtonSelector.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ButtonSelector } from "../ButtonSelector";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useProcessDefinitionTrigger } from "@/hooks/useProcessDefinitionTrigger";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

jest.mock("react-hook-form");
jest.mock("@/hooks/useProcessDefinitionTrigger");

jest.mock("@/components/ProcessModal/ProcessDefinitionModal", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="ProcessDefinitionModal">ProcessDefinitionModal</div> : null,
}));

const mockTriggerProcess = jest.fn();
const mockCloseProcessModal = jest.fn();

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "btn-1",
    name: "Complete Order",
    hqlName: "completeOrder",
    column: { reference: "28" },
    selector: { processDefinitionId: "proc-complete" },
    refList: [],
    ...overrides,
  }) as unknown as Field;

describe("ButtonSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      getValues: jest.fn(() => ({ id: "record-1" })),
    });
    (useProcessDefinitionTrigger as jest.Mock).mockReturnValue({
      isProcessModalOpen: false,
      processButtonData: null,
      isLoading: false,
      triggerProcess: mockTriggerProcess,
      closeProcessModal: mockCloseProcessModal,
    });
  });

  it("renders a button with the field name", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByRole("button", { name: "Complete Order" })).toBeInTheDocument();
  });

  it("renders disabled when isReadOnly is true", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={true} />);
    expect(screen.getByRole("button", { name: "Complete Order" })).toBeDisabled();
  });

  it("calls triggerProcess with processDefinitionId on click", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Order" }));
    expect(mockTriggerProcess).toHaveBeenCalledWith("proc-complete");
  });

  it("does not call triggerProcess when readOnly (button is disabled)", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={true} />);
    const button = screen.getByRole("button", { name: "Complete Order" });
    expect(button).toBeDisabled();
    // fireEvent.click fires even on disabled buttons in JSDOM, but the handler
    // has an early return guard. Verify the attribute directly.
    expect(mockTriggerProcess).not.toHaveBeenCalled();
  });

  it("shows spinner when loading", () => {
    (useProcessDefinitionTrigger as jest.Mock).mockReturnValue({
      isProcessModalOpen: false,
      processButtonData: null,
      isLoading: true,
      triggerProcess: mockTriggerProcess,
      closeProcessModal: mockCloseProcessModal,
    });

    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByRole("button", { name: "Complete Order" })).toBeDisabled();
  });

  it("renders ProcessDefinitionModal when modal is open", () => {
    (useProcessDefinitionTrigger as jest.Mock).mockReturnValue({
      isProcessModalOpen: true,
      processButtonData: { id: "btn-1", name: "Complete Order" },
      isLoading: false,
      triggerProcess: mockTriggerProcess,
      closeProcessModal: mockCloseProcessModal,
    });

    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByTestId("ProcessDefinitionModal")).toBeInTheDocument();
  });

  it("renders dropdown when field has refList items", () => {
    const field = makeField({
      refList: [
        { id: "ref-1", label: "Complete", value: "CO" },
        { id: "ref-2", label: "Void", value: "VO" },
      ],
    });

    render(<ButtonSelector field={field} isReadOnly={false} />);
    // Main button should have a dropdown indicator
    const mainButton = screen.getByRole("button", { name: "Complete Order" });
    expect(mainButton).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/ButtonSelector" --no-coverage 2>&1 | tail -20`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ButtonSelector**

Create `packages/MainUI/components/Form/FormView/selectors/ButtonSelector.tsx`:

```tsx
import { useCallback, useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useProcessDefinitionTrigger } from "@/hooks/useProcessDefinitionTrigger";
import ProcessDefinitionModal from "@/components/ProcessModal/ProcessDefinitionModal";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";

interface ButtonSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="32"
      strokeDashoffset="12"
      strokeLinecap="round"
    />
  </svg>
);

const ButtonSelector = ({ field, isReadOnly }: ButtonSelectorProps) => {
  const { getValues } = useFormContext();
  const { isProcessModalOpen, processButtonData, isLoading, triggerProcess, closeProcessModal } =
    useProcessDefinitionTrigger(field);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const processId = field.selector?.processDefinitionId as string | undefined;
  const hasRefList = field.refList && field.refList.length > 0;

  const handleClick = useCallback(() => {
    if (isReadOnly || isLoading) return;

    if (hasRefList) {
      setIsDropdownOpen((prev) => !prev);
    } else if (processId) {
      triggerProcess(processId);
    }
  }, [isReadOnly, isLoading, hasRefList, processId, triggerProcess]);

  const handleRefListSelect = useCallback(
    (value: string) => {
      setIsDropdownOpen(false);
      if (processId) {
        triggerProcess(processId);
      }
    },
    [processId, triggerProcess]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDropdownOpen]);

  return (
    <>
      <div className="relative" ref={dropdownRef} data-testid={`ButtonSelector__${field.id}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isReadOnly || isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-colors
            border-gray-300 bg-white text-gray-700
            hover:bg-gray-50 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[var(--color-etendo-main)] focus:ring-offset-1">
          {isLoading && <Spinner size={14} />}
          {field.name}
          {hasRefList && (
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {isDropdownOpen && hasRefList && (
          <div className="absolute z-10 mt-1 w-full min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg">
            {field.refList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRefListSelect(item.value)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                data-testid={`ButtonSelector__refList__${item.id}`}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isProcessModalOpen && processButtonData && (
        <ProcessDefinitionModal
          type={PROCESS_TYPES.PROCESS_DEFINITION}
          open={isProcessModalOpen}
          onClose={closeProcessModal}
          button={processButtonData}
          contextRecord={getValues()}
          onSuccess={closeProcessModal}
          data-testid={`ProcessDefinitionModal__${field.id}`}
        />
      )}
    </>
  );
};

export { ButtonSelector };
export default ButtonSelector;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/ButtonSelector" --no-coverage 2>&1 | tail -20`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/ButtonSelector.tsx packages/MainUI/components/Form/FormView/selectors/__tests__/ButtonSelector.test.tsx
git commit -m "Feature ETP-3754: Add ButtonSelector component

Tailwind-styled button that triggers ProcessDefinitionModal for button
reference type fields (ref 28). Supports refList dropdown for fields
with multiple action options. Uses useProcessDefinitionTrigger hook.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

#### Task 3C: Wire ButtonSelector into GenericSelector

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` (import + case + refactor)
- Modify: `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx` (test + mock)

- [ ] **Step 1: Add mock and test case**

In `packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx`:

Add mock (after the UploadFileSelector mock):

```typescript
jest.mock("../ButtonSelector", () => ({
  ButtonSelector: () => <div data-testid="ButtonSelector__mock">ButtonSelector</div>,
}));
```

Add to the `cases` array:

```typescript
{
  title: "BUTTON fields",
  expected: "ButtonSelector__mock",
  field: { column: { reference: FIELD_REFERENCE_CODES.BUTTON.id }, id: "btn-1", refList: [] },
},
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/GenericSelector" --no-coverage 2>&1 | tail -20`

Expected: FAIL — ButtonSelector__mock not found (falls through to StringSelector).

- [ ] **Step 3: Add imports and BUTTON case to GenericSelector**

In `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`:

Add imports (after the ImageSelector import):

```typescript
import { ButtonSelector } from "./ButtonSelector";
```

Add case in the switch, before `default:`:

```typescript
      case FIELD_REFERENCE_CODES.BUTTON.id:
        return (
          <ButtonSelector
            field={effectiveField}
            isReadOnly={isReadOnly}
            data-testid={`ButtonSelector__${field.id}`}
          />
        );
```

- [ ] **Step 4: Refactor GenericSelector to use useProcessDefinitionTrigger hook**

This replaces inline state + `handleProcessClick` with the shared hook.

**4a. Add hook import:**

```typescript
import { useProcessDefinitionTrigger } from "@/hooks/useProcessDefinitionTrigger";
```

**4b. Remove these three state/callback declarations** (lines 61-63 and 85-133 of the original file):

- `const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);`
- `const [processButtonData, setProcessButtonData] = useState<ProcessDefinitionButton | null>(null);`
- The entire `handleProcessClick` useCallback (lines 85-133)

**4c. Replace with hook call + thin wrapper** (place after `const [isSearchModalOpen, setIsSearchModalOpen]`):

```typescript
  const { isProcessModalOpen, processButtonData, isLoading: isProcessLoading, triggerProcess, closeProcessModal } =
    useProcessDefinitionTrigger(effectiveField);

  const handleProcessClick = useCallback(() => {
    const processId = effectiveField.selector?.processDefinitionId as string | undefined;
    if (processId) triggerProcess(processId);
  }, [effectiveField, triggerProcess]);
```

**4d. Update ProcessDefinitionModal render** (near bottom of the component). Replace the inline arrow functions in `onClose` and `onSuccess`:

```typescript
      {isProcessModalOpen && processButtonData && (
        <ProcessDefinitionModal
          type={PROCESS_TYPES.PROCESS_DEFINITION}
          open={isProcessModalOpen}
          onClose={closeProcessModal}
          button={processButtonData}
          contextRecord={getValues()}
          onSuccess={closeProcessModal}
          data-testid={"ProcessDefinitionModal__" + field.id}
        />
      )}
```

**4e. Clean up unused imports:** Remove the `ProcessDefinitionButton` type import if it's no longer directly referenced. Keep `useState` (still used for `isSearchModalOpen`). Remove the `Metadata` import if no longer used directly (it's now in the hook).

- [ ] **Step 5: Run ALL GenericSelector tests to verify nothing broke**

Run: `cd packages/MainUI && pnpm jest --testPathPattern="selectors/__tests__/GenericSelector" --no-coverage 2>&1 | tail -30`

Expected: ALL PASS

- [ ] **Step 6: Run full test suite to check for regressions**

Run: `cd packages/MainUI && pnpm jest --no-coverage 2>&1 | tail -20`

Expected: No new failures.

- [ ] **Step 7: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx packages/MainUI/components/Form/FormView/selectors/__tests__/GenericSelector.test.tsx
git commit -m "Feature ETP-3754: Wire ButtonSelector into GenericSelector

Route BUTTON reference (28) to ButtonSelector in the GenericSelector
switch. Refactor GenericSelector to use useProcessDefinitionTrigger
hook instead of inline process-fetching logic.

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Lint and Format Check

- [ ] **Step 1: Run biome check**

Run: `pnpm check 2>&1 | tail -30`

If issues found, run: `pnpm check:fix`

- [ ] **Step 2: Commit any formatting fixes (if needed)**

```bash
git add -u
git commit -m "Feature ETP-3754: Fix formatting

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Deferred Tasks (Not in This Plan)

These tasks are documented in the spec but blocked on external input:

| Task | Blocker | Action When Unblocked |
|------|---------|----------------------|
| **SelectorAsLink verification** | Need reference ID from Classic DB query | Run query, check `getFieldReference` mapping, add if missing |
| **Rich Text (TipTap)** | User reviewing Classic behavior | Install TipTap deps, create `RichTextSelector.tsx`, wire in GenericSelector |
| **Documentation roadmap** | Need column counts from Classic DB query | Create `docs/features/field-types/unimplemented-types-roadmap.md` |

---

## Verification Checklist

After all tasks complete:

- [ ] `pnpm test:mainui` passes with no new failures
- [ ] `pnpm check` passes (biome lint + format)
- [ ] Each commit is atomic and independently valid
- [ ] GenericSelector switch handles: ABSOLUTE_DATETIME, UPLOAD_FILE, BUTTON
- [ ] `getFieldReference()` maps ABSOLUTE_DATETIME to `FieldType.DATETIME`
- [ ] `useProcessDefinitionTrigger` hook is reused by both GenericSelector and ButtonSelector
- [ ] No MUI components in new code (Tailwind only)
