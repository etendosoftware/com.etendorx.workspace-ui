# Zustand Migration Phases 8–10 + Consumer Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Zustand migration by creating the MetadataStore (Phase 8), migrating all `useWindowContext` consumers to direct store selectors (Phase 7 batches), migrating all `useUserContext` consumers to direct store selectors (Phase 4 batches), and removing dead provider wrappers (Phase 10).

**Architecture:** Each task is independently committable and testable. Phase 8 follows the established store-creation pattern (Zustand + devtools, backward-compat wrapper). Phases 7b/4b replace `useWindowContext()`/`useUserContext()` calls with granular `useWindowStore`/`useUserStore` selectors — the actual performance wins. Phase 10 removes empty provider shells.

**Tech Stack:** Zustand 5, React 19, TypeScript, immer, Jest + React Testing Library

---

## File Structure

### Phase 8 — MetadataStore (new store + backward-compat wrapper)
| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `packages/MainUI/stores/metadataStore.ts` | Zustand store: windowsData, loadingWindows, errors, loadWindowData, getters, resetForRole |
| Modify | `packages/MainUI/contexts/metadataStore.tsx` | Backward-compat wrapper delegating to Zustand store |
| Modify | `packages/MainUI/contexts/metadata.tsx` | Update MetadataSynchronizer + useMetadataContext to use Zustand store |
| Modify | `packages/MainUI/contexts/__tests__/metadataStore.test.tsx` | Add store reset, update provider-boundary tests |
| Modify | `packages/MainUI/contexts/__tests__/metadata.test.tsx` | Update mocks to use Zustand store |

### Phase 7b — Window consumer migration (replace useWindowContext → useWindowStore)
| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | 34 consumer files (see task breakdown) | Replace `useWindowContext()` with targeted `useWindowStore` selectors |
| Modify | ~15 test files | Update mocks from `useWindowContext` → `useWindowStore` |

### Phase 4b — User consumer migration (replace useUserContext → useUserStore)
| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | ~48 consumer files (see task breakdown) | Replace `useUserContext()` with targeted `useUserStore` selectors |
| Modify | ~20 test files | Update mocks from `useUserContext` → `useUserStore` |

### Phase 10 — Provider removal
| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `packages/MainUI/app/layout.tsx` | Remove dead provider wrappers |
| Delete | Backward-compat wrapper code from context files | Remove delegating hooks |

---

## Task 1: Create MetadataStore (Zustand)

**Files:**
- Create: `packages/MainUI/stores/metadataStore.ts`

- [ ] **Step 1: Create the Zustand store**

```typescript
// packages/MainUI/stores/metadataStore.ts
"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type Etendo, Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

interface MetadataStoreState {
  windowsData: Record<string, Etendo.WindowMetadata>;
  loadingWindows: Record<string, boolean>;
  errors: Record<string, Error | undefined>;

  loadWindowData: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getWindowMetadata: (windowId: string) => Etendo.WindowMetadata | undefined;
  isWindowLoading: (windowId: string) => boolean;
  getWindowError: (windowId: string) => Error | undefined;
  resetForRole: () => void;
}

export const useMetadataZustandStore = create<MetadataStoreState>()(
  devtools(
    (set, get) => ({
      windowsData: {},
      loadingWindows: {},
      errors: {},

      loadWindowData: async (windowId: string): Promise<Etendo.WindowMetadata> => {
        const { windowsData } = get();
        if (windowsData[windowId]) {
          return windowsData[windowId];
        }

        try {
          set(
            (state) => ({
              loadingWindows: { ...state.loadingWindows, [windowId]: true },
              errors: { ...state.errors, [windowId]: undefined },
            }),
            false,
            "loadWindowData/start"
          );

          logger.info(`[MetadataStore] Loading metadata for window ${windowId}`);
          Metadata.clearWindowCache(windowId);
          const newWindowData = await Metadata.forceWindowReload(windowId);

          set(
            (state) => ({
              windowsData: { ...state.windowsData, [windowId]: newWindowData },
              loadingWindows: { ...state.loadingWindows, [windowId]: false },
            }),
            false,
            "loadWindowData/success"
          );

          return newWindowData;
        } catch (err) {
          const error = err as Error;
          logger.warn(`[MetadataStore] Error loading window ${windowId}:`, error);

          set(
            (state) => ({
              errors: { ...state.errors, [windowId]: error },
              loadingWindows: { ...state.loadingWindows, [windowId]: false },
            }),
            false,
            "loadWindowData/error"
          );

          throw error;
        }
      },

      getWindowMetadata: (windowId: string) => get().windowsData[windowId],
      isWindowLoading: (windowId: string) => get().loadingWindows[windowId] || false,
      getWindowError: (windowId: string) => get().errors[windowId],

      resetForRole: () =>
        set({ windowsData: {}, loadingWindows: {}, errors: {} }, false, "resetForRole"),
    }),
    { name: "MetadataStore" }
  )
);
```

