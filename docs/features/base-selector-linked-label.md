# BaseSelector linked label behavior (open tab filtered by clicked value)

This document describes the expected behavior and technical approach for labels rendered within `BaseSelector` (or equivalent selector components) when `link = true`.

## Goal
- When a label inside a selector is configured with `link = true`, clicking the label should:
  1) Open the corresponding target tab/window (already supported), and
  2) Pre-filter/position the target by the specific record that was clicked.

## UX Flow
1. User clicks a linked label in a selector cell.
2. The application opens the configured window/tab.
3. The target tab shows data positioned/filtered to the clicked record (e.g., parent selection set so child list reflects that context, or direct record selection if targeting a form-capable tab).

## Technical Design

### Inputs and assumptions
- The label config provides at least:
  - `targetWindowId`: window to open
  - `targetTabId`: tab to focus/select in the target window
  - `targetRecordId` (or key + mapping): record identifier from the clicked value
- Existing navigation utilities:
  - `useMultiWindowURL.openWindow(windowId)`
  - `useMultiWindowURL.setSelectedRecord(windowId, tabId, recordId)`
  - `useMultiWindowURL.setTabFormState(windowId, tabId, recordId, mode, formMode)` (optional if navigating directly to form)

### Behavior
- After opening the target window, set the selected record for `targetTabId` via `setSelectedRecord` using the clicked record id.
- If the target tab is a form-capable tab and deep-linking to the form is desired, call `setTabFormState` accordingly (e.g., `TAB_MODES.FORM`, `FORM_MODES.EDIT`).
- Child tabs that depend on the selected record of `targetTabId` will automatically filter since they read parent selection from URL state.

### Example handler
```ts
// inside BaseSelector / cell renderer
const { openWindow, setSelectedRecord, setTabFormState } = useMultiWindowURL();

const onClickLinkedLabel = () => {
  openWindow(targetWindowId);
  // Option A: table context
  setSelectedRecord(targetWindowId, targetTabId, targetRecordId);

  // Option B (optional): jump straight to form
  // setTabFormState(targetWindowId, targetTabId, targetRecordId, TAB_MODES.FORM, FORM_MODES.EDIT);
};
```

### Edge cases
- If `targetRecordId` is missing or invalid, fallback to just `openWindow(targetWindowId)` and no selection.
- If the target window is already open and active, skip reopening and only update selection.
- If multiple linked labels point to different tabs within the same window, ensure selection is applied for the specific `targetTabId`.

## Acceptance Criteria
- Clicking a linked label opens the window and applies selection for the target tab using the clicked record id.
- Dependent child tabs reflect the correct filtered state based on the selected parent.
- No extra navigations are triggered: selection should be applied in a single URL update (see batching notes in the troubleshooting doc).

## Related
- docs/troubleshooting/navigation-duplicate-requests.md (batch changes to avoid duplicate navigations)
- packages/MainUI/hooks/navigation/useMultiWindowURL.ts
- packages/MainUI/hooks/navigation/useRedirect.ts
- packages/MainUI/components/Form/FormView/Label.tsx
- packages/MainUI/hooks/table/useColumns.tsx (grid cells link behavior)
