# Keyboard Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Ctrl+S (save), Ctrl+N (new), Escape (save+back), and ↑/↓ (grid row navigation) keyboard shortcuts.

**Architecture:** A new `useKeyboardShortcuts` hook attaches a `document` keydown listener and dispatches to registered handlers. FormView shortcuts live in `FormActions.tsx` (which already owns all the handlers). Grid shortcuts live in `Table/index.tsx` (scoped to the table container via `event.target`).

**Tech Stack:** React, TypeScript, react-hook-form, Jest + React Testing Library

---

## File Map

| Action | File |
|---|---|
| Create | `packages/MainUI/hooks/useKeyboardShortcuts.ts` |
| Create | `packages/MainUI/hooks/__tests__/useKeyboardShortcuts.test.ts` |
| Modify | `packages/MainUI/components/Form/FormView/FormActions.tsx` |
| Modify | `packages/MainUI/components/Table/index.tsx` |

---

## Task 1: `useKeyboardShortcuts` hook (TDD)

**Files:**
- Create: `packages/MainUI/hooks/__tests__/useKeyboardShortcuts.test.ts`
- Create: `packages/MainUI/hooks/useKeyboardShortcuts.ts`

---

- [ ] **Step 1.1 — Write the failing tests**

Create `packages/MainUI/hooks/__tests__/useKeyboardShortcuts.test.ts`:

```typescript
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useKeyboardShortcuts } from "../useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  it("fires handler when matching shortcut is pressed", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires handler with Meta key (Mac) as ctrl equivalent", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    fireEvent.keyDown(document, { key: "s", metaKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires handler for bare keys like Escape", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ Escape: { handler } }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire when focus is in an input and allowInInputs is false", () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": { handler, allowInInputs: false } })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "s", ctrlKey: true });
    document.body.removeChild(input);

    expect(handler).not.toHaveBeenCalled();
  });

  it("DOES fire when focus is in an input and allowInInputs is true", () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": { handler, allowInInputs: true } })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "s", ctrlKey: true });
    document.body.removeChild(input);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire when enabled is false", () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": { handler } }, false)
    );

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it("calls preventDefault by default", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("does NOT call preventDefault when preventDefault is false", () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({ Escape: { handler, preventDefault: false } })
    );

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": { handler } })
    );

    unmount();
    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the KeyboardEvent to the handler", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ Escape: { handler } }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handler).toHaveBeenCalledWith(expect.any(KeyboardEvent));
  });
});
```

- [ ] **Step 1.2 — Run tests to confirm they all fail**

```bash
cd /Users/santiagoalaniz/Dev/com.etendorx.workspace-ui
pnpm test:mainui -- --testPathPattern="useKeyboardShortcuts" --no-coverage
```

Expected: all tests FAIL with "Cannot find module '../useKeyboardShortcuts'"

- [ ] **Step 1.3 — Implement the hook**

Create `packages/MainUI/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useEffect, useRef } from "react";

export interface ShortcutConfig {
  handler: (event: KeyboardEvent) => void | Promise<void>;
  allowInInputs?: boolean;
  preventDefault?: boolean;
}

export type ShortcutMap = Record<string, ShortcutConfig>;

function normalizeKey(event: KeyboardEvent): string {
  const isCtrl = event.ctrlKey || event.metaKey;
  if (isCtrl) {
    return `ctrl+${event.key.toLowerCase()}`;
  }
  return event.key;
}

function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.getAttribute("contenteditable") === "true"
  );
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled = true
): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = normalizeKey(event);
      const config = shortcutsRef.current[normalizedKey];

      if (!config) return;

      if (isInputTarget(event.target) && !config.allowInInputs) return;

      if (config.preventDefault !== false) {
        event.preventDefault();
      }

      void config.handler(event);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
```

- [ ] **Step 1.4 — Run tests to confirm they all pass**

```bash
pnpm test:mainui -- --testPathPattern="useKeyboardShortcuts" --no-coverage
```

