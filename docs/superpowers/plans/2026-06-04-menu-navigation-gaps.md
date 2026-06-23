# Menu & Navigation Gaps Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist menu collapse/expand state to localStorage and add an unsaved-changes confirmation dialog when closing a window tab with dirty form or table data.

**Architecture:** Two independent features. Gap 1 adds a `useExpandedMenuItems` hook wrapping `useLocalStorage` (same pattern as `useRecentItems`). Gap 2 adds a `dirtyWindows` registry to the existing Zustand `windowStore`, with form and table components reporting dirty state, and `WindowTabs` intercepting close with a `ConfirmModal` confirmation.

**Tech Stack:** React 19, TypeScript, Zustand (immer middleware), Jest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-06-04-menu-navigation-gaps-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/MainUI/hooks/useExpandedMenuItems.ts` | Create | Hook: persist menu expand state per role via localStorage |
| `packages/MainUI/hooks/__tests__/useExpandedMenuItems.test.ts` | Create | Unit tests for the hook |
| `packages/MainUI/components/Sidebar.tsx` | Modify | Wire hook in place of `useState` |
| `packages/MainUI/stores/windowStore.ts` | Modify | Add `dirtyWindows` state + `setWindowDirtySource` action + cleanup |
| `packages/MainUI/stores/__tests__/windowStore.dirty.test.ts` | Create | Unit tests for dirty registry |
| `packages/MainUI/components/Form/FormView/FormActions.tsx` | Modify | Report form dirty state to store |
| `packages/MainUI/components/Table/index.tsx` | Modify | Report table dirty state to store |
| `packages/MainUI/components/NavigationTabs/WindowTabs.tsx` | Modify | Dirty check + confirmation modal on close |

---

## Task 1: `useExpandedMenuItems` Hook

**Files:**
- Create: `packages/MainUI/hooks/useExpandedMenuItems.ts`
- Create: `packages/MainUI/hooks/__tests__/useExpandedMenuItems.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/MainUI/hooks/__tests__/useExpandedMenuItems.test.ts
import { renderHook, act } from "@testing-library/react";
import { useExpandedMenuItems } from "../useExpandedMenuItems";

// Mock useLocalStorage
const mockStorageState: Record<string, any> = {};
jest.mock("@workspaceui/componentlibrary/src/hooks/useLocalStorage", () => ({
  useLocalStorage: <T,>(key: string, initial: T) => {
    if (!(key in mockStorageState)) mockStorageState[key] = initial;
    const setState = (fn: any) => {
      mockStorageState[key] = typeof fn === "function" ? fn(mockStorageState[key]) : fn;
    };
    return [mockStorageState[key], setState] as const;
  },
}));

beforeEach(() => {
  for (const key of Object.keys(mockStorageState)) delete mockStorageState[key];
});

