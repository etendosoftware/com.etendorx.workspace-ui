# Performance Optimization & Zustand Migration Plan

> **For agentic workers:** Each phase is a separate branch/PR. Phases are ordered by impact and can be assigned to different developers. Use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unnecessary re-render cascades caused by coarse-grained React Context providers. Migrate state management to Zustand for selective subscriptions. Fix quick-win performance issues.

**Architecture:** Gradual migration — Zustand stores coexist with Context providers during transition. Each phase is self-contained, testable, and mergeable independently.

**Tech Stack:** Zustand 5, React 19, TypeScript, Material React Table

---

## Overview & Prioritization

| Phase | Description | Effort | Impact | Branch |
|-------|-------------|--------|--------|--------|
| 0 | Quick wins (no Zustand) | 1-2 days | Medium | `perf/quick-wins` |
| 1 | Install Zustand + migrate LoadingContext (example) | 1 day | Low (sets pattern) | `perf/zustand-setup` |
| 2 | Migrate PreferencesContext → Zustand | 1 day | Low | `perf/zustand-preferences` |
| 3 | Migrate FavoritesContext → Zustand | 1-2 days | Low-Medium | `perf/zustand-favorites` |
| 4 | Migrate UserContext → Zustand (slices) | 3-5 days | High | `perf/zustand-user` |
| 5 | Migrate TabsContext → Zustand | 1-2 days | Medium | `perf/zustand-tabs` |
| 6 | Migrate ToolbarContext → Zustand | 2-3 days | Medium | `perf/zustand-toolbar` |
| 7 | Migrate WindowContext → Zustand (biggest win) | 5-8 days | Very High | `perf/zustand-window` |
| 8 | Migrate MetadataStore → Zustand + cache strategy | 3-5 days | High | `perf/zustand-metadata` |
| 9 | Table editing virtualization fix | 3-5 days | High (tables) | `perf/table-virtualization` |
| 10 | Remove provider nesting from layout.tsx | 1 day | Cleanup | `perf/flatten-providers` |

**Total estimated effort:** 20-35 developer-days spread across multiple sprints.

---

## Phase 0: Quick Wins (No Zustand Required)

**Branch:** `perf/quick-wins`
**Estimate:** 1-2 days
**Impact:** Eliminates visible jank and unnecessary network/render cycles
**Can be done by:** Any developer

### 0.1 — Replace progress bar setState animations with CSS

- [ ] **`packages/MainUI/components/ProcessModal/Iframe.tsx:204-227`**
  Replace `setInterval` + `setProgressWidth` (20 updates/sec) with CSS transition:
  ```tsx
  // Before: setInterval every 50ms updating state
  // After: CSS-only animation
  <div 
    style={{ 
      width: showProgress ? '100%' : '0%',
      transition: 'width 3s linear' 
    }} 
  />
  ```
  Remove: `progressWidth` state, `setInterval`, `clearInterval`

- [ ] **`packages/MainUI/components/Forms/Login/Login.tsx:23-55`**
  Same pattern — replace JS progress animation with CSS transition.

- [ ] Run tests: `pnpm test:mainui`

### 0.2 — Debounce SSE connection state updates

- [ ] **`packages/MainUI/hooks/useSSEConnection.ts:119-129`**
  Only update `setIsConnected(false)` if state actually changed:
  ```tsx
  const intervalId = setInterval(() => {
    if (eventSource.readyState === EventSourcePolyfill.CLOSED) {
      setIsConnected((prev) => {
        if (prev === false) return prev; // No-op if already false
        return false;
      });
      // ... rest of cleanup
    }
  }, 1000);
  ```

- [ ] Run tests: `pnpm test:mainui`

### 0.3 — Debounce callout events in ToolbarContext

- [ ] **`packages/MainUI/contexts/ToolbarContext.tsx:252-276`**
  Batch callout start/end events — callouts can fire rapidly during form initialization:
  ```tsx
  const handleCalloutStart = () => {
    setSaveButtonState((prev) => {
      if (prev.isCalloutLoading) return prev; // Already loading, skip re-render
      return { ...prev, isCalloutLoading: true };
    });
  };
  ```