- [ ] **Step 2: Run tests to verify nothing broke**

Run: `pnpm test:mainui`
Expected: All tests pass (store file is new, no consumers yet)

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/stores/metadataStore.ts
git commit -m "feat: create MetadataStore Zustand store (Phase 8)"
```

---

## Task 2: Update MetadataStoreProvider to delegate to Zustand store

**Files:**
- Modify: `packages/MainUI/contexts/metadataStore.tsx`

- [ ] **Step 1: Rewrite metadataStore.tsx as backward-compat wrapper**

Replace the entire provider body with a thin bridge that:
1. Subscribes `useMetadataZustandStore` for reactive values
2. Runs the role-change reset effect (needs `useUserContext`)
3. Exports the same `useMetadataStore` hook shape

```typescript
"use client";

import { useEffect } from "react";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { useUserContext } from "@/hooks/useUserContext";

// Re-export interface for backward compatibility
export type { MetadataStoreState as IMetadataStoreContext } from "@/stores/metadataStore";

export function MetadataStoreProvider({ children }: React.PropsWithChildren) {
  const { currentRole } = useUserContext();

  // Reset store when role changes — same as original useEffect
  useEffect(() => {
    useMetadataZustandStore.getState().resetForRole();
  }, [currentRole?.id]);

  return <>{children}</>;
}

export const useMetadataStore = () => {
  const store = useMetadataZustandStore();
  return store;
};
```

- [ ] **Step 2: Run tests**

Run: `pnpm test:mainui -- --testPathPattern="metadataStore"`
Expected: Most tests pass. Provider-boundary test ("should throw") may fail — will fix in Task 3.

---

## Task 3: Update MetadataStore tests

**Files:**
- Modify: `packages/MainUI/contexts/__tests__/metadataStore.test.tsx`

- [ ] **Step 1: Add store reset to beforeEach and update imports**

Add `useMetadataZustandStore.setState({ windowsData: {}, loadingWindows: {}, errors: {} })` to every `beforeEach`.

Update the `renderMetadataStoreHook` to use the store directly where provider is unnecessary.

Update "throw outside provider" tests — with Zustand, the store works without a provider (same pattern as all other migrations).

- [ ] **Step 2: Run metadataStore tests**

Run: `pnpm test:mainui -- --testPathPattern="metadataStore"`
Expected: All tests pass

- [ ] **Step 3: Run metadata.test.tsx**

Run: `pnpm test:mainui -- --testPathPattern="metadata.test"`
Expected: All tests pass (mocks should still work since `useMetadataStore` hook shape unchanged)

- [ ] **Step 4: Run full suite**

Run: `pnpm test`
Expected: All 4623+ tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/stores/metadataStore.ts packages/MainUI/contexts/metadataStore.tsx packages/MainUI/contexts/__tests__/metadataStore.test.tsx
git commit -m "feat: migrate MetadataStoreProvider to Zustand backward-compat wrapper (Phase 8)"
```

---

## Task 4: Window Consumer Migration — Actions-only batch

These consumers only call store actions (setters). Easiest migration: replace `useWindowContext()` with `useWindowStore` selector for the action, which is a stable reference and doesn't cause unnecessary subscriptions.

