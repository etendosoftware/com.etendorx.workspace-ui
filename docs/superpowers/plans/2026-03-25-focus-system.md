# Focus System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a per-window Focus System that tracks which tab section is active, scopes keyboard shortcuts to the focused section, and auto-saves the header when focus moves to a child tab (enabling Lines navigation without an explicit save).

**Architecture:** A new `FocusContext` (provided inside each `WindowProvider`) tracks `activeFocusId` and a map of registered regions with `onBlur` callbacks. Each `Tab` component registers itself via `useFocusRegion(tab.id, { onBlur })`. The `onBlur` for a tab auto-saves via `onSave` (ToolbarContext) if `hasFormChanges` (TabContext) is true. Tab click in `Tabs.tsx:handleClick` calls `setFocus(tab.id)` to transfer focus and trigger the previous region's auto-save fire-and-forget. `isFocused` is threaded as a prop so `DynamicTable` and `FormActions` only activate their keyboard shortcuts when their tab has focus.

**Tech Stack:** React context + hooks, `useToolbarContext` (`onSave: (options: SaveOptions) => Promise<boolean>`), `useTabContext` (`hasFormChanges`), `useKeyboardShortcuts`.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| CREATE | `packages/MainUI/contexts/focus.tsx` | FocusContext + FocusProvider |
| CREATE | `packages/MainUI/hooks/useFocusRegion.ts` | Per-tab focus registration hook |
| CREATE | `packages/MainUI/contexts/__tests__/focus.test.tsx` | FocusContext unit tests |
| CREATE | `packages/MainUI/hooks/__tests__/useFocusRegion.test.ts` | useFocusRegion unit tests |
| MODIFY | `packages/MainUI/contexts/window.tsx` (line ~895) | Wrap children with `<FocusProvider>` |
| MODIFY | `packages/MainUI/components/window/Tabs.tsx` (line ~78) | Call `setFocus(tab.id)` in `handleClick` |
| MODIFY | `packages/MainUI/components/window/Tab.tsx` (line ~109) | `useFocusRegion` with auto-save `onBlur`, pass `isFocused`/`onFocusAcquire` to children |
| MODIFY | `packages/MainUI/components/Table/index.tsx` (line 620, 3051) | Add `isFocused`/`onFocusAcquire` props; update `useKeyboardShortcuts` enabled condition; call `acquire()` on row click |
| MODIFY | `packages/MainUI/components/Form/FormView/types.ts` (line 58) | Add `isFocused`/`onFocusAcquire` to `FormViewProps` |
| MODIFY | `packages/MainUI/components/Form/FormView/index.tsx` (line 1037) | Thread `isFocused` to `FormActions`; add root div `onClick={onFocusAcquire}` |
| MODIFY | `packages/MainUI/components/Form/FormView/FormActions.tsx` (line 32, 200) | Add `isFocused` to `FormActionsProps`; gate `useKeyboardShortcuts` with `isFocused ?? true` |

---

## Task 1: FocusContext

**Files:**
- Create: `packages/MainUI/contexts/focus.tsx`
- Create: `packages/MainUI/contexts/__tests__/focus.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/MainUI/contexts/__tests__/focus.test.tsx
import { renderHook, act } from "@testing-library/react";
import { FocusProvider, useFocusContext } from "../focus";

const wrapper = ({ children }: React.PropsWithChildren) => (
  <FocusProvider>{children}</FocusProvider>
);

describe("FocusContext", () => {
  it("starts with activeFocusId = null", () => {
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    expect(result.current.activeFocusId).toBeNull();
  });

  it("setFocus updates activeFocusId", () => {
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => result.current.setFocus("tab-1"));
    expect(result.current.activeFocusId).toBe("tab-1");
  });

  it("setFocus calls onBlur of the previous region", () => {
    const onBlur = jest.fn();
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => {
      result.current.registerRegion({ id: "tab-1", onBlur });
      result.current.setFocus("tab-1");
    });
    act(() => result.current.setFocus("tab-2"));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("setFocus to same id is a no-op (onBlur not called)", () => {
    const onBlur = jest.fn();
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => {
      result.current.registerRegion({ id: "tab-1", onBlur });
      result.current.setFocus("tab-1");
    });
    act(() => result.current.setFocus("tab-1"));
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("unregisterRegion removes the region so onBlur is not called", () => {
    const onBlur = jest.fn();
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => {
      result.current.registerRegion({ id: "tab-1", onBlur });
      result.current.setFocus("tab-1");
    });
    act(() => result.current.unregisterRegion("tab-1"));
    act(() => result.current.setFocus("tab-2"));
    expect(onBlur).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:mainui -- --testPathPattern="contexts/__tests__/focus"
```
Expected: FAIL — `FocusProvider` not found.

