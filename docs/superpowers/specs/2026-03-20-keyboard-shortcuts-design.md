# Keyboard Shortcuts — Design Spec

**Date:** 2026-03-20
**Branch:** feature/ETP-3089
**Status:** Approved

## Context

The new WorkspaceUI interface lacks the keyboard shortcuts available in Etendo Classic. This spec covers the first batch of critical shortcuts to implement, prioritizing workflow efficiency and parity with the classic interface.

Shortcuts verified against `etendo_core/web/js/shortcuts.js` and `windowKeyboard.js`.

## Scope

This spec covers four shortcuts (plus a fifth deferred):

| Shortcut | Context | Action |
|---|---|---|
| `Ctrl+S` | Form view | Save current record |
| `Ctrl+N` | Form view | Create new record |
| `Escape` | Form view | Save (if dirty and save succeeds) then go back to grid |
| `↑ / ↓` | Grid view | Navigate row selection up/down |
| `Enter` | Grid view | Open selected record in form view (**deferred**) |

## Architecture — Option B (Localized hooks)

Each view registers its own shortcuts via a shared `useKeyboardShortcuts` hook. No new context or provider is needed.

```
hooks/useKeyboardShortcuts.ts       ← new reusable hook
components/Form/FormView/index.tsx  ← uses hook for Ctrl+S, Ctrl+N, Escape
components/Table/index.tsx          ← uses hook for ArrowUp, ArrowDown
```

### FormView and Table are mutually exclusive

FormView and Table are never mounted simultaneously within the same tab. When the user is in grid view, only `Table` is mounted. When the user enters a record, only `FormView` is mounted. This eliminates any cross-component Escape conflicts entirely.

The existing `document.addEventListener('keydown')` in `Table/index.tsx` (line 3274) handles `Escape` to cancel inline cell row editing — this is strictly a grid-view concern and has no overlap with the FormView Escape handler.

## `useKeyboardShortcuts` Hook

**File:** `packages/MainUI/hooks/useKeyboardShortcuts.ts`

```typescript
interface ShortcutConfig {
  handler: () => void | Promise<void>;
  allowInInputs?: boolean;  // default: false
  preventDefault?: boolean; // default: true
}

function useKeyboardShortcuts(
  shortcuts: Record<string, ShortcutConfig>,
  enabled?: boolean  // default: true — allows disabling contextually
): void
```

### Key format

Keys follow `event.key` values for bare keys (`'Escape'`, `'ArrowDown'`, `'ArrowUp'`) and a lowercase-normalized `ctrl+<key>` format for modifier combos (`'ctrl+s'`, `'ctrl+n'`).

Normalization logic:
- Bare keys: use `event.key` as-is (e.g. `'Escape'`)
- With Ctrl/Meta: `'ctrl+' + event.key.toLowerCase()` (Meta mapped to Ctrl for Mac support)

### Behavior

1. Attaches a `keydown` listener on `document` in a `useEffect`
2. On keydown: normalizes key combination from `event.key` + modifiers per the rules above
3. If focus is in `input | textarea | select | [contenteditable]` and `allowInInputs` is false → skip
4. Looks up the normalized key in `shortcuts` map; if not found → no-op
5. Calls `event.preventDefault()` if `preventDefault: true` (default)
6. Calls the matching handler
7. Cleans up listener on unmount or when `shortcuts` map changes

### Input guard exception

`Ctrl+S` and `Ctrl+N` use `allowInInputs: true` because users expect to save/create while typing in a field.

## FormView Shortcuts

**File:** `packages/MainUI/components/Form/FormView/index.tsx`

Hooks consumed: `useToolbarContext` (for `onSave`, `onNew`, `onBack`, `saveButtonState`), `useForm` (for `formState.isDirty`)

### Shared guard: busy state

Both `Ctrl+S` and `Escape` (when dirty) must check `saveButtonState` before calling `onSave`, mirroring the toolbar Save button's disabled state:

```
if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return
```

This prevents concurrent save calls when a callout is running or a save is already in flight.

### Ctrl+S — Save

```
guard:   if isSaving || isCalloutLoading → no-op
handler: onSave({ showModal: true })
allowInInputs: true
preventDefault: true  // prevents browser's native Save dialog
```

### Ctrl+N — New Record

```
handler: onNew()
allowInInputs: true
preventDefault: true
```

No busy-state guard needed — `onNew` does not trigger a save.