describe("useExpandedMenuItems", () => {
  it("returns empty set when no persisted state exists", () => {
    const { result } = renderHook(() => useExpandedMenuItems("role1"));
    expect(result.current.expandedItems.size).toBe(0);
  });

  it("persists expanded items and restores them", () => {
    const { result, rerender } = renderHook(
      ({ roleId }) => useExpandedMenuItems(roleId),
      { initialProps: { roleId: "role1" } }
    );

    act(() => {
      result.current.setExpandedItems(new Set(["menu1", "menu2"]));
    });

    rerender({ roleId: "role1" });
    expect(result.current.expandedItems).toEqual(new Set(["menu1", "menu2"]));
  });

  it("isolates state by role", () => {
    const { result, rerender } = renderHook(
      ({ roleId }) => useExpandedMenuItems(roleId),
      { initialProps: { roleId: "role1" } }
    );

    act(() => {
      result.current.setExpandedItems(new Set(["menuA"]));
    });

    rerender({ roleId: "role2" });
    expect(result.current.expandedItems.size).toBe(0);

    rerender({ roleId: "role1" });
    expect(result.current.expandedItems).toEqual(new Set(["menuA"]));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="useExpandedMenuItems" --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Write the hook implementation**

```typescript
// packages/MainUI/hooks/useExpandedMenuItems.ts
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";

export function useExpandedMenuItems(roleId: string) {
  const [storage, setStorage] = useLocalStorage<Record<string, string[]>>("menuExpandedItems", {});

  const expandedItems = useMemo(() => new Set(storage[roleId] ?? []), [storage, roleId]);

  const setExpandedItems = useCallback(
    (items: Set<string>) => {
      setStorage((prev) => ({ ...prev, [roleId]: Array.from(items) }));
    },
    [roleId, setStorage]
  );

  return { expandedItems, setExpandedItems };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="useExpandedMenuItems" --no-coverage`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/hooks/useExpandedMenuItems.ts packages/MainUI/hooks/__tests__/useExpandedMenuItems.test.ts
git commit -m "Feature ETP-3754: Add useExpandedMenuItems hook with localStorage persistence"
```

---

## Task 2: Wire `useExpandedMenuItems` into Sidebar

**Files:**
- Modify: `packages/MainUI/components/Sidebar.tsx`

- [ ] **Step 1: Replace useState with hook**

In `packages/MainUI/components/Sidebar.tsx`:

Add import:
```typescript
import { useExpandedMenuItems } from "../hooks/useExpandedMenuItems";
```

Replace line 203:
```typescript
const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
```
with:
```typescript
const currentRoleId = currentRole?.id ?? "";
const { expandedItems, setExpandedItems } = useExpandedMenuItems(currentRoleId);
```

Remove `useState` from the import if no longer used (check — `searchValue`, `pendingWindowId`, `showProcessDefinitionModal`, `selectedProcessDefinitionButton`, `processType` still use it, so keep it).

- [ ] **Step 2: Verify dev server still works**

Run: `pnpm --filter @workspaceui/mainui build`
Expected: Build succeeds with no type errors

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/Sidebar.tsx
git commit -m "Feature ETP-3754: Wire useExpandedMenuItems into Sidebar for persistent collapse state"
```

---

## Task 3: Add `dirtyWindows` Registry to `windowStore`

**Files:**
- Modify: `packages/MainUI/stores/windowStore.ts`
- Create: `packages/MainUI/stores/__tests__/windowStore.dirty.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/MainUI/stores/__tests__/windowStore.dirty.test.ts
import { useWindowStore } from "../windowStore";

beforeEach(() => {
  useWindowStore.setState({
    windows: {},
    dirtyWindows: {},
    isRecoveryLoading: false,
    recoveryError: null,
    triggerRecovery: () => {},
  });
});

describe("windowStore dirty registry", () => {
  it("marks a window dirty when a source is set", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);

    const state = useWindowStore.getState();
    expect(state.dirtyWindows["win1"]).toEqual({ "form:tab1": true });
  });

  it("removes a source key when set to false", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);
    store.setWindowDirtySource("win1", "form:tab1", false);

    const state = useWindowStore.getState();
    expect(state.dirtyWindows["win1"]).toEqual({});
  });

  it("tracks multiple sources per window", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);
    store.setWindowDirtySource("win1", "table:tab2", true);

    const state = useWindowStore.getState();
    expect(Object.values(state.dirtyWindows["win1"] ?? {}).some(Boolean)).toBe(true);

    store.setWindowDirtySource("win1", "form:tab1", false);
    expect(Object.values(useWindowStore.getState().dirtyWindows["win1"] ?? {}).some(Boolean)).toBe(true);

    store.setWindowDirtySource("win1", "table:tab2", false);
    expect(Object.values(useWindowStore.getState().dirtyWindows["win1"] ?? {}).some(Boolean)).toBe(false);
  });

  it("cleanupWindow removes dirtyWindows entry", () => {
    const store = useWindowStore.getState();
    // Create a window first so cleanupWindow has something to delete
    store.setWindowActive({ windowIdentifier: "win1", windowData: { title: "Test" } });
    store.setWindowDirtySource("win1", "form:tab1", true);

    store.cleanupWindow("win1");

    const state = useWindowStore.getState();
    expect(state.dirtyWindows["win1"]).toBeUndefined();
  });

  it("cleanState clears all dirtyWindows", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);
    store.setWindowDirtySource("win2", "table:tab2", true);

    store.cleanState();

    const state = useWindowStore.getState();
    expect(state.dirtyWindows).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="windowStore.dirty" --no-coverage`
Expected: FAIL — `dirtyWindows` / `setWindowDirtySource` not found

- [ ] **Step 3: Add dirtyWindows state and action to windowStore**

In `packages/MainUI/stores/windowStore.ts`:

1. Add to `WindowStore` interface (after `triggerRecovery`):

```typescript
  /** Tracks which windows have unsaved changes, keyed by source (e.g. "form:tabId", "table:tabId") */
  dirtyWindows: Record<string, Record<string, boolean>>;
  setWindowDirtySource: (windowIdentifier: string, sourceKey: string, isDirty: boolean) => void;
```

2. Add initial state in the store creation (after `triggerRecovery: () => {}`):

```typescript
      dirtyWindows: {},
```

3. Add the action (after the `cleanState` action, around line 382):

```typescript
      setWindowDirtySource: (windowIdentifier, sourceKey, isDirty) =>
        set(
          (draft) => {
            if (isDirty) {
              if (!draft.dirtyWindows[windowIdentifier]) {
                draft.dirtyWindows[windowIdentifier] = {};
              }
              draft.dirtyWindows[windowIdentifier][sourceKey] = true;
            } else {
              if (draft.dirtyWindows[windowIdentifier]) {
                delete draft.dirtyWindows[windowIdentifier][sourceKey];
              }
            }
          },
          false,
          "window/setWindowDirtySource"
        ),
```

4. Update `cleanupWindow` — add after `delete draft.windows[windowIdentifier]` (around line 354):

```typescript
            delete draft.dirtyWindows[windowIdentifier];
```

5. Update `cleanState` — add after `draft.windows = {}` (around line 378):

```typescript
            draft.dirtyWindows = {};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="windowStore.dirty" --no-coverage`
Expected: PASS (5 tests)

- [ ] **Step 5: Run existing windowStore tests to ensure no regressions**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="windowStore|metadataStore" --no-coverage`
Expected: All existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/stores/windowStore.ts packages/MainUI/stores/__tests__/windowStore.dirty.test.ts
git commit -m "Feature ETP-3754: Add dirtyWindows registry to windowStore"
```

---

## Task 4: Form Dirty State Reporting

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/FormActions.tsx`

- [ ] **Step 1: Refactor FormActions to use `useCurrentWindowIdentifier()`**

In `packages/MainUI/components/Form/FormView/FormActions.tsx`:

Add import:
```typescript
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
```

Replace lines 46-51:
```typescript
  const windowsObj = useWindowStore((s) => s.windows);
  const activeWindow = useMemo(() => {
    const wins = Object.values(windowsObj);
    return wins.find((w) => w.isActive) ?? null;
  }, [windowsObj]);
  const windowIdentifier = activeWindow?.windowIdentifier;
```

With:
```typescript
  const windowIdentifier = useCurrentWindowIdentifier();
```

Remove `useMemo` from the import list if no longer used elsewhere in the file (check — `requiredFieldNames` on line 60 still uses it, so keep it).

- [ ] **Step 2: Add dirty state reporting effect**

In `packages/MainUI/components/Form/FormView/FormActions.tsx`:

Add store selector (near the existing `clearTabFormState` line):
```typescript
  const setWindowDirtySource = useWindowStore((s) => s.setWindowDirtySource);
```

Add effect (after the existing `isDirty` / `markFormAsChanged` effect around line 87-92):
```typescript
  // Report form dirty state to windowStore for tab-close confirmation
  useEffect(() => {
    if (windowIdentifier) {
      setWindowDirtySource(windowIdentifier, `form:${tab.id}`, isDirty);
    }
    return () => {
      if (windowIdentifier) {
        setWindowDirtySource(windowIdentifier, `form:${tab.id}`, false);
      }
    };
  }, [isDirty, windowIdentifier, tab.id, setWindowDirtySource]);
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm --filter @workspaceui/mainui build`
Expected: Build succeeds

- [ ] **Step 4: Run existing FormActions tests**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="FormActions" --no-coverage`
Expected: Existing tests still pass (may need to add `useCurrentWindowIdentifier` mock — check test file)

- [ ] **Step 5: Update test mocks**

In `packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx`:

1. `useCurrentWindowIdentifier` is already mocked (line ~116-117). No change needed for that.

2. The `useWindowStore` mock selector (line ~98-114) returns an object with `clearTabFormState` and the old `windows` selector. After the refactor, `windows` is no longer read by FormActions — it's harmless but unused. Add `setWindowDirtySource` to the selector return:

```typescript
// Find the existing useWindowStore mock selector return object and add:
setWindowDirtySource: jest.fn(),
```

This goes alongside the existing `clearTabFormState: mockClearTabFormState` in the selector mock.

- [ ] **Step 6: Run tests again to confirm**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="FormActions" --no-coverage`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/MainUI/components/Form/FormView/FormActions.tsx packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx
git commit -m "Feature ETP-3754: Report form dirty state to windowStore for tab-close confirmation"
```

---

## Task 5: Table Dirty State Reporting

**Files:**
- Modify: `packages/MainUI/components/Table/index.tsx`

- [ ] **Step 1: Add dirty state reporting effect**

In `packages/MainUI/components/Table/index.tsx`:

Add store selector (near other `useWindowStore` selectors):
```typescript
  const setWindowDirtySource = useWindowStore((s) => s.setWindowDirtySource);
```

Add effect (after `editingRows` state declaration around line 988):
```typescript
  // Report table dirty state to windowStore for tab-close confirmation
  const hasEditingRows = Object.keys(editingRows).length > 0;
  useEffect(() => {
    if (windowIdentifier) {
      setWindowDirtySource(windowIdentifier, `table:${tab.id}`, hasEditingRows);
    }
    return () => {
      if (windowIdentifier) {
        setWindowDirtySource(windowIdentifier, `table:${tab.id}`, false);
      }
    };
  }, [hasEditingRows, windowIdentifier, tab.id, setWindowDirtySource]);
```

Note: `windowIdentifier` is already available from `useCurrentWindowIdentifier()` at line 784. `tab` is from `useTabContext()` at line 794.

- [ ] **Step 2: Verify build passes**

Run: `pnpm --filter @workspaceui/mainui build`
Expected: Build succeeds

- [ ] **Step 3: Run existing Table tests**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="components/Table/__tests__/index" --no-coverage`
Expected: Existing tests still pass (mock may need `setWindowDirtySource: jest.fn()` — check the existing windowStore mock in the test file)

- [ ] **Step 4: Update Table test mock if needed**

Read `packages/MainUI/components/Table/__tests__/index.test.tsx` and search for how `useWindowStore` is mocked. The Table tests may not directly mock `windowStore` — they may rely on a shared jest setup or the actual store. If:

- **Store is mocked:** Add `setWindowDirtySource: jest.fn()` to the mock.
- **Store is NOT mocked (real store used):** No mock change needed — the real `setWindowDirtySource` action will work. The test just needs to not break.
- **Tests fail with "cannot read property" errors:** Add a minimal mock for the new selector.

- [ ] **Step 5: Run tests again**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="components/Table/__tests__/index" --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/Table/index.tsx packages/MainUI/components/Table/__tests__/index.test.tsx
git commit -m "Feature ETP-3754: Report table dirty state to windowStore for tab-close confirmation"
```

---

## Task 6: Close Interception in WindowTabs

**Files:**
- Modify: `packages/MainUI/components/NavigationTabs/WindowTabs.tsx`

- [ ] **Step 1: Read current WindowTabs file fully**

Read `packages/MainUI/components/NavigationTabs/WindowTabs.tsx` to understand all imports and the full component structure before modifying.

- [ ] **Step 2: Add dirty check and confirmation modal**

In `packages/MainUI/components/NavigationTabs/WindowTabs.tsx`:

Add import:
```typescript
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
```

Add store selector (near other `useWindowStore` selectors):
```typescript
const dirtyWindows = useWindowStore((s) => s.dirtyWindows);
```

Add confirmation state (near other `useState` declarations):
```typescript
const [pendingCloseWindow, setPendingCloseWindow] = useState<WindowState | null>(null);
```

Replace the existing `handleCloseWindow` callback:
```typescript
  const handleCloseWindow = useCallback(
    (window: WindowState) => {
      const isDirty = Object.values(dirtyWindows[window.windowIdentifier] ?? {}).some(Boolean);
      if (isDirty) {
        setPendingCloseWindow(window);
        return;
      }
      // Clean window — close immediately
      setClosingWindowIds((prev) => new Set(prev).add(window.windowIdentifier));
      cleanupWindow(window.windowIdentifier);
    },
    [cleanupWindow, dirtyWindows]
  );

  const handleConfirmClose = useCallback(() => {
    if (pendingCloseWindow) {
      setClosingWindowIds((prev) => new Set(prev).add(pendingCloseWindow.windowIdentifier));
      cleanupWindow(pendingCloseWindow.windowIdentifier);
      setPendingCloseWindow(null);
    }
  }, [pendingCloseWindow, cleanupWindow]);

  const handleCancelClose = useCallback(() => {
    setPendingCloseWindow(null);
  }, []);
```

Add `ConfirmModal` to the JSX return. The component must be rendered outside the scrollable container `<div>` — wrap the return in a fragment `<>...</>` if needed:
```tsx
      <ConfirmModal
        open={pendingCloseWindow !== null}
        confirmText={t("common.unsavedChangesCloseMessage") || "You have unsaved changes that will be lost. Are you sure you want to close this window?"}
        saveLabel={t("common.close") || "Close"}
        secondaryButtonLabel={t("common.cancel") || "Cancel"}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
```

Props reference (`ConfirmModalProps` from `StatusModal/types.ts`):
- `confirmText: string` — the warning message
- `onConfirm: () => void` — called when primary button clicked
- `onCancel: () => void` — called when secondary button clicked
- `saveLabel?: string` — primary button text (default: "Confirm")
- `secondaryButtonLabel?: string` — secondary button text (default: "Cancel")
- `open?: boolean` — controls visibility

- [ ] **Step 3: Check translation keys exist**

Search for translation keys `common.unsavedChangesCloseMessage`, `common.close`, `common.cancel` in the translation files (e.g. `packages/MainUI/public/locales/`). If they don't exist, the `|| "fallback"` strings will display. Add the keys to the translation files if a translations directory exists — otherwise the English fallbacks are sufficient.

- [ ] **Step 4: Verify build passes**

Run: `pnpm --filter @workspaceui/mainui build`
Expected: Build succeeds

- [ ] **Step 5: Run existing WindowTabs/NavigationTabs tests**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="NavigationTabs|WindowTab" --no-coverage`
Expected: Existing tests pass (update mocks if needed — add `dirtyWindows: {}` to windowStore mock)

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/components/NavigationTabs/WindowTabs.tsx
git commit -m "Feature ETP-3754: Add unsaved-changes confirmation dialog on window tab close"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run linting**

Run: `pnpm check`
Expected: No linting or formatting errors

- [ ] **Step 3: Run build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Fix any issues found in steps 1-3**

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git commit -m "Feature ETP-3754: Fix lint/test issues from navigation gaps implementation"
```