- [ ] **Step 3: Implement FocusContext**

```typescript
// packages/MainUI/contexts/focus.tsx
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

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

interface FocusRegion {
  id: string;
  onBlur?: () => Promise<void> | void;
}

interface FocusContextI {
  activeFocusId: string | null;
  setFocus: (id: string) => void;
  registerRegion: (region: FocusRegion) => void;
  unregisterRegion: (id: string) => void;
}

const FocusContext = createContext<FocusContextI>({} as FocusContextI);

export function FocusProvider({ children }: React.PropsWithChildren) {
  const [activeFocusId, setActiveFocusId] = useState<string | null>(null);
  // Ref tracks latest activeFocusId synchronously to avoid stale closure in setFocus
  const activeFocusIdRef = useRef<string | null>(null);
  const regionsRef = useRef<Map<string, FocusRegion>>(new Map());

  const registerRegion = useCallback((region: FocusRegion) => {
    regionsRef.current.set(region.id, region);
  }, []);

  const unregisterRegion = useCallback((id: string) => {
    regionsRef.current.delete(id);
  }, []);

  const setFocus = useCallback((id: string) => {
    const prev = activeFocusIdRef.current;
    if (prev === id) return;

    // Fire onBlur for previous region (async, fire-and-forget — tab navigates immediately)
    const prevRegion = regionsRef.current.get(prev ?? "");
    prevRegion?.onBlur?.();

    activeFocusIdRef.current = id;
    setActiveFocusId(id);
  }, []);

  const value = useMemo(
    () => ({ activeFocusId, setFocus, registerRegion, unregisterRegion }),
    [activeFocusId, setFocus, registerRegion, unregisterRegion]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusContext() {
  return useContext(FocusContext);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:mainui -- --testPathPattern="contexts/__tests__/focus"
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/contexts/focus.tsx packages/MainUI/contexts/__tests__/focus.test.tsx
git commit -m "feat: add FocusContext for per-window tab focus management"
```

---

## Task 2: useFocusRegion Hook

**Files:**
- Create: `packages/MainUI/hooks/useFocusRegion.ts`
- Create: `packages/MainUI/hooks/__tests__/useFocusRegion.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/MainUI/hooks/__tests__/useFocusRegion.test.ts
import { renderHook, act } from "@testing-library/react";
import { FocusProvider } from "@/contexts/focus";
import { useFocusRegion } from "../useFocusRegion";

const wrapper = ({ children }: React.PropsWithChildren) => (
  <FocusProvider>{children}</FocusProvider>
);

describe("useFocusRegion", () => {
  it("isFocused is false initially", () => {
    const { result } = renderHook(() => useFocusRegion("tab-1"), { wrapper });
    expect(result.current.isFocused).toBe(false);
  });

  it("isFocused becomes true after acquire()", () => {
    const { result } = renderHook(() => useFocusRegion("tab-1"), { wrapper });
    act(() => result.current.acquire());
    expect(result.current.isFocused).toBe(true);
  });

  it("calls the previous region's onBlur when another region acquires focus", () => {
    const onBlurHeader = jest.fn();
    const { result } = renderHook(
      () => ({
        header: useFocusRegion("header", { onBlur: onBlurHeader }),
        lines: useFocusRegion("lines"),
      }),
      { wrapper }
    );

    act(() => result.current.header.acquire());
    act(() => result.current.lines.acquire());

    expect(onBlurHeader).toHaveBeenCalledTimes(1);
    expect(result.current.header.isFocused).toBe(false);
    expect(result.current.lines.isFocused).toBe(true);
  });

  it("onBlur always uses the latest closure (ref pattern)", () => {
    let callCount = 0;
    const makeOnBlur = () => jest.fn(() => { callCount++; });
    const onBlur1 = makeOnBlur();
    const onBlur2 = makeOnBlur();

    const { result, rerender } = renderHook(
      ({ onBlur }: { onBlur: () => void }) => ({
        header: useFocusRegion("header", { onBlur }),
        lines: useFocusRegion("lines"),
      }),
      { wrapper, initialProps: { onBlur: onBlur1 } }
    );

    act(() => result.current.header.acquire());
    // Rerender with a new onBlur (simulates state change in parent)
    rerender({ onBlur: onBlur2 });
    act(() => result.current.lines.acquire());

    // Should have called the LATEST onBlur (onBlur2), not onBlur1
    expect(onBlur1).not.toHaveBeenCalled();
    expect(onBlur2).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:mainui -- --testPathPattern="hooks/__tests__/useFocusRegion"
```
Expected: FAIL — `useFocusRegion` not found.