- [ ] Run tests: `pnpm test:mainui`
- [ ] Commit: `perf: debounce SSE, callout events, and replace JS progress animations`

---

## Phase 1: Install Zustand + Migrate LoadingContext (Reference Implementation)

**Branch:** `perf/zustand-setup` (THIS branch — `feature/ETP-3757`)
**Estimate:** 1 day
**Impact:** Low direct impact, but establishes the pattern for all subsequent migrations
**Can be done by:** Any developer

### Why LoadingContext first?
- Simplest context (3 properties, 4 consumers)
- Has comprehensive tests (13 test cases)
- Zero risk — if anything breaks, it's immediately visible (loading spinner)
- Perfect 1:1 migration example

### 1.1 — Install Zustand

- [x] Install in MainUI package:
  ```bash
  cd packages/MainUI && pnpm add zustand
  ```

### 1.2 — Create loading store

- [x] Create `packages/MainUI/stores/loadingStore.ts`:
  ```typescript
  import { create } from "zustand";
  import { devtools } from "zustand/middleware";

  interface LoadingStore {
    isLoading: boolean;
    showLoading: () => void;
    hideLoading: () => void;
  }

  export const useLoadingStore = create<LoadingStore>()(
    devtools(
      (set) => ({
        isLoading: false,
        showLoading: () => set({ isLoading: true }),
        hideLoading: () => set({ isLoading: false }),
      }),
      { name: "LoadingStore" }
    )
  );
  ```

### 1.3 — Update consumers to use store

- [x] **`packages/MainUI/components/Layout/GlobalLoading.tsx`**
- [x] **`packages/MainUI/hooks/useMenu.ts`**

### 1.4 — Update loading.tsx to re-export from store (backward compatibility)

- [x] **`packages/MainUI/contexts/loading.tsx`** — Keep the file but make it a thin wrapper:
  ```typescript
  "use client";

  import { useLoadingStore } from "@/stores/loadingStore";

  // Re-export for backward compatibility during migration
  // New code should import directly from @/stores/loadingStore
  export const useLoading = () => ({
    isLoading: useLoadingStore((s) => s.isLoading),
    showLoading: useLoadingStore((s) => s.showLoading),
    hideLoading: useLoadingStore((s) => s.hideLoading),
  });

  // LoadingProvider is now a no-op wrapper — Zustand doesn't need providers
  export default function LoadingProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }
  ```

### 1.5 — Update tests

- [x] **`packages/MainUI/contexts/__tests__/loading.test.tsx`** — Removed "throw outside provider" test, added store reset in `beforeEach`, added 2 Zustand store-level tests.
  ```typescript
  import { useLoadingStore } from "@/stores/loadingStore";
  import { act } from "@testing-library/react";

  // Add store-level tests (no wrapper needed — Zustand doesn't need providers)
  describe("LoadingStore (Zustand)", () => {
    beforeEach(() => {
      // Reset store between tests
      useLoadingStore.setState({ isLoading: false });
    });

    it("should toggle loading state", () => {
      expect(useLoadingStore.getState().isLoading).toBe(false);
      
      act(() => useLoadingStore.getState().showLoading());
      expect(useLoadingStore.getState().isLoading).toBe(true);
      
      act(() => useLoadingStore.getState().hideLoading());
      expect(useLoadingStore.getState().isLoading).toBe(false);
    });

    it("should be accessible outside React components", () => {
      useLoadingStore.getState().showLoading();
      expect(useLoadingStore.getState().isLoading).toBe(true);
    });
  });
  ```

### 1.6 — Remove LoadingProvider from layout.tsx

- [x] **`packages/MainUI/app/layout.tsx`** — LoadingProvider kept as no-op; removal deferred to Phase 10.

### 1.7 — Verify

- [x] Run: `pnpm test:mainui` — 288 suites, 3738 tests, all green
- [x] Run: `pnpm check` — only pre-existing warnings in modified files
- [ ] Manual test: trigger a loading state (navigate between windows) and verify spinner appears/disappears
- [x] Commit: `feat: install Zustand and migrate LoadingContext as reference implementation`