**Files (7 consumer files):**
- Modify: `packages/MainUI/components/ProfileModal/ProfileModal.tsx` — uses `cleanState`
- Modify: `packages/MainUI/hooks/navigation/useRedirect.ts` — uses `setWindowActive`
- Modify: `packages/MainUI/screens/Home/widgets/RecentDocumentsWidget.tsx` — uses `setWindowActive, setTabFormState, setSelectedRecord`
- Modify: `packages/MainUI/screens/Home/widgets/RecentlyViewedWidget.tsx` — uses `setWindowActive`
- Modify: `packages/MainUI/screens/Home/widgets/renderers/FavoritesRenderer.tsx` — uses `setWindowActive`
- Modify: `packages/MainUI/screens/Home/widgets/renderers/RecentDocsRenderer.tsx` — uses `setWindowActive, setTabFormState, setSelectedRecord`
- Modify: `packages/MainUI/screens/Home/widgets/renderers/RecentlyViewedRenderer.tsx` — uses `setWindowActive`

**NOT in this batch** (false positive — only mentions `useWindowContext` in a JSDoc comment, not an actual import):
- `packages/MainUI/hooks/useGlobalUrlStateRecovery.ts` — skip

**Pattern:**
```typescript
// Before:
import { useWindowContext } from "@/contexts/window";
const { setWindowActive } = useWindowContext();

// After:
import { useWindowStore } from "@/stores/windowStore";
const setWindowActive = useWindowStore((s) => s.setWindowActive);
```