- [ ] **Step 3: Implement useFocusRegion**

```typescript
// packages/MainUI/hooks/useFocusRegion.ts
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

import { useCallback, useEffect, useRef } from "react";
import { useFocusContext } from "@/contexts/focus";

/**
 * Registers a component as a named focus region within the window's FocusContext.
 * Returns whether this region currently has focus, and an `acquire` function to request it.
 *
 * @param id - Unique focus region ID (use tab.id)
 * @param options.onBlur - Called (async, fire-and-forget) when another region acquires focus.
 *                         Used to trigger auto-save when the user navigates to a child tab.
 */
export function useFocusRegion(
  id: string,
  options?: { onBlur?: () => Promise<void> | void }
): { isFocused: boolean; acquire: () => void } {
  const { activeFocusId, setFocus, registerRegion, unregisterRegion } = useFocusContext();

  // Ref keeps onBlur fresh without causing re-registration on every render
  const onBlurRef = useRef(options?.onBlur);
  onBlurRef.current = options?.onBlur;

  useEffect(() => {
    registerRegion({
      id,
      onBlur: () => onBlurRef.current?.(),
    });
    return () => unregisterRegion(id);
  }, [id, registerRegion, unregisterRegion]);

  const acquire = useCallback(() => {
    setFocus(id);
  }, [id, setFocus]);

  return {
    isFocused: activeFocusId === id,
    acquire,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:mainui -- --testPathPattern="hooks/__tests__/useFocusRegion"
```
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/hooks/useFocusRegion.ts packages/MainUI/hooks/__tests__/useFocusRegion.test.ts
git commit -m "feat: add useFocusRegion hook for tab focus registration"
```

---

## Task 3: Provide FocusContext Inside WindowProvider

**Files:**
- Modify: `packages/MainUI/contexts/window.tsx` (line ~895)

The current return statement (line ~895):
```typescript
return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>;
```

- [ ] **Step 1: Add `FocusProvider` import**

At the top of `packages/MainUI/contexts/window.tsx`, add:
```typescript
import { FocusProvider } from "@/contexts/focus";
```

- [ ] **Step 2: Wrap children with FocusProvider**

Change line ~895:
```typescript
// Before:
return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>;

// After:
return (
  <WindowContext.Provider value={value}>
    <FocusProvider>{children}</FocusProvider>
  </WindowContext.Provider>
);
```

- [ ] **Step 3: Run all tests**

```bash
pnpm test:mainui
```
Expected: All existing tests PASS. (No new test needed — FocusContext is already tested in Task 1.)

- [ ] **Step 4: Commit**

```bash
git add packages/MainUI/contexts/window.tsx
git commit -m "feat: provide FocusContext inside each WindowProvider"
```

---

## Task 4: Transfer Focus on Tab Click

**Files:**
- Modify: `packages/MainUI/components/window/Tabs.tsx` (line ~78, `handleClick`)

`Tabs.tsx` renders one instance per tab group level. Its `handleClick` is the single place all tab buttons route their click events through (via `SubTabsSwitch` → `TabButton` → `onClick(tab)`).

- [ ] **Step 1: Add `useFocusContext` call and `setFocus` in `handleClick`**

```typescript
// Add import at top of Tabs.tsx:
import { useFocusContext } from "@/contexts/focus";

// Inside TabsComponent, add after existing hook calls:
const { setFocus } = useFocusContext();