---

## Phase 2: Migrate PreferencesContext → Zustand

**Branch:** `perf/zustand-preferences`
**Estimate:** 1 day
**Impact:** Minimal (2 consumers, very low change frequency)
**Purpose:** Second easy migration to build team confidence
**Can be done by:** Any developer

### Checklist

- [x] Create `packages/MainUI/stores/preferencesStore.ts` (manual localStorage writes, same key `settings.favicon_badge`)
- [x] Properties: `customFaviconColor`, `setCustomFaviconColor` (2 props)
- [x] Updated consumer: `components/Header/ConfigurationSection.tsx` → uses store selectors directly
- [x] Make `packages/MainUI/contexts/preferences.tsx` a backward-compat wrapper (keeps favicon DOM side-effect)
- [x] Updated `__tests__/components/Header/ConfigurationSection.test.tsx` mock → `usePreferencesStore`
- [x] Run tests: 288 suites, 3741 tests, all green

### Key pattern: `persist` middleware
```typescript
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export const usePreferencesStore = create<PreferencesStore>()(
  devtools(
    persist(
      (set) => ({
        customFaviconColor: null,
        setCustomFaviconColor: (color: string | null) => set({ customFaviconColor: color }),
      }),
      { name: "preferences-storage" }
    ),
    { name: "PreferencesStore" }
  )
);
```

---

## Phase 3: Migrate FavoritesContext → Zustand

**Branch:** `perf/zustand-favorites`
**Estimate:** 1-2 days
**Impact:** Low-Medium (4 consumers, subscriber pattern already exists)
**Can be done by:** Any developer

### Checklist

- [x] Create `packages/MainUI/stores/favoritesStore.ts`
- [x] Properties: `favoriteWindowIds` (Set), `menuIdByWindowId` (Map), `isFavorite`, `toggle`, `seed`, `setMenuMap`, `subscribeToToggle`, `resetForRole`, `fetchForRole`
- [x] `toggleListeners` and `seeded` kept as module-level vars (no re-renders)
- [x] Updated 4 consumers: `FavoritesRenderer`, `Home/index`, `Sidebar`, `Breadcrums`
- [x] `subscribeToToggle` uses module-level `Set<() => void>` (no Zustand subscription needed)
- [x] Backward-compat `useFavoritesContext` in `contexts/favorites.tsx` (reactive `isFavorite` via `useCallback`)
- [x] `FavoritesProvider` kept as thin component for role-change re-fetch side-effect
- [x] Updated `Breadcrums.test.tsx` mock → `useFavoritesStore`
- [x] Run tests: 288 suites, 3741 tests, all green

---

## Phase 4: Migrate UserContext → Zustand (Slices)

**Branch:** `perf/zustand-user`
**Estimate:** 3-5 days
**Impact:** HIGH — 99 consumers, 24 properties
**Prerequisite:** Phases 1-3 completed (team is comfortable with pattern)
**Can be done by:** Senior developer

### Why this matters
UserContext has 24 properties and 99 consumers. With Context API, changing `loginErrorText` re-renders all 99 consumers including the entire navigation, toolbar, and form components. With Zustand selectors, only components that read `loginErrorText` re-render.

### Slice architecture
```
stores/userStore.ts
├── authSlice: token, login, logout, clearUserData, getCsrfToken
├── profileSlice: user, profile, roles, currentRole, prevRole, languages
├── organizationSlice: currentClient, currentOrganization, currentWarehouse, changeProfile
├── sessionSlice: session, setSession, isSessionSyncLoading, setSessionSyncLoading
└── uiSlice: loginErrorText, loginErrorDescription, isCopilotInstalled + setters
```

### Checklist