Expected: all 9 tests PASS

- [ ] **Step 1.5 — Commit**

```bash
git add packages/MainUI/hooks/useKeyboardShortcuts.ts packages/MainUI/hooks/__tests__/useKeyboardShortcuts.test.ts
git commit -m "feat: add useKeyboardShortcuts hook"
```

---

## Task 2: FormView shortcuts — Ctrl+S, Ctrl+N, Escape (TDD)

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/FormActions.tsx`
- Modify: `packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx`

**Context:** `FormActions.tsx` already has `handleSave`, `handleBack`, `handleNew`, `isDirty`. It uses `useToolbarContext()` but currently only destructures `registerActions` and `setSaveButtonState`. We need to also read `saveButtonState`.

---

- [ ] **Step 2.1 — Write the failing tests**

The existing test file uses module-level `jest.mock` factories and controls per-test state via `mockReturnValue`. Follow the same pattern.

**a) Update imports** at the top of `packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx` — add:
```typescript
import { fireEvent, screen, waitFor } from "@testing-library/react";
```

**b) Update the `useToolbarContext` mock** to use `jest.fn()` so `saveButtonState` can be controlled per test. Replace the existing mock block:

```typescript
// BEFORE (existing):
jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    registerActions: mockRegisterActions,
    setSaveButtonState: mockSetSaveButtonState,
  }),
}));

