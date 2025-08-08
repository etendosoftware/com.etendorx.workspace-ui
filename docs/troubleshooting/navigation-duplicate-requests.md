# Duplicated navigation requests when opening a window

This note documents the investigation and root cause of >20 identical backend calls triggered when navigating to a window. It also outlines a safe fix plan.

## Symptoms
- Opening a window triggers 20+ identical requests to the backend.
- Chrome DevTools Initiator stack (examples):
  - `useMultiWindowURL.useCallback[navigate] @ useMultiWindowURL.ts:245`
  - `useMultiWindowURL.useCallback[clearSelectedRecord] @ useMultiWindowURL.ts:377`
  - `Tab.useCallback[handleClearChildren] @ Tab.tsx:118`
  - `Tab.useEffect.handleDeselection @ Tab.tsx:140`
  - `Graph.clearSelected @ graph.ts:162`
  - `SelectedProvider.useCallback[clearAllStates] @ selected.tsx:74`
  - `TabsContainer.useEffect @ TabsContainer.tsx:45`

## Reproduction
1. Navigate to `/window` and open any window with multiple child tabs.
2. Observe the Network panel when the window loads.
3. Multiple identical calls to metadata/backend occur during initial mount.

## Root Cause
There is a cascade of URL updates (router.replace) fired in quick succession during the initial mount and when clearing tab selections:

- `TabsContainer` clears selection state on window change:
  - `packages/MainUI/components/window/TabsContainer.tsx` (useEffect) calls `clearAllStates()`.
- `SelectedProvider.clearAllStates()` iterates over all tabs and invokes Graph clear operations which emit events per tab:
  - `packages/MainUI/contexts/selected.tsx` lines 48–86.
  - Emits `unselected` for each tab via `Graph.clearSelected`.
- Each `Tab` subscribes to `unselected` and runs `handleClearChildren`:
  - `packages/MainUI/components/window/Tab.tsx`, `useEffect` adding `graph.addListener("unselected", ...)`.
  - `handleClearChildren()` iterates over child tabs and calls:
    - `clearSelectedRecord(windowId, child.id)` → calls `navigate()` → `router.replace(...)`.
    - `clearTabFormState(windowId, child.id)` → calls `navigate()` → `router.replace(...)`.
- `useMultiWindowURL` implements each mutator to immediately call `navigate(updatedWindows)`:
  - `packages/MainUI/hooks/navigation/useMultiWindowURL.ts` functions like `setSelectedRecord`, `clearSelectedRecord`, `setTabFormState`, `clearTabFormState` all call `navigate()`.

This results in many sequential `router.replace` calls with near-identical URLs during the cascade. While some may be no-ops logically, they still trigger route transitions/fetches on the client and re-trigger effects that kick off backend requests (e.g., metadata loads in `MetadataProvider` and `Window`).

## Impact
- Excessive identical requests to backend (metadata and related) on initial mount and deselection flows.
- Unnecessary route transitions causing UI jank and wasted re-renders.
- Potential throttling or rate limiting risk in high-traffic scenarios.

## Fix Plan (Safe, Incremental)

1) Batch URL mutations (primary)
- Add bulk mutators or a transaction API in `useMultiWindowURL` to accumulate multiple state changes and call `router.replace` once.
- Example options:
  - `applyWindowUpdates(transform: (windows) => WindowState[]): void` – computes and navigates once.
  - `clearSelectedRecords(windowId: string, tabIds: string[]): void` and `clearTabFormStates(windowId: string, tabIds: string[]): void` – combine both into one `navigate`.
- Refactor `Tab.handleClearChildren` to use a bulk mutation instead of calling two mutators per child.

2) Guard against identical navigations (secondary)
- In `navigate()`, compare the computed URL with `window.location.href` (or current `searchParams`) and skip `router.replace` if equal.
- This avoids redundant transitions during edge cases.

3) Reduce event cascades during mass clear (optional but recommended)
- Add a “silent” clear in `Graph` (e.g., `clearSelected(tab, { silent: true })`) or temporarily suspend `unselected` listeners in `SelectedProvider.clearAllStates` to avoid invoking `handleClearChildren` N times during initial reset.
- Alternatively, during `TabsContainer` initial effect, skip calling `clearAllStates()` when the window is first mounting to avoid re-entrancy, or debounce it with `requestAnimationFrame` and batch URL changes.

4) Metadata load de-duplication (defensive)
- Ensure `loadWindowData` cannot be re-triggered while a load is already in progress for the same `windowId` (it already checks `loadingWindows[windowId]`, keep this strong and avoid clearing cache in a loop).

## Acceptance Criteria
- Opening a window results in at most a single navigation update during initial state clearing.
- No more than 1 backend metadata request is fired per window open (unless an explicit refetch is triggered).
- `Tab` deselection of a parent with many children performs a single URL update.
- No regressions in existing navigation: opening/closing tabs, selecting records, and form/table mode switching.

## References
- `packages/MainUI/hooks/navigation/useMultiWindowURL.ts`
- `packages/MainUI/components/window/Tab.tsx`
- `packages/MainUI/components/window/TabsContainer.tsx`
- `packages/MainUI/contexts/selected.tsx`
- `packages/MainUI/data/graph.ts`
- Implementation summary (done)
- Batching added to `useMultiWindowURL`:
  - `applyWindowUpdates(transform)` executes a single `router.replace` with all changes.
  - `clearChildrenSelections(windowId, childTabIds[])` clears selected records and tab form states for multiple tabs in one navigation.
  - `openWindowAndSelect(windowId, { selection: { tabId, recordId, openForm? } })` opens/activates a window and applies selection (optionally opens the form).
- Navigation guard:
  - `navigate()` compares current vs. next query string and skips `router.replace` if identical.
- Consumer refactor:
  - `Tab.handleClearChildren()` now calls `clearChildrenSelections` instead of issuing per-child `navigate()`.
- Tests:
  - `useMultiWindowURL.batch.test.tsx` asserts single navigation and cleared states.
  - `useMultiWindowURL.openAndSelect.test.tsx` asserts selection is encoded in a single navigation.