- [x] Create `packages/MainUI/stores/userStore.ts` with slices pattern
- [x] Use `devtools` middleware; localStorage handled manually in setters (token, roles, profile already sync via store actions)
- [x] Create backward-compat wrapper in `contexts/user.tsx` (delegates to store for state, keeps effects/actions in UserProvider)
- [x] Updated `IUserContext` setter types from `React.Dispatch<React.SetStateAction<T>>` to simple setters — consistent with store
- [x] `useUserContext` updated with JSDoc guiding migration to store selectors
- [x] Run full test suite: 288 suites, 3741 tests, all green
- [ ] Migrate consumers incrementally — start with leaf components, work up:
  - [ ] Batch 1: Components that only read `token` (auth checks) — ~15 files
  - [ ] Batch 2: Components that only read `profile` or `user` — ~10 files  
  - [ ] Batch 3: Components that read `currentRole`/`currentOrganization` — ~20 files
  - [ ] Batch 4: Components that use `login`/`logout` actions — ~5 files
  - [ ] Batch 5: Remaining consumers — ~49 files
- [ ] Update tests that mock UserContext → mock store instead (per batch)
- [ ] Remove UserProvider from layout.tsx (Phase 10)

### Migration pattern for consumers
```tsx
// Before (re-renders on ALL 24 props):
const { token, currentRole } = useUser();

// After (only re-renders when token OR currentRole change):
import { useShallow } from "zustand/react/shallow";
const { token, currentRole } = useUserStore(
  useShallow((s) => ({ token: s.token, currentRole: s.currentRole }))
);

// Or if only one field:
const token = useUserStore((s) => s.token);
```

---

## Phase 5: Migrate TabsContext → Zustand

**Branch:** `perf/zustand-tabs`
**Estimate:** 1-2 days
**Impact:** Medium (6 consumers, scroll state)
**Can be done by:** Any developer

### Checklist

- [x] Create `packages/MainUI/stores/tabsStore.ts`
- [x] Properties: refs (pre-created `{ current: null }` objects), scroll buttons, scroll handlers (8 props)
- [x] Note: refs are stable — Zustand holds the same object reference; React mutates `.current` directly
- [x] Actual consumers: 1 (`WindowTabs.tsx`) — `useTabs()` unchanged as backward-compat wrapper
- [x] `TabsProvider` simplified: no `useRef()`, only effects; all state writes go to store
- [x] `useTabs()` → delegates to `useTabsStore()` directly
- [x] Run tests: 288 suites, 3741 tests, all green

---

## Phase 6: Migrate ToolbarContext → Zustand

**Branch:** `perf/zustand-toolbar`
**Estimate:** 2-3 days
**Impact:** Medium (20 consumers, callout events)
**Can be done by:** Mid-senior developer

### Checklist

- [x] Create `packages/MainUI/stores/toolbarStore.ts`
  - Per-tabId store: `byTabId: Record<string, ToolbarTabState>`
  - `registeredActions` (raw, set by consumers) + `wrappedSave` (set by ToolbarProvider)
  - State: `saveButtonState`, `isImplicitFilterApplied`, `isAdvancedFilterApplied`, `shouldOpenAttachmentModal`, `formViewRefetch`, `attachmentAction`
  - Actions: `initTab`, `destroyTab`, `registerRawActions`, `setWrappedSave`, `setSaveButtonState`, etc.
- [x] `ToolbarProvider` refactored to bridge pattern:
  - Lifecycle: `initTab`/`destroyTab` on mount/unmount
  - `rawSave` subscription → re-creates `wrappedOnSave` → registers via `setWrappedSave`
  - `globalCalloutManager` events → `setSaveButtonState` in store
  - No React Context value provided (renders `<>{children}</>`)
- [x] `useToolbarContext` updated — reads from store slice for current `tab.id`; backward-compat shape unchanged
- [x] Updated `__tests__/contexts/ToolbarContext.test.tsx` — added store reset, import of `useToolbarStore`
- [x] Updated `contexts/__tests__/ToolbarContext.eventBased.test.tsx` — added `useTabContext`/`useTabRefreshContext` mocks, store reset
- [x] Run tests: 288 suites, 3741 tests, all green
- [ ] Manual test: trigger callout loading (edit a form field), verify save button disabled
- [x] Commit: `feat: migrate ToolbarContext to per-tabId Zustand store (Phase 6)`