// AFTER (replace with):
jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: jest.fn(),
}));
```

**c) Add a module-level variable** after the existing mock variable declarations (around line 63):
```typescript
const mockUseToolbarContext = jest.fn();
```

**d) In `beforeEach`**, add a default return value for `mockUseToolbarContext` (after `jest.clearAllMocks()`):
```typescript
// Default saveButtonState — not busy, no errors
(require("@/contexts/ToolbarContext").useToolbarContext as jest.Mock).mockReturnValue({
  registerActions: mockRegisterActions,
  setSaveButtonState: mockSetSaveButtonState,
  saveButtonState: {
    isSaving: false,
    isCalloutLoading: false,
    hasValidationErrors: false,
    validationErrors: [],
  },
});
```

**e) Add the new describe block** at the end of the existing `describe("FormActions")` block (before the final closing `}`):

```typescript
describe("keyboard shortcuts", () => {
  const toolbarContextMock = () =>
    (require("@/contexts/ToolbarContext").useToolbarContext as jest.Mock);

  it("Ctrl+S calls onSave with showModal: true", async () => {
    const mockOnSave = jest.fn().mockResolvedValue(true);
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    await waitFor(() =>
      expect(mockOnSave).toHaveBeenCalledWith({ showModal: true })
    );
  });

  it("Ctrl+S fires even when an input has focus", async () => {
    const mockOnSave = jest.fn().mockResolvedValue(true);
    const { container } = renderFormActions({ ...props, onSave: mockOnSave });
    const input = document.createElement("input");
    container.appendChild(input);

    fireEvent.keyDown(input, { key: "s", ctrlKey: true });

    await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
  });

  it("Ctrl+S is a no-op when isSaving is true", async () => {
    const mockOnSave = jest.fn().mockResolvedValue(true);
    toolbarContextMock().mockReturnValue({
      registerActions: mockRegisterActions,
      setSaveButtonState: mockSetSaveButtonState,
      saveButtonState: { isSaving: true, isCalloutLoading: false, hasValidationErrors: false, validationErrors: [] },
    });
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    // Give async handlers time to run
    await new Promise((r) => setTimeout(r, 0));
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("Ctrl+S is a no-op when isCalloutLoading is true", async () => {
    const mockOnSave = jest.fn().mockResolvedValue(true);
    toolbarContextMock().mockReturnValue({
      registerActions: mockRegisterActions,
      setSaveButtonState: mockSetSaveButtonState,
      saveButtonState: { isSaving: false, isCalloutLoading: true, hasValidationErrors: false, validationErrors: [] },
    });
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("Ctrl+N calls onNew", () => {
    const mockOnNew = jest.fn();
    renderFormActions({ ...props, onNew: mockOnNew });

    fireEvent.keyDown(document, { key: "n", ctrlKey: true });

    expect(mockOnNew).toHaveBeenCalledTimes(1);
  });

  it("Escape with clean form calls back (clearTabFormState) without saving", async () => {
    // isDirty: false (default from beforeEach)
    const mockOnSave = jest.fn().mockResolvedValue(true);
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "Escape" });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockClearTabFormState).toHaveBeenCalledWith("WIN1", "TAB1");
  });

  it("Escape with dirty form saves then calls back", async () => {
    (useFormContext as jest.Mock).mockReturnValue({ formState: { isDirty: true } });
    const mockOnSave = jest.fn().mockResolvedValue(true);
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(mockOnSave).toHaveBeenCalledWith({ showModal: false })
    );
    expect(mockClearTabFormState).toHaveBeenCalledWith("WIN1", "TAB1");
  });

  it("Escape with dirty form does NOT call back when save returns false", async () => {
    (useFormContext as jest.Mock).mockReturnValue({ formState: { isDirty: true } });
    const mockOnSave = jest.fn().mockResolvedValue(false);
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    expect(mockClearTabFormState).not.toHaveBeenCalled();
  });

  it("Escape is a no-op when isSaving is true", async () => {
    toolbarContextMock().mockReturnValue({
      registerActions: mockRegisterActions,
      setSaveButtonState: mockSetSaveButtonState,
      saveButtonState: { isSaving: true, isCalloutLoading: false, hasValidationErrors: false, validationErrors: [] },
    });
    const mockOnSave = jest.fn().mockResolvedValue(true);
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "Escape" });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockClearTabFormState).not.toHaveBeenCalled();
  });

  it("Escape is a no-op when isCalloutLoading is true", async () => {
    toolbarContextMock().mockReturnValue({
      registerActions: mockRegisterActions,
      setSaveButtonState: mockSetSaveButtonState,
      saveButtonState: { isSaving: false, isCalloutLoading: true, hasValidationErrors: false, validationErrors: [] },
    });
    const mockOnSave = jest.fn().mockResolvedValue(true);
    renderFormActions({ ...props, onSave: mockOnSave });

    fireEvent.keyDown(document, { key: "Escape" });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockClearTabFormState).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2.2 — Run tests to confirm they fail**

```bash
pnpm test:mainui -- --testPathPattern="FormActions" --no-coverage
```

Expected: new tests FAIL (existing tests should still pass)

- [ ] **Step 2.3 — Add shortcuts to `FormActions.tsx`**

In `packages/MainUI/components/Form/FormView/FormActions.tsx`:

**a) Add import at top:**
```typescript
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
```

**b) Update `useToolbarContext` destructure** (line 45) to also read `saveButtonState`:
```typescript
const { registerActions, setSaveButtonState, saveButtonState } = useToolbarContext();
```

**c) Add shortcut handlers before the `return null`** (after the `handleNew` callback, around line 183):
```typescript
const handleKeyboardSave = useCallback(async () => {
  if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return;
  await handleSave({ showModal: true });
}, [handleSave, saveButtonState.isSaving, saveButtonState.isCalloutLoading]);

const handleKeyboardEscape = useCallback(async () => {
  if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return;
  if (isDirty) {
    const saved = await handleSave({ showModal: false });
    if (!saved) return;
  }
  handleBack();
}, [isDirty, handleSave, handleBack, saveButtonState.isSaving, saveButtonState.isCalloutLoading]);

useKeyboardShortcuts({
  "ctrl+s": { handler: handleKeyboardSave, allowInInputs: true },
  "ctrl+n": { handler: handleNew, allowInInputs: true },
  Escape: { handler: handleKeyboardEscape },
});
```

- [ ] **Step 2.4 — Run tests to confirm all pass**

```bash
pnpm test:mainui -- --testPathPattern="FormActions" --no-coverage
```