Note: For actions, a single-field selector `(s) => s.setWindowActive` is preferred over `getState()` inside a component, because it keeps the call pattern consistent and the function reference is stable (Zustand actions don't change).

- [ ] **Step 1: Migrate all 7 files** following the pattern above
- [ ] **Step 2: Update test mocks** for any associated test files (useRedirect.test.ts, etc.) — change `jest.mock("@/contexts/window")` to `jest.mock("@/stores/windowStore")`
- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: migrate actions-only consumers from useWindowContext to useWindowStore"
```

---

## Task 5: Window Consumer Migration — Read-only batch

These consumers only read reactive values (windows, activeWindow, isHomeRoute, isRecoveryLoading, recoveryError). Replace with targeted selectors.

**Files (8 consumer files):**
- Modify: `packages/MainUI/app/(main)/window/page.tsx` — uses `windows, activeWindow, isHomeRoute, isRecoveryLoading`
- Modify: `packages/MainUI/components/NavigationTabs/MenuTabs/index.tsx` — uses `windows`
- Modify: `packages/MainUI/components/Toolbar/Menus/ColumnVisibilityMenu.tsx` — uses `activeWindow`
- Modify: `packages/MainUI/components/window/Tabs.tsx` — uses `activeWindow`
- Modify: `packages/MainUI/components/window/TabsContainer.tsx` — uses `activeWindow`
- Modify: `packages/MainUI/components/window/Window.tsx` — uses `isRecoveryLoading, recoveryError`
- Modify: `packages/MainUI/contexts/tabs.tsx` — uses `activeWindow`
- Modify: `packages/MainUI/components/ProcessModal/imports.ts` — re-export (update import source)

**Pattern:**
```typescript
// Before:
import { useWindowContext } from "@/contexts/window";
const { windows, activeWindow, isHomeRoute, isRecoveryLoading } = useWindowContext();

// After — multiple reactive values use useShallow:
import { useWindowStore } from "@/stores/windowStore";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";

const windowsObj = useWindowStore((s) => s.windows);
const windows = useMemo(() => Object.values(windowsObj), [windowsObj]);
const activeWindow = useMemo(() => windows.find((w) => w.isActive) ?? null, [windows]);
const isHomeRoute = !activeWindow;
const isRecoveryLoading = useWindowStore((s) => s.isRecoveryLoading);

// For single-value reads:
const isRecoveryLoading = useWindowStore((s) => s.isRecoveryLoading);
const recoveryError = useWindowStore((s) => s.recoveryError);
```

Note: `windows` is derived from `windowsObj` (the store holds a `Record<string, WindowState>`, not an array). The `useMemo` pattern matches what `useWindowContext` already does internally.

**Known limitation:** The `activeWindow` selector creates a new reference on every store update because `Object.values()` runs inside the selector. This is functionally correct but doesn't fully exploit Zustand's referential equality. A follow-up optimization would add a maintained `activeWindowId` field to the store. For now, this matches the existing `useWindowContext` behavior exactly (it also derives `activeWindow` with `useMemo`).

- [ ] **Step 1: Migrate all 8 files** following the pattern above
- [ ] **Step 2: Update test mocks** for associated tests
- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: migrate read-only consumers from useWindowContext to useWindowStore"
```

---

## Task 6: Window Consumer Migration — Getters-only batch

These consumers use imperative getters (getTableState, getSelectedRecord, etc.) which read from store snapshots.

**Files (2 consumer files):**
- Modify: `packages/MainUI/contexts/selected.tsx` — uses `getTabFormState, getSelectedRecord, getNavigationInitialized, setNavigationInitialized`
- Modify: `packages/MainUI/hooks/useStateReconciliation.ts` — uses `clearSelectedRecord, setSelectedRecord, getSelectedRecord`

**Pattern:**
```typescript
// Before:
const { getSelectedRecord, getTabFormState } = useWindowContext();

// After — use getState() for imperative reads:
import { useWindowStore } from "@/stores/windowStore";
const getSelectedRecord = useWindowStore((s) => s.getSelectedRecord);
// Or for imperative-only usage:
const record = useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.selectedRecord;
```

- [ ] **Step 1: Migrate both files**
- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: migrate getter-only consumers from useWindowContext to useWindowStore"
```

---

## Task 7: Window Consumer Migration — Mixed batch (simple)

Mixed consumers that use 2-3 properties (1 reactive + 1-2 actions).

**Files (7 consumer files):**
- Modify: `packages/MainUI/components/Form/FormView/FormActions.tsx` — `activeWindow, clearTabFormState`
- Modify: `packages/MainUI/components/Form/FormView/Sections/LinkedItemsSection.tsx` — `activeWindow, triggerRecovery, isRecoveryLoading`
- Modify: `packages/MainUI/components/ProcessModal/Custom/GenericWarehouseProcess/GenericWarehouseProcess.tsx` — `triggerRecovery, isRecoveryLoading`
- Modify: `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx` — `triggerRecovery, isRecoveryLoading`
- Modify: `packages/MainUI/components/Sidebar.tsx` — `activeWindow, setWindowActive`
- Modify: `packages/MainUI/contexts/metadata.tsx` — `activeWindow, cleanupWindow`
- Modify: `packages/MainUI/components/Form/FormView/index.tsx` — `activeWindow, setSelectedRecord, getSelectedRecord, setSelectedRecordAndClearChildren`

**Pattern:**
```typescript
// Before:
const { activeWindow, setWindowActive } = useWindowContext();

// After:
import { useWindowStore } from "@/stores/windowStore";
const activeWindow = useWindowStore((s) => {
  const wins = Object.values(s.windows);
  return wins.find((w) => w.isActive) ?? null;
});
const setWindowActive = useWindowStore((s) => s.setWindowActive);
```

- [ ] **Step 1: Migrate all 8 files**
- [ ] **Step 2: Update test mocks**
- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: migrate simple mixed consumers from useWindowContext to useWindowStore"
```

---

## Task 8: Window Consumer Migration — Mixed batch (complex)

These are heavy consumers that destructure many properties. Careful migration needed.

**Files (8 consumer files):**
- Modify: `packages/MainUI/components/Breadcrums.tsx` — `activeWindow, getTabFormState, clearTabFormState, setAllWindowsInactive`
- Modify: `packages/MainUI/components/NavigationTabs/WindowTabs.tsx` — `windows, isHomeRoute, cleanupWindow, setWindowActive, setAllWindowsInactive`
- Modify: `packages/MainUI/components/Toolbar/Toolbar.tsx` — `activeWindow, getTabFormState, clearChildrenSelections, setTableFilters, setTableVisibility, setTableSorting, setTableOrder, setTableImplicitFilterApplied`
- Modify: `packages/MainUI/components/window/Tab.tsx` — `activeWindow, clearSelectedRecord, getTabFormState, setSelectedRecord, getSelectedRecord, clearTabFormState, setTabFormState, clearChildrenSelections, getTableState, setTableAdvancedCriteria, setAllWindowsInactive`
- Modify: `packages/MainUI/hooks/table/useTableData.tsx` — `activeWindow, getTabFormState, getTabInitializedWithDirectLink, setTabInitializedWithDirectLink, getSelectedRecord`
- Modify: `packages/MainUI/hooks/Toolbar/useToolbarConfig.ts` — `activeWindow, clearSelectedRecord, getSelectedRecord, setSelectedRecord, setTabFormState`
- Modify: `packages/MainUI/hooks/useTableSelection.ts` — `activeWindow, clearSelectedRecord, getTabFormState, setSelectedRecord, getSelectedRecord` (from window) + `setSession, setSessionSyncLoading` (from user — use `useUserStore` for those too)
- Modify: `packages/MainUI/components/Table/index.tsx` — `activeWindow, getSelectedRecord, getTabFormState` (from window) + `user, session` (from user — use `useUserStore` for those too)

**Pattern for heavy consumers:**
```typescript
// Split into reactive subscriptions + stable action references
import { useWindowStore } from "@/stores/windowStore";
import { useShallow } from "zustand/react/shallow";

// Reactive reads (cause re-render when changed):
const activeWindow = useWindowStore((s) => {
  const wins = Object.values(s.windows);
  return wins.find((w) => w.isActive) ?? null;
});

// Actions (stable references, no re-renders):
const { clearSelectedRecord, setSelectedRecord, setTabFormState, clearTabFormState,
        clearChildrenSelections, setAllWindowsInactive, setTableAdvancedCriteria } =
  useWindowStore.getState();

// Imperative getters (read on demand, no subscription):
const getTabFormState = useWindowStore.getState().getTabFormState;
// Or read directly: useWindowStore.getState().windows[winId]?.tabs[tabId]?.form
```

- [ ] **Step 1: Migrate all 6 files**
- [ ] **Step 2: Update test mocks** (Breadcrums.test, WindowTabs.test, Tab tests, etc.)
- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: migrate complex mixed consumers from useWindowContext to useWindowStore"
```

---

## Task 9: Window Consumer Migration — useTableStatePersistenceTab cleanup

**Files:**
- Modify: `packages/MainUI/hooks/useTableStatePersistenceTab.tsx`

This file already imports `useWindowStore` for reactive reads (fixed earlier). But it still imports `useWindowContext` for action references. Complete the migration.

- [ ] **Step 1: Remove useWindowContext import, get actions from store**

Replace the `useWindowContext()` call with direct `useWindowStore.getState()` for the action references it needs (`setTableFilters`, `setTableSorting`, etc.).

- [ ] **Step 2: Run tests**

Run: `pnpm test:mainui -- --testPathPattern="tableStatePersistence|useTableStatePersistenceTab"`
Expected: All 33 tests pass

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: complete useTableStatePersistenceTab migration to useWindowStore"
```

---

## Task 10: Remove useWindowContext backward-compat hook

After all consumers are migrated, `useWindowContext` should have zero non-test imports outside `contexts/window.tsx` itself.

**Files:**
- Modify: `packages/MainUI/contexts/window.tsx` — remove `useWindowContext` export (or keep as deprecated wrapper for safety)

- [ ] **Step 1: Verify zero consumers remain**

Run: `grep -r "useWindowContext" packages/MainUI --include="*.ts" --include="*.tsx" -l | grep -v "__tests__" | grep -v ".test." | grep -v "contexts/window.tsx"`
Expected: No output (zero non-test consumers)

- [ ] **Step 2: Mark useWindowContext as deprecated**

Add `@deprecated` JSDoc to `useWindowContext` in `contexts/window.tsx`. Keep it temporarily for any external consumers. Do NOT delete yet — Phase 10 handles removal.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: deprecate useWindowContext — all consumers migrated to useWindowStore"
```

---

## Task 11: User Consumer Migration — Actions + auth batch

Consumers that primarily use auth actions or a single field.

**IMPORTANT — Split migration constraint:** The Zustand `useUserStore` contains all state fields and simple setters, but complex actions like `login`, `logout`, `changeProfile`, `changePassword`, `setDefaultConfiguration`, and `clearUserData` remain ONLY on the React Context (`UserProvider`). Files that call these actions must keep `useUserContext()` for those actions while migrating state reads to `useUserStore`. This is intentional — these actions orchestrate multiple side-effects (localStorage, API calls, language reset) that depend on React hooks only available inside `UserProvider`.

**Pattern for state-only consumers:**
```typescript
// Before:
import { useUserContext } from "@/hooks/useUserContext";
const { token, currentRole } = useUserContext();

// After:
import { useUserStore } from "@/stores/userStore";
const token = useUserStore((s) => s.token);
const currentRole = useUserStore((s) => s.currentRole);
```

**Pattern for consumers that need BOTH state reads AND context actions:**
```typescript
// Before:
import { useUserContext } from "@/hooks/useUserContext";
const { token, login, loginErrorText } = useUserContext();

// After — split between store (state) and context (actions):
import { useUserStore } from "@/stores/userStore";
import { useUserContext } from "@/hooks/useUserContext";
const token = useUserStore((s) => s.token);
const loginErrorText = useUserStore((s) => s.loginErrorText);
const { login } = useUserContext(); // action stays on context
```

Specific files to migrate:
- `components/Forms/Login/Login.tsx` — `login` (context action), `loginErrorText, loginErrorDescription, setLoginErrorText` (store)
- `screens/Login/index.tsx` — `token` (store), `login` (context action)
- `components/navigation.tsx` — `token`
- `hooks/useAuthenticatedImage.ts` — `token`
- `hooks/useCopilotClient.ts` — `token, isCopilotInstalled`
- `hooks/useDeleteRecord.ts` — `token`
- `hooks/useFormAction.ts` — `token`
- `hooks/useFormInitialization.ts` — `token`
- `hooks/useFormValidation.ts` — `token`
- `hooks/useImageUpload.ts` — `token`
- `hooks/useProcessMessage.ts` — `token`
- `hooks/useRecentDocuments.ts` — `token, currentRole`
- `hooks/useSavedViews.ts` — `token`
- `hooks/useDisplayLogic.ts` — `token`
- `hooks/useAutoApplyDefaultView.ts` — `token, currentRole`

- [ ] **Step 1: Migrate all ~15 files**
- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: migrate auth/token consumers from useUserContext to useUserStore"
```

---

## Task 12: User Consumer Migration — Profile + organization batch

Consumers that read profile, roles, organization, warehouse, session info.

**Files (~16 consumer files):**
- `components/ProfileModal/UserProfile.tsx` — `profile, roles, currentRole, currentWarehouse, currentOrganization` (store) + `changeProfile` (context action)
- `components/Form/FormView/Sections/AttachmentSection.tsx` — `session, currentOrganization` (store)
- `components/Sidebar.tsx` — `profile, user`
- `screens/Home/index.tsx` — `user, profile`
- `components/Drawer/RecentlyViewed/index.tsx` — `currentRole`
- `components/Form/FormView/FormFieldsContent.tsx` — `currentRole, session`
- `components/Form/FormView/FormHeader.tsx` — `user, currentRole`
- `components/Form/FormView/selectors/BaseSelector.tsx` — `token, currentRole`
- `components/Form/FormView/selectors/ImageSelector.tsx` — `token`
- `components/Form/FormView/selectors/SelectorModal.tsx` — `token, currentRole`
- `components/ProcessModal/selectors/BaseSelector.tsx` — `token, currentRole`
- `components/ProcessModal/selectors/ProcessParameterSelector.tsx` — `token`
- `components/ProcessModal/WindowReferenceGrid.tsx` — `token, currentRole`
- `hooks/about/useAboutModal.ts` — `session, user`
- `hooks/datasource/useTableDirDatasource.ts` — `token, currentRole`

- [ ] **Step 1: Migrate all ~15 files**
- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: migrate profile/org consumers from useUserContext to useUserStore"
```

---

## Task 13: User Consumer Migration — Remaining consumers

Consumers that use complex combinations of user state.

**Files (~15 remaining consumer files):**
- `components/ProcessModal/Custom/GenericWarehouseProcess/GenericWarehouseProcess.tsx` — `token, currentRole` (store)
- `components/ProcessModal/imports.ts` — re-export update
- `components/ProcessModal/ProcessDefinitionModal.tsx` — `token, currentRole, session` (store)
- `components/Toolbar/Toolbar.tsx` — `token` (store)
- `components/window/Tab.tsx` — `token, currentRole` (store)
- `components/window/TabsContainer.tsx` — `currentRole` (store)
- `contexts/favorites.tsx` — `currentRole` (store)
- `contexts/metadataStore.tsx` — `currentRole` (already migrated in Task 2, verify)
- `hooks/Toolbar/useToolbar.ts` — `token` (store)
- `hooks/Toolbar/useToolbarConfig.ts` — `token, currentRole` (store)
- `hooks/useTableSelection.ts` — `setSession, setSessionSyncLoading` (store — already has window context migrated in Task 8)
- `screens/Home/widgets/RecentlyViewedWidget.tsx` — `currentRole` (store)
- `screens/Home/widgets/renderers/RecentlyViewedRenderer.tsx` — `currentRole` (store)
- `utils/process/evaluateParameterDefaults.ts` — `currentRole, session` (non-hook utility — use `useUserStore.getState()`)

**Note:** `components/Table/index.tsx` user context migration is handled in Task 8 (window complex batch) since both contexts are migrated together. `stores/userStore.ts` and `utils/tests/mockHelpers.ts` are not consumers — skip.

- [ ] **Step 1: Migrate all remaining files**
- [ ] **Step 2: Update test mocks**
- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: migrate remaining consumers from useUserContext to useUserStore"
```

---

## Task 14: Deprecate useUserContext

- [ ] **Step 1: Verify zero non-test consumers remain**

Run: `grep -r "useUserContext\|useUser()" packages/MainUI --include="*.ts" --include="*.tsx" -l | grep -v "__tests__" | grep -v ".test." | grep -v "contexts/user.tsx" | grep -v "hooks/useUserContext.ts"`
Expected: No output

- [ ] **Step 2: Mark as deprecated** in `hooks/useUserContext.ts`
- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: deprecate useUserContext — all consumers migrated to useUserStore"
```

---

## Task 15: Phase 10 — Remove dead provider wrappers from layout.tsx

**Prerequisite:** All consumer migrations complete.

**Files:**
- Modify: `packages/MainUI/app/layout.tsx`

- [ ] **Step 1: Remove providers that are truly no-op wrappers**

These providers render only `<>{children}</>` with zero side-effects:
- `LoadingProvider` (Phase 1) — safe to remove, no effects

- [ ] **Step 2: Relocate effects from providers that have active side-effects BEFORE removing them**

These providers still run effects that must be preserved somewhere:

**`PreferencesProvider`** — has TWO active effects:
  1. `useEffect` that hydrates the store from `localStorage` on mount (initializes `customFaviconColor`)
  2. `useEffect` that updates the favicon DOM element when color changes
  **Action:** Move both effects into a `<PreferencesEffects />` component (renders null) placed in layout.tsx, then remove the provider wrapper.

**`FavoritesProvider`** — has an active effect:
  1. `useEffect` that calls `resetForRole()` + `fetchForRole()` when `currentRole.id` changes
  **Action:** Move effect into a `<FavoritesEffects />` component (renders null) placed in layout.tsx, then remove the provider wrapper.

**`MetadataStoreProvider`** — has an active effect:
  1. `useEffect` that calls `resetForRole()` when `currentRole.id` changes
  **Action:** Move effect into the `MetadataSynchronizer` component (already exists, already runs effects), then remove the provider wrapper.

- [ ] **Step 3: Remove the relocated providers from layout.tsx**

After effects are relocated, remove `PreferencesProvider`, `FavoritesProvider`, and `MetadataStoreProvider` wrappers. Replace with the new effect components if needed.

**Keep** (still have active responsibilities beyond effects):
- `RuntimeConfigProvider` — not migrated
- `ApiProviderWrapper` — not migrated
- `ThemeProvider` — not migrated
- `LanguageProvider` — not migrated
- `UserProvider` — still runs auth effects (login, logout, session sync) + conditionally renders LoginScreen
- `DatasourceProvider` — not migrated
- `WindowProvider` — still runs URL sync + recovery effects
- `MetadataSynchronizer` — still runs activeWindow sync effect (and will absorb metadata role-reset)

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: remove dead provider wrappers from layout.tsx (Phase 10)"
```

---

## Verification & Measurement

After all tasks are complete:

- [ ] Run full test suite: `pnpm test` — all 4623+ tests pass
- [ ] Run linting: `pnpm check`
- [ ] Verify no remaining `useWindowContext` imports in non-test files (except contexts/window.tsx)
- [ ] Verify no remaining `useUserContext` imports in non-test files (except hooks/useUserContext.ts)
- [ ] Profile a window switch interaction with React DevTools — re-render count should drop from ~69 to ~5
