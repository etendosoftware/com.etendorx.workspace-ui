# Form View "Cancel" button: discard changes before navigating

**Date:** 2026-07-22
**Status:** Approved (design)

## Problem

The "Cancel" button in Form View unconditionally exits to Grid View, silently
dropping any unsaved edits. This contradicts the Classic UI workflow, which
reverts unsaved changes before navigating. Data the user typed is lost without
any rollback step.

## Goal

Make Cancel mirror the Classic UI workflow:

- **If the form is dirty:** discard pending changes, roll the record buffer back
  to its last-loaded (persisted) state, and keep the user in Form View.
- **If the form is clean:** navigate from Form View back to Grid View.

## Current implementation

The Cancel button is a toolbar action, not a JSX element:

- `CANCEL` action → `onBack()` — `packages/MainUI/hooks/Toolbar/useToolbarConfig.ts:362`
- `onBack` resolves to the `back` action registered by FormView — `packages/MainUI/contexts/ToolbarContext.tsx:147`
- The registered handler is `handleBack` — `packages/MainUI/components/Form/FormView/FormActions.tsx:197`

```ts
const handleBack = useCallback(() => {
  if (windowIdentifier) {
    clearTabFormState(windowIdentifier, tab.id); // -> navigates to grid
  }
  resetFormChanges();
}, [windowIdentifier, clearTabFormState, tab, resetFormChanges]);
```

`handleBack` is the single chokepoint the Cancel button flows through, and it
already has `isDirty` (from `useFormContext().formState`, `FormActions.tsx:55`)
and the react-hook-form context in scope.

## Design

Introduce a conditional branch in `handleBack`. No new service, store, or
component is required.

```ts
const handleBack = useCallback(() => {
  if (isDirty) {
    formContext.reset(); // revert buffer to last-loaded values; stay in Form View
    return;              // resetFormChanges syncs via the existing isDirty effect
  }
  if (windowIdentifier) {
    clearTabFormState(windowIdentifier, tab.id); // clean form -> navigate to grid
  }
  resetFormChanges();
}, [isDirty, formContext, windowIdentifier, clearTabFormState, tab, resetFormChanges]);
```

### Discard mechanism — local re-initialization (no network)

The discard re-applies the last-loaded record data locally by reusing the
form's own full-initialization path:

```ts
// index.tsx
const discardChanges = useCallback(() => {
  if (!availableFormData) return;
  applyFullInitialization(processFormData(availableFormData, tab.fields));
}, [availableFormData, tab.fields, applyFullInitialization]);
```

`FormActions.handleBack` calls `discardChanges()` (via a prop) in the dirty
branch. This is instant with no backend round-trip, matching Classic UI's
instant undo. A server `refetch()` primitive also exists but was rejected: it
adds a network round-trip and loading spinner on every cancel.

**Why not a bare `formContext.reset()`?** react-hook-form's `reset()` reverts to
its internal `_defaultValues`, but on an EDIT load those stay frozen at the
initial grid `record` — they never include the form-initialization-sourced
reference-field identifiers (`<field>$_identifier`) and option entries
(`<field>$_entries`), which are applied post-mount via `setValue`. So a bare
`reset()` had two bugs: (1) reference fields rendered raw UUIDs instead of
labels, and (2) because `isDirty = !deepEqual(currentValues, _defaultValues)`,
re-applied identifier/entry keys made the form dirty again, so a second Cancel
click could not navigate. Re-running `applyFullInitialization` on the cached
`availableFormData` resets both values AND `_defaultValues` to the complete
last-loaded state, fixing both issues.

### New record edge case

A new, never-saved dirty record is treated uniformly: `reset()` rolls the buffer
back to the blank new-record defaults and the user stays in Form View. One code
path, consistent with the dirty-revert rule. (No special-casing to abandon the
new record and jump to the grid.)

### Why the dirty flags re-sync automatically

After `reset()`, `formState.isDirty` flips to `false`. Two existing effects then
fire and clear the derived dirty flags without any manual bookkeeping in
`handleBack`:

- `FormActions.tsx:100-106` — syncs `isDirty` to the per-tab `hasFormChanges`
  flag via `resetFormChanges()`.
- `FormActions.tsx:109-118` — clears the window-level dirty registry entry
  `form:${tab.id}` via `setWindowDirtySource`.

### Why the user stays in Form View when dirty

View mode is derived from per-tab form state in the window store (`Tab.tsx`,
`shouldShowForm`). Because the dirty branch does **not** call
`clearTabFormState`, the tab form state is untouched and Form View remains
rendered.

## Testing

Two cases, matching the acceptance criteria:

1. **Revert changes when form is dirty** — render `FormActions` with a dirty RHF
   form, invoke the registered `back` action. Assert `reset` was called and
   `clearTabFormState` was **not** called (user stays in Form View).
2. **Navigate to grid when form is clean** — render `FormActions` with a
   non-dirty form, invoke the `back` action. Assert `clearTabFormState` was
   called (navigates to grid) and `reset` was **not** called.

## Out of scope

- No confirmation dialog before discarding (spec discards directly on click).
- No change to the keyboard-Escape path (`handleKeyboardEscape`), which already
  auto-saves before going back.
- No change to the Save or Refresh toolbar actions.