// Modify handleClick — add setFocus as the very first call:
const handleClick = useCallback(
  (tab: TabType) => {
    // Transfer focus (triggers onBlur/auto-save on the previously focused tab)
    setFocus(tab.id);

    // Immediate visual feedback
    setActiveTabId(tab.id);

    if (current.id === tab.id) {
      setActiveLevel(tab.tabLevel);
      return;
    }

    startTransition(() => {
      setCustomHeight(50);
      setCurrent(tab);
      setActiveLevel(tab.tabLevel);
      setActiveTabsByLevel(tab);
    });
  },
  [setActiveLevel, startTransition, setActiveTabsByLevel, current.id, setFocus]
);
```

- [ ] **Step 2: Run existing Tabs tests**

```bash
pnpm test:mainui -- --testPathPattern="window/Tabs"
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/window/Tabs.tsx
git commit -m "feat: call setFocus on tab click to transfer window focus"
```

---

## Task 5: Tab.tsx — Register Focus Region with Auto-Save onBlur

**Files:**
- Modify: `packages/MainUI/components/window/Tab.tsx`

**Context:** `Tab.tsx` runs inside `TabContextProvider` (wrapped in `Tabs.tsx` lines 178–182), so `useTabContext()` is safe here. `useToolbarContext()` is already called at line 124. `SaveOptions` fields are all optional (`showModal?: boolean`, `skipFormStateUpdate?: boolean`), so `onSave({})` compiles without issue.

- [ ] **Step 1: Add imports**

```typescript
import { useFocusRegion } from "@/hooks/useFocusRegion";
import { useTabContext } from "@/contexts/tab";
```

- [ ] **Step 2: Destructure `onSave` from ToolbarContext**

Existing line 124:
```typescript
const { registerActions, setIsAdvancedFilterApplied } = useToolbarContext();
```
Change to:
```typescript
const { registerActions, setIsAdvancedFilterApplied, onSave } = useToolbarContext();
```

- [ ] **Step 3: Add focus region registration after existing hook calls**

```typescript
const { hasFormChanges } = useTabContext();

const { isFocused, acquire } = useFocusRegion(tab.id, {
  onBlur: async () => {
    if (hasFormChanges) {
      await onSave({});
    }
  },
});

// Level-0 tab (header) acquires focus on mount — sets initial focus for new windows
useEffect(() => {
  if (tab.tabLevel === 0) {
    acquire();
  }
}, [tab.tabLevel, acquire]);
```

- [ ] **Step 4: Pass `isFocused` and `onFocusAcquire` to DynamicTable and FormView**

Find the `<DynamicTable ... />` render in Tab.tsx and add:
```typescript
<DynamicTable
  {...existingProps}
  isFocused={isFocused}
  onFocusAcquire={acquire}
/>
```

Find the `<FormView ... />` render and add:
```typescript
<FormView
  {...existingProps}
  isFocused={isFocused}
  onFocusAcquire={acquire}
/>
```

- [ ] **Step 5: Run tests**

```bash
pnpm test:mainui -- --testPathPattern="window/Tab"
```
Expected: PASS (TypeScript may error until Tasks 6–7 add the prop types — fix those first if needed).

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/window/Tab.tsx
git commit -m "feat: register Tab as focus region with auto-save onBlur"
```

---

## Task 6: Table — Scope Arrow/Enter Shortcuts to Focused Tab

**Files:**
- Modify: `packages/MainUI/components/Table/index.tsx` (lines 620, 3051, row onClick)

- [ ] **Step 1: Add `isFocused` and `onFocusAcquire` to `DynamicTableProps`**

At line 620:
```typescript
interface DynamicTableProps {
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  onRecordSelection?: (recordId: string) => void;
  isTreeMode?: boolean;
  isVisible?: boolean;
  areFiltersDisabled?: boolean;
  uIPattern?: UIPattern;
  isFocused?: boolean;       // ADD
  onFocusAcquire?: () => void; // ADD
}
```

- [ ] **Step 2: Gate `useKeyboardShortcuts` with `isFocused`**

Current code at line 3051:
```typescript
useKeyboardShortcuts(
  {
    ArrowDown: { handler: handleArrowDown },
    ArrowUp: { handler: handleArrowUp },
    Enter: { handler: handleEnter },
  },
  editingRowsCount === 0
);
```
Change to:
```typescript
useKeyboardShortcuts(
  {
    ArrowDown: { handler: handleArrowDown },
    ArrowUp: { handler: handleArrowUp },
    Enter: { handler: handleEnter },
  },
  editingRowsCount === 0 && (isFocused ?? true)
);
```
Note: `isFocused ?? true` preserves backwards compatibility — if no `isFocused` prop is passed, shortcuts remain active (existing behavior).

- [ ] **Step 3: Call `onFocusAcquire` on row click**

In `muiTableBodyRowProps` onClick (where `tableContainerRef.current?.focus()` is already called), add:
```typescript
onFocusAcquire?.();
tableContainerRef.current?.focus();
```

- [ ] **Step 4: Run keyboard navigation tests**

```bash
pnpm test:mainui -- --testPathPattern="Table/__tests__/keyboardRowNavigation"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Table/index.tsx
git commit -m "feat: scope table keyboard shortcuts to focused tab, acquire focus on row click"
```

---

## Task 7: FormView — Scope Shortcuts and Acquire Focus on Click