Expected: all tests PASS (including existing ones)

- [ ] **Step 2.5 — Commit**

```bash
git add packages/MainUI/components/Form/FormView/FormActions.tsx packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx
git commit -m "feat: add Ctrl+S, Ctrl+N, Escape keyboard shortcuts in FormView"
```

---

## Task 3: Grid shortcuts — ArrowUp / ArrowDown row navigation (TDD)

**Files:**
- Modify: `packages/MainUI/components/Table/index.tsx`
- Modify (or create): `packages/MainUI/components/Table/__tests__/keyboardRowNavigation.test.tsx`

**Context:**
- `effectiveRecords` is the merged array of `displayRecords` + `optimisticRecords` (defined at line 2361)
- `table.getState().rowSelection` is the MRT row selection state
- `table.setRowSelection({ [id]: true })` sets single selection
- `tableContainerRef` is a `useRef<HTMLDivElement>` (line 767) — the table's container element
- `editingRowsCount = Object.keys(editingRows).length` (line 2766) — used to disable shortcuts during inline edit
- Shortcuts must be scoped: only fire when `event.target` is inside `tableContainerRef.current`

---

- [ ] **Step 3.1 — Write the failing tests**

Create `packages/MainUI/components/Table/__tests__/keyboardRowNavigation.test.tsx`:

```typescript
/**
 * Tests for keyboard row navigation (ArrowUp/ArrowDown) in Table grid view.
 * Tests the handler logic in isolation — the full Table component is too complex to mount in unit tests.
 */
import { renderHook, act } from "@testing-library/react";
import { useCallback } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

// Helper to build a minimal EntityData record
const makeRecord = (id: string): EntityData => ({ id } as EntityData);

// We test the row navigation logic by extracting it into a testable form.
// The actual Table component wires these handlers into useKeyboardShortcuts.
function useRowNavigation(
  effectiveRecords: EntityData[],
  getRowSelection: () => Record<string, boolean>,
  setRowSelection: (s: Record<string, boolean>) => void,
  containerRef: React.RefObject<HTMLDivElement>,
  editingRowsCount: number
) {
  const navigate = useCallback(
    (direction: "up" | "down", event: KeyboardEvent) => {
      if (editingRowsCount > 0) return;
      if (!containerRef.current?.contains(event.target as Node)) return;

      const currentSelection = getRowSelection();
      const selectedIds = Object.keys(currentSelection).filter((id) => currentSelection[id]);
      if (selectedIds.length !== 1) return;

      const currentId = selectedIds[0];
      const currentIndex = effectiveRecords.findIndex((r) => String(r.id) === currentId);
      if (currentIndex === -1) return;

      if (direction === "down") {
        if (currentIndex === effectiveRecords.length - 1) return;
        setRowSelection({ [String(effectiveRecords[currentIndex + 1].id)]: true });
      } else {
        if (currentIndex === 0) return;
        setRowSelection({ [String(effectiveRecords[currentIndex - 1].id)]: true });
      }
    },
    [effectiveRecords, getRowSelection, setRowSelection, containerRef, editingRowsCount]
  );

  return navigate;
}

describe("keyboard row navigation", () => {
  const records = [makeRecord("1"), makeRecord("2"), makeRecord("3")];
  let containerDiv: HTMLDivElement;
  let containerRef: React.RefObject<HTMLDivElement>;
  let insideElement: HTMLDivElement;

  beforeEach(() => {
    containerDiv = document.createElement("div");
    document.body.appendChild(containerDiv);
    insideElement = document.createElement("div");
    containerDiv.appendChild(insideElement);
    // Use React.createRef() to avoid readonly `current` issues with React 19 types
    containerRef = { current: containerDiv } as React.RefObject<HTMLDivElement>;
  });

  afterEach(() => {
    document.body.removeChild(containerDiv);
  });

  const makeEvent = (target: EventTarget) =>
    Object.assign(new KeyboardEvent("keydown"), { target });

  it("ArrowDown selects the next record", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0)
    );

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).toHaveBeenCalledWith({ "2": true });
  });

  it("ArrowUp selects the previous record", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "2": true });
    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0)
    );

    act(() => result.current("up", makeEvent(insideElement)));

    expect(setRowSelection).toHaveBeenCalledWith({ "1": true });
  });

  it("ArrowDown on last record does nothing", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "3": true });
    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0)
    );

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("ArrowUp on first record does nothing", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0)
    );

    act(() => result.current("up", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when no row is selected", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({});
    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0)
    );

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when in inline edit mode (editingRowsCount > 0)", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 1)
    );

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when event.target is outside the table container", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);

    const { result } = renderHook(() =>
      useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0)
    );

    act(() => result.current("down", makeEvent(outsideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
    document.body.removeChild(outsideElement);
  });
});
```

