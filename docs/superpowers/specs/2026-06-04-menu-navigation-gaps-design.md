# Menu & Navigation Gaps Design

**Date:** 2026-06-04
**Ticket:** ETP-3754
**Status:** Draft

## Summary

Close two navigation gaps identified in the menu/MDI tab analysis:

1. **Menu collapse/expand state persistence** — sidebar group expand/collapse state is lost on refresh
2. **Unsaved-changes confirmation on tab close** — closing a window tab with dirty form or table data proceeds without warning

## Gap 1: Menu Collapse/Expand Persistence

### Problem

`Sidebar.tsx:203` stores `expandedItems` in `useState<Set<string>>`. State is lost on page refresh or role switch. The `useLocalStorage` hook already exists and is used by `useRecentItems` with the same role-scoping pattern.

### Solution

#### New hook: `packages/MainUI/hooks/useExpandedMenuItems.ts`

- Wraps `useLocalStorage` with key `"menuExpandedItems"`
- Role-scoped: `Record<string, string[]>` (same pattern as `useRecentItems` keyed by `roleId`)
- Exposes:
  - `expandedItems: Set<string>`
  - `setExpandedItems: (items: Set<string>) => void`
- Internally converts `Set<string>` <-> `string[]` for JSON serialization
- On role change, loads that role's persisted set (or empty set)

#### Modified: `packages/MainUI/components/Sidebar.tsx`

- Replace `useState<Set<string>>` (line 203) with `useExpandedMenuItems(roleId)`
- Pass `roleId` from `useUserStore`
- No interface changes to `Drawer` component — it already receives `expandedItems` and `setExpandedItems` via `searchContext`

#### What doesn't change

- `searchExpandedItems` remains ephemeral (search-driven auto-expand should not be persisted)
- `Drawer` component in ComponentLibrary — no changes needed
- No backend changes — localStorage only

### Files touched

| File | Change |
|------|--------|
| `packages/MainUI/hooks/useExpandedMenuItems.ts` | New hook |
| `packages/MainUI/components/Sidebar.tsx` | Replace `useState` with hook |

## Gap 2: Unsaved-Changes Confirmation on Tab Close

### Problem

`WindowTabs.tsx:84-92` — `handleCloseWindow` does optimistic removal + `cleanupWindow` with zero dirty-state checks. Users can lose unsaved form data or table inline edits by closing a tab.