### Architecture note
`wrappedOnSave` (which needs React hooks `useTabContext` + `useTabRefreshContext` for parent-refresh logic)
is created in `ToolbarProvider` and stored in `byTabId[tabId].wrappedSave`. This avoids circular deps:
`registeredActions.save` (raw) → triggers re-creation of `wrappedSave` → stored separately in the store.

---

## Phase 7: Migrate WindowContext → Zustand (BIGGEST WIN)

**Branch:** `perf/zustand-window`
**Estimate:** 5-8 days
**Impact:** VERY HIGH — 48+ properties, 69+ consumers, changes on EVERY interaction
**Prerequisite:** Phases 4, 6 completed (most complex migration)
**Can be done by:** Senior developer with deep context of the codebase

### Why this is the biggest win
WindowContext is the single biggest performance bottleneck. Every table click, filter, sort, form field change, and window switch triggers a re-render of 69+ components. With Zustand:
- Click a row → only `useWindowStore(s => s.selectedRecord[tabId])` re-renders (~3 components)
- Apply filter → only `useWindowStore(s => s.tableFilters[tabId])` re-renders (~2 components)
- **Expected improvement: 90-95% fewer re-renders per interaction**

### Store architecture
```
stores/windowStore.ts
├── windowsSlice: windows Map, activeWindowId, window CRUD
├── tableStateSlice: filters, sorting, visibility, order (per tab)
├── navigationSlice: activeLevels, activeTabsByLevel, initialized flags
├── formStateSlice: form data per tab
├── selectionSlice: selectedRecord per tab, clearChildren
└── recoverySlice: isRecoveryLoading, recoveryError, triggerRecovery
```

### Checklist

- [ ] Create `packages/MainUI/stores/windowStore.ts` with `immer` + `devtools` middleware
- [ ] Use `immer` because WindowContext does deep nested state updates (spread hell)
- [ ] Create backward-compat wrapper in `contexts/window.tsx`
- [ ] Migrate consumers in batches:
  - [ ] Batch 1: Read-only consumers (isHomeRoute, activeWindow) — ~15 files
  - [ ] Batch 2: Table state consumers (filters, sorting) — ~10 files
  - [ ] Batch 3: Selection consumers (selectedRecord) — ~15 files
  - [ ] Batch 4: Navigation state consumers — ~10 files
  - [ ] Batch 5: Form state consumers — ~10 files
  - [ ] Batch 6: Window management (CRUD, cleanup) — ~9 files
- [ ] Update all 41 useWindowContext consumers
- [ ] Update test mocks
- [ ] Run full test suite per batch, verify, commit

### Key pattern: immer for deep updates
```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

export const useWindowStore = create<WindowStore>()(
  devtools(
    immer((set) => ({
      windows: {},
      setTableFilters: (windowId, tabId, filters) =>
        set((state) => {
          state.windows[windowId].tabs[tabId].filters = filters;
        }),
    })),
    { name: "WindowStore" }
  )
);
```

---

## Phase 8: Migrate MetadataStore → Zustand + Cache Strategy

**Branch:** `perf/zustand-metadata`
**Estimate:** 3-5 days
**Impact:** High — eliminates unnecessary metadata re-fetches
**Can be done by:** Mid-senior developer

### Checklist

- [ ] Create `packages/MainUI/stores/metadataStore.ts`
- [ ] **Fix aggressive cache busting** — `loadWindowData()` currently clears cache BEFORE loading. Change to: only reload if cache is expired or missing
- [ ] Add cache eviction strategy (LRU, max 50 windows in memory)
- [ ] Add `getWindowMetadata` selector that returns stable reference
- [ ] Migrate MetadataSynchronizer to use store directly
- [ ] Update 4 consumers
- [ ] Tests, verify, commit

---

## Phase 9: Table Editing Virtualization Fix

**Branch:** `perf/table-virtualization`
**Estimate:** 3-5 days
**Impact:** HIGH for users editing large tables
**Can be done by:** Developer familiar with Material React Table
**Independent of Zustand migration — can be done in parallel**