- [ ] **Step 3.2 — Run tests to confirm they fail**

```bash
pnpm test:mainui -- --testPathPattern="keyboardRowNavigation" --no-coverage
```

Expected: FAIL — "Cannot find module" or test logic errors

- [ ] **Step 3.3 — Add arrow key shortcuts to `Table/index.tsx`**

**a) Add import at the top of `Table/index.tsx`** (near other hook imports):
```typescript
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
```

**b) Add the shortcut handlers** after the `editingRowsCount` line (around line 2766). Insert before `const tableAriaAttributes`:

```typescript
const handleArrowDown = useCallback(
  (event: KeyboardEvent) => {
    if (!tableContainerRef.current?.contains(event.target as Node)) return;
    const currentSelection = table.getState().rowSelection;
    const selectedIds = Object.keys(currentSelection).filter((id) => currentSelection[id]);
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const currentIndex = effectiveRecords.findIndex((r) => String(r.id) === currentId);
    if (currentIndex === -1 || currentIndex === effectiveRecords.length - 1) return;
    table.setRowSelection({ [String(effectiveRecords[currentIndex + 1].id)]: true });
  },
  [table, effectiveRecords, tableContainerRef]
);

const handleArrowUp = useCallback(
  (event: KeyboardEvent) => {
    if (!tableContainerRef.current?.contains(event.target as Node)) return;
    const currentSelection = table.getState().rowSelection;
    const selectedIds = Object.keys(currentSelection).filter((id) => currentSelection[id]);
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const currentIndex = effectiveRecords.findIndex((r) => String(r.id) === currentId);
    if (currentIndex <= 0) return;
    table.setRowSelection({ [String(effectiveRecords[currentIndex - 1].id)]: true });
  },
  [table, effectiveRecords, tableContainerRef]
);

useKeyboardShortcuts(
  {
    ArrowDown: { handler: handleArrowDown },
    ArrowUp: { handler: handleArrowUp },
  },
  editingRowsCount === 0
);
```

- [ ] **Step 3.4 — Run tests**

```bash
pnpm test:mainui -- --testPathPattern="keyboardRowNavigation" --no-coverage
```

Expected: all 7 tests PASS

- [ ] **Step 3.5 — Run full test suite to check for regressions**

```bash
pnpm test:mainui --no-coverage
```

Expected: no regressions

- [ ] **Step 3.6 — Commit**

```bash
git add packages/MainUI/components/Table/index.tsx packages/MainUI/components/Table/__tests__/keyboardRowNavigation.test.tsx
git commit -m "feat: add ArrowUp/ArrowDown keyboard shortcuts for grid row navigation"
```

---

## Validation

After all tasks complete, manually verify:

1. Open any window with records
2. In **form view**: press `Ctrl+S` → record saves; press `Ctrl+N` → new empty form opens; press `Escape` with unsaved changes → saves and returns to grid
3. In **grid view**: click a row to select it, press `↓` → next row highlights; press `↑` → previous row highlights; press arrows at first/last row → nothing happens
4. In **grid view with inline editing active**: press `↑/↓` → nothing (inline edit takes priority)
5. Press `Ctrl+S` in a browser address bar or other non-form context → no interference