### Escape — Save and exit

```
guard:   if isSaving || isCalloutLoading → no-op
handler:
  if formState.isDirty:
    const saved = await onSave({ showModal: false })
    if (!saved) return  // save failed (e.g. validation error) — stay on form
  onBack()
allowInInputs: false
preventDefault: true
```

**Critical:** `onSave` returns `Promise<boolean>`. If it returns `false`, `onBack()` must NOT be called — the user stays on the form to fix the error.

**Escape and open dropdowns:** The FormView uses custom Select components (not native `<select>`). These custom dropdowns handle `Escape` via MUI's Popover/Menu internals, which call `stopPropagation()` on `keydown` when a popover is open. This prevents the form-level document handler from firing while a dropdown is open.

If a future Select implementation does not use MUI's Popover, it must call `event.stopPropagation()` on `Escape` keydown to preserve this contract.

## Grid Shortcuts

**File:** `packages/MainUI/components/Table/index.tsx`

### ArrowDown / ArrowUp — Navigate row selection

The correct record list for navigation is `effectiveRecords` — the memoized merge of `displayRecords` and `optimisticRecords` (defined at line 2361). Using raw `records` prop would cause off-by-one errors when optimistic (not-yet-persisted) records are present.

```
handler (ArrowDown):
  currentId = single selected record ID (from rowSelection state)
  if no currentId → no-op
  currentIndex = effectiveRecords.findIndex(r => String(r.id) === currentId)
  if currentIndex === -1 || currentIndex === effectiveRecords.length - 1 → no-op
  nextRecord = effectiveRecords[currentIndex + 1]
  setRowSelection({ [String(nextRecord.id)]: true })

handler (ArrowUp): same logic with currentIndex - 1
  if currentIndex === 0 → no-op

allowInInputs: false
preventDefault: true
enabled: editingRows.length === 0  // disabled when any row is in inline edit mode
```

**No conflict with existing Escape handler:** The existing `document` listener for `Escape` in Table (line 3274) only handles the `Escape` key to cancel row editing. Our new hook handles `ArrowUp`/`ArrowDown` only. No overlap.

**No conflict with `keyboardNavigation.ts`:** That module handles arrow keys only within the `KeyboardNavigationManager` which is invoked from cell editors (inline edit mode). When `enabled: editingRows.length === 0` our hook is disabled, so there is zero overlap.

**Container scoping:** Arrow key handlers must only fire when the event originates within the table container. This is implemented by checking `tableContainerRef.current?.contains(event.target as Node)` before acting. This prevents accidental row navigation when the user presses arrow keys while the toolbar or sidebar has focus.

## What is NOT in scope

- `Ctrl+D` (Delete) — not in this batch
- `Ctrl+R` (Refresh) — not in this batch
- `Enter` in grid (open form view) — deferred due to complexity with existing cell-edit Enter handling
- Global shortcuts (Ctrl+H, F9, etc.) — future work

## Tests

### `useKeyboardShortcuts.test.ts`

- Fires handler when matching shortcut is pressed
- Does NOT fire when focus is in an input (unless `allowInInputs: true`)
- Fires when `allowInInputs: true` even with input focused
- Calls `preventDefault` by default
- Does NOT fire when `enabled: false`
- Cleans up listener on unmount
- Handles both Ctrl (Windows/Linux) and Meta (Mac) as the modifier

### FormView

- `Ctrl+S` calls `onSave({ showModal: true })`
- `Ctrl+S` works when focus is inside an input field
- `Ctrl+S` is a no-op when `saveButtonState.isSaving` is true
- `Ctrl+S` is a no-op when `saveButtonState.isCalloutLoading` is true
- `Ctrl+N` calls `onNew()`
- `Escape` with clean form calls `onBack()` only (no save)
- `Escape` with dirty form calls `onSave` then `onBack` when save returns `true`
- `Escape` with dirty form does NOT call `onBack` when save returns `false`
- `Escape` is a no-op when `saveButtonState.isSaving` is true

### Table

- `ArrowDown` with row selected → selects the next row in `effectiveRecords`
- `ArrowUp` with row selected → selects the previous row in `effectiveRecords`
- `ArrowDown` on last row → no change
- `ArrowUp` on first row → no change
- `ArrowDown` with no row selected → no change
- Arrow keys do nothing when `editingRows.length > 0` (inline edit mode)
- Arrow keys do nothing when `event.target` is outside the table container