Keyboard shortcuts for FormView live in `FormActions.tsx` (line 200), not `FormView/index.tsx`. The props must be threaded: `Tab.tsx` → `FormView/index.tsx` → `FormActions`.

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/types.ts` (line 58)
- Modify: `packages/MainUI/components/Form/FormView/index.tsx` (line 1037 + root div)
- Modify: `packages/MainUI/components/Form/FormView/FormActions.tsx` (line 32, 200)

- [ ] **Step 1: Add props to `FormViewProps`**

In `types.ts` at line 58:
```typescript
export interface FormViewProps {
  window?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  recordId?: string;
  onSave?: (saveFn: () => void) => void;
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  uIPattern?: UIPattern;
  isFocused?: boolean;        // ADD
  onFocusAcquire?: () => void; // ADD
}
```

- [ ] **Step 2: Thread `isFocused` to `FormActions` in `FormView/index.tsx`**

`FormView/index.tsx` line 1037 currently renders:
```typescript
<FormActions
  tab={tab}
  onNew={handleNewRecord}
  refetch={refreshRecordAndSession}
  onSave={handleSave}
  showErrorModal={showErrorModal}
  mode={currentMode}
  data-testid="FormActions__1a0853"
/>
```
Add `isFocused`:
```typescript
<FormActions
  tab={tab}
  onNew={handleNewRecord}
  refetch={refreshRecordAndSession}
  onSave={handleSave}
  showErrorModal={showErrorModal}
  mode={currentMode}
  isFocused={isFocused}
  data-testid="FormActions__1a0853"
/>
```

- [ ] **Step 3: Add `onClick={onFocusAcquire}` to the FormView root div**

Find the outermost wrapper div of the FormView JSX return in `FormView/index.tsx` and add the click handler:
```typescript
<div
  className={/* existing classes */}
  onClick={onFocusAcquire}
>
  {/* existing content */}
</div>
```

- [ ] **Step 4: Add `isFocused` to `FormActionsProps` and gate shortcuts**

In `FormActions.tsx` at line 32:
```typescript
interface FormActionsProps {
  tab: Tab;
  onNew: () => void;
  refetch: () => Promise<void>;
  onSave: (options: SaveOptions) => Promise<boolean>;
  showErrorModal: (message: string) => void;
  mode: FormMode;
  isFocused?: boolean;  // ADD
}
```

At line 41, destructure `isFocused`:
```typescript
export function FormActions({ tab, onNew, refetch, onSave, showErrorModal, mode, isFocused }: FormActionsProps) {
```

At line 200, add `isFocused ?? true` as the `enabled` parameter:
```typescript
// Before:
useKeyboardShortcuts({
  "ctrl+s": { handler: handleKeyboardSave, allowInInputs: true },
  "ctrl+n": { handler: handleNew, allowInInputs: true },
  Escape: { handler: handleKeyboardEscape },
});

// After:
useKeyboardShortcuts(
  {
    "ctrl+s": { handler: handleKeyboardSave, allowInInputs: true },
    "ctrl+n": { handler: handleNew, allowInInputs: true },
    Escape: { handler: handleKeyboardEscape },
  },
  isFocused ?? true
);
```

- [ ] **Step 5: Run all tests**

```bash
pnpm test:mainui
```
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/Form/FormView/types.ts \
        packages/MainUI/components/Form/FormView/index.tsx \
        packages/MainUI/components/Form/FormView/FormActions.tsx
git commit -m "feat: scope FormView keyboard shortcuts to focused tab, acquire focus on click"
```

---

## Task 8: Build Verification and Manual Smoke Test

- [ ] **Step 1: Run full test suite**

```bash
pnpm test:mainui
```
Expected: All tests PASS.

- [ ] **Step 2: TypeScript build check**

```bash
pnpm build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual verification checklist**

Open Etendo WorkspaceUI in the browser and verify:

1. **Lines tab unlock:** Open Sales Invoice (new record) → fill in Business Partner → click "Lines" tab → header auto-saves → if valid: Lines loads (empty, ready for input); if invalid: validation error appears, Lines shows "Select a parent record"
2. **Keyboard scope — table:** Select a row in Lines table → press ArrowDown → verify only Lines rows navigate (header table is unaffected)
3. **Keyboard scope — form:** Click inside header FormView → press Ctrl+S → verify only header saves
4. **No interference:** With header focused, pressing ArrowUp/Down should NOT navigate Lines rows
5. **Focus acquisition:** Click inside Lines table → press ArrowDown → verify navigation works (focus transferred correctly)
6. **Escape in Lines form:** Open Lines row in FormView → press Escape → verify return to Lines table (not header)

- [ ] **Step 4: Commit**

```bash
git add -p
git commit -m "chore: verify focus system integration"
```