### Problem
`tableFeatureCompatibility.ts:134` disables row virtualization when ANY row is being edited on tables with >1000 rows. This means editing 1 cell in a 5000-row table renders ALL 5000 rows in the DOM.

### Checklist

- [ ] Research Material React Table's support for virtualization + inline editing
- [ ] Explore keeping virtualization ON during editing by:
  - Only rendering the editing row + virtualized visible rows
  - Using `rowVirtualizerInstanceRef` to pin editing rows
- [ ] If MRT doesn't support this natively, implement row-level memoization
- [ ] Profile with Chrome DevTools before/after
- [ ] Add performance test covering this scenario
- [ ] Tests, verify, commit

---

## Phase 10: Remove Provider Nesting from layout.tsx

**Branch:** `perf/flatten-providers`
**Estimate:** 1 day
**Impact:** Cleanup — makes layout.tsx readable and removes dead providers
**Prerequisite:** All Zustand migrations complete
**Can be done by:** Any developer

### Checklist

- [ ] Remove all migrated providers from `app/layout.tsx`:
  - LoadingProvider (Phase 1)
  - PreferencesProvider (Phase 2)
  - FavoritesProvider (Phase 3)
  - UserProvider (Phase 4)
  - TabsProvider (already not in layout)
  - ToolbarProvider (already not in layout)
  - WindowProvider (Phase 7)
  - MetadataStoreProvider (Phase 8)
- [ ] Delete backward-compat wrapper files
- [ ] Delete old context files
- [ ] Update remaining imports
- [ ] Run full test suite
- [ ] Commit: `refactor: remove migrated context providers from layout`

---

## Migration Pattern Reference

Every context migration follows the same steps. Copy this for each phase:

### Step-by-step per context

1. **Create store file** in `packages/MainUI/stores/<name>Store.ts`
2. **Move state + actions** from Context to Zustand `create()` 
3. **Add middleware:** `devtools` always, `persist` if uses localStorage, `immer` if deep state
4. **Create backward-compat wrapper** in the original context file — delegates to store
5. **Update consumers** one by one to import from store with selectors
6. **Update tests** — Zustand stores don't need Provider wrappers:
   ```typescript
   // Before: renderHook(() => useX(), { wrapper: XProvider })
   // After: reset store in beforeEach, no wrapper needed
   beforeEach(() => useXStore.setState(initialState));
   ```
7. **Run tests** after each consumer migration
8. **Remove backward-compat wrapper** when all consumers migrated (Phase 10)

### Selector patterns (CRITICAL for performance)

```typescript
// Single field (best — no unnecessary re-renders):
const token = useUserStore((s) => s.token);

// Multiple fields (use useShallow to prevent object identity issues):
import { useShallow } from "zustand/react/shallow";
const { name, email } = useUserStore(
  useShallow((s) => ({ name: s.name, email: s.email }))
);

// NEVER do this (defeats the purpose — re-renders on ANY change):
const store = useUserStore(); // ❌
```

### Testing outside React

```typescript
// Zustand stores work outside components — useful for API interceptors, utils
import { useUserStore } from "@/stores/userStore";
const token = useUserStore.getState().token;
```

---

## Measurement & Verification

For each phase, before and after metrics should be captured:

### How to measure
1. **React DevTools Profiler** — record interaction, compare render counts
2. **Chrome DevTools Performance** — record 10 seconds of typical interaction, compare frame drops
3. **Specific metric:** Count `console.log("render", componentName)` in key components during interaction

### Target metrics per phase

| Phase | Metric | Before (expected) | After (target) |
|-------|--------|-------------------|----------------|
| 4 (User) | Re-renders on role switch | ~99 | ~15 |
| 7 (Window) | Re-renders on row click | ~69 | ~5 |
| 7 (Window) | Re-renders on filter apply | ~69 | ~3 |
| 9 (Table) | DOM nodes during edit (5k rows) | ~5000 rows | ~50 visible rows |
| 0 (Progress) | State updates during animation | 60 (3s × 20/s) | 0 (CSS) |