Form dirty state IS tracked (`TabContext.hasFormChanges`, React Hook Form's `isDirty`). Table dirty state IS tracked (`editingRows` in `editingRowUtils`). But neither is visible at the window-close boundary in `WindowTabs`.

### Solution: Window-level dirty registry in `windowStore`

#### 2a. windowStore changes (`stores/windowStore.ts`)

New state:

```typescript
dirtyWindows: Record<string, Record<string, boolean>>
// Maps windowIdentifier -> source keys -> isDirty
// e.g. { "143_abc": { "form:tab123": true, "table:tab456": true } }
```

> **Why `Record<string, boolean>` instead of `Set<string>`:** The store uses `immer` middleware, which cannot proxy `Set` objects without calling `enableMapSet()` (not enabled in this codebase). A plain object works natively with immer and is JSON-serializable.

New actions:

```typescript
setWindowDirtySource(windowIdentifier: string, sourceKey: string, isDirty: boolean): void
// Sets or deletes a source key in the record

// Derived check (not stored, computed):
// isWindowDirty = Object.values(dirtyWindows[id] ?? {}).some(Boolean)
```

Why a keyed record instead of a simple boolean: a window can have multiple tabs open simultaneously (parent form + child table). Each reports independently. The record is additive — each source owns its own key, and the window is dirty if _any_ source is dirty. No coordination needed for "who clears the flag."

**Cleanup:** Both `cleanupWindow` and `cleanState` must be modified:
- `cleanupWindow`: add `delete draft.dirtyWindows[windowIdentifier]` alongside the existing `delete draft.windows[windowIdentifier]`
- `cleanState`: add `draft.dirtyWindows = {}` alongside the existing `draft.windows = {}`

#### 2b. Form reporting (`components/Form/FormView/FormActions.tsx`)

`FormActions` already watches `isDirty` from `useFormContext().formState`.

- Add an effect: when `isDirty` changes, call `setWindowDirtySource(windowIdentifier, \`form:${tabId}\`, isDirty)`
- **Refactor:** `FormActions` currently derives `windowIdentifier` by scanning all windows for the active one. Change this to use `useCurrentWindowIdentifier()` instead (already used in sibling components like `Tab.tsx`). This is more correct — it returns the scoped window identifier from context, working correctly even when the window is not the active one.
- On unmount, clear the source: `setWindowDirtySource(windowIdentifier, \`form:${tabId}\`, false)`

#### 2c. Table reporting (`components/Table/index.tsx`)

The table already tracks `editingRows` state via `editingRowUtils`.

- Add an effect: when `Object.keys(editingRows).length > 0` changes, call `setWindowDirtySource(windowIdentifier, \`table:${tabId}\`, hasDirtyRows)`
- Same cleanup on unmount

#### 2d. Close interception (`components/NavigationTabs/WindowTabs.tsx`)

- `handleCloseWindow` checks if `Object.values(dirtyWindows[window.windowIdentifier] ?? {}).some(Boolean)` before proceeding
- The dirty check must happen **before** the optimistic removal (`setClosingWindowIds`) — only add to `closingWindowIds` after user confirms or if window is clean
- If dirty: show a `StatusModal` with:
  - Type: `"warning"`
  - Title: "Unsaved Changes"
  - Message: "You have unsaved changes that will be lost. Are you sure you want to close this window?"
  - Confirm: "Close"
  - Cancel: "Cancel"
- If not dirty: proceed directly (current behavior)
- Confirmation modal state lives in `WindowTabs` via local `useState` (same pattern as `useTableConfirmation`)

#### What doesn't change

- `useTableConfirmation` — continues handling table-internal confirmations (row-level discard, navigate within table)
- `TabContext.hasFormChanges` — continues to exist for form-internal use (save button enablement, etc.)
- No new components — reuses existing `StatusModal`

### Files touched

| File | Change |
|------|--------|
| `packages/MainUI/stores/windowStore.ts` | Add `dirtyWindows` state + `setWindowDirtySource` action + update `cleanupWindow` and `cleanState` |
| `packages/MainUI/components/Form/FormView/FormActions.tsx` | Refactor to use `useCurrentWindowIdentifier()` + add effect to report form dirty state |
| `packages/MainUI/components/Table/index.tsx` | Add effect to report table dirty state |
| `packages/MainUI/components/NavigationTabs/WindowTabs.tsx` | Add dirty check + confirmation modal before close |

### Edge cases

- **NEW record form:** A form in `FormMode.NEW` with no touched fields has `isDirty === false`. This is acceptable — an untouched new form has no user data to lose. If the user has typed into fields, `isDirty` becomes `true` and the dialog appears.
- **Rapid close after save:** If the user clicks Save then immediately closes the tab before the save response arrives, `isDirty` is still `true` until `reset()` is called post-save. The confirmation dialog will appear. This is acceptable (errs on the side of caution).

## Out of Scope

- `UINAVBA_RecentListSize` preference integration (hardcoded to 5, not a blocker)
- `ad_preference` backend persistence for menu state (localStorage sufficient for now)
- `beforeunload` browser event (browser tab close / refresh) — note: the `dirtyWindows` registry designed here enables future `beforeunload` support trivially

## Testing Strategy

- **useExpandedMenuItems**: Unit test — persist, restore, role isolation
- **windowStore dirty registry**: Unit test — add/remove sources, cleanup
- **FormActions dirty reporting**: Integration test — isDirty effect fires correctly
- **WindowTabs confirmation**: Integration test — dirty window shows modal, clean window closes directly
