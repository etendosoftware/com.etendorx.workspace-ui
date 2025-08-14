# Form Callouts: Execution Model and Data Flow

This document describes how form field callouts run, how results are applied without cascading side effects, and how select options get populated when the backend returns restricted entries.

## Execution Model

- User-triggered: A callout runs only when the user changes a field value. The change is captured in the selector and `useCallout` builds a payload with the current form context.
- Single-flight queue: `GlobalCalloutManager` enqueues callouts and runs them sequentially per field to avoid overlapping work.
- Batch application: The response (`FormInitializationResponse`) can update many fields at once (`columnValues`, `auxiliaryInputValues`). These updates are applied as a single “batch” while callouts are globally suppressed. This prevents further callouts from firing as a side effect of each individual `setValue`.
- Resume: After the batch finishes, suppression is lifted so future user interactions can trigger callouts normally.

## Data Application

- `columnValues`: For each item, the form sets both the value and its `${hqlName}$_identifier` when provided.
- `auxiliaryInputValues`: The form sets the raw value for auxiliary inputs.
- `entries` support: If the backend returns `entries` for a field, the form injects them into `${hqlName}$_entries`. The select hook (`useSelectFieldOptions`) will prefer these entries over remote datasource records for a consistent post-callout UI state.

## Post-Save Behavior

- After saving, the form applies the server-updated values using a short `isFormInitializing` window to silence callouts during `reset/setValue`. This avoids cascades or refetch loops immediately after a save.
- A redundant refetch after save is removed; the only refetch happens when `recordId` changes.

## APIs and Hooks

- `GlobalCalloutManager`
  - `executeCallout(fieldName, fn)`: queues and runs callouts sequentially.
  - `suppress()` / `resume()`: silence/resume callouts during batch application.
  - `isSuppressed()` / `isCalloutRunning()` / `arePendingCalloutsEmpty()`
- `BaseSelector`
  - Triggers callouts on user change.
  - Applies results in a suppressed batch (values + entries) to avoid cascades.
- `useSelectFieldOptions`
  - Builds select options from datasource records.
  - If `${hqlName}$_entries` exist, they take precedence (from callout response).

## Debugging

- Set `DEBUG_CALLOUTS=true` (or `NEXT_PUBLIC_DEBUG_CALLOUTS=true`) in env, or `localStorage.setItem('DEBUG_CALLOUTS','true')` in the browser, to enable callout debug logs:
  - Trigger by user, executing/completed, suppress/resume, applying values.

## Tests

- `services/__tests__/callouts.manager.test.ts`: suppress/resume and queue ordering
- `hooks/__tests__/useSelectFieldOptions.entries.test.tsx`: entries injection preferred
- `components/Form/FormView/selectors/__tests__/BaseSelector.callout.applyEntries.test.tsx`: end-to-end application of callout results without cascades

