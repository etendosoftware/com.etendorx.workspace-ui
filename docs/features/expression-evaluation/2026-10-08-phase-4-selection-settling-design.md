# Performance – Phase 4: settle selection side effects

- **Ticket:** ETP-5641 (branch `hotfix/ETP-5641`, PR #955)
- **Status:** Approved
- **Date:** 2026-10-08
- **Previous phase:** [Phase 3 design](./2026-10-08-phase-3-open-record-design.md)

## 1. Problem

Moving through records with the keyboard arrows in the grid, or with the next/previous buttons in the
form, runs every selection side effect for every record passed over. On a slow machine the requests and
re-renders pile up until the UI freezes. Measured on Sales Order at `CPU_THROTTLE=4`:

| Action | Requests | Blocking CPU |
|---|---|---|
| 1 ArrowDown in the grid | 3: toolbar FIC `EDIT`, `SETSESSION`, child tab datasource | 0.59 s |
| 5 ArrowDown, 100 ms apart | 11 | 1.3 s |
| 1 Next in the form | 5: FIC `EDIT` ×2, UsedByLink ×2, recent-documents | 0.58 s |
| 5 Next, 100 ms apart | 27 | 2.1 s |

Keyboard navigation already debounces the URL update and `SETSESSION` (150 ms, `useTableSelection`), but
the selection graph is updated on every key and two consumers react to it immediately:

- `useToolbar` fetches a FIC `EDIT` for the selected record to evaluate process-button display logic
  that reads `context.*`. In form view this duplicates the form's own FIC, whose auxiliary inputs
  already take priority in the toolbar.
- Child tabs (`useTableData`) refetch their datasource on every parent change.

The Linked Items section fetches UsedByLink for every record even when the section is collapsed.

Classic handles the same case with a pause: `ob-standard-view.js` refreshes child tabs through
`fireOnPause('delayedRecordSelected_…', …, fireOnPauseDelay * 2)` (400 ms), "to handle the case that a
user navigates quickly over a grid".

## 2. Design

1. **`useSettledValue(value, delayMs)`** (`hooks/useSettledValue.ts`): a change after a quiet period is
   returned immediately (leading edge), so a single selection behaves exactly as today; changes that
   arrive within `delayMs` of the previous one are held and only the last is returned once the value
   has been stable for `delayMs` (trailing edge). `SELECTION_SETTLE_MS = 400`, as Classic.
2. **Child tabs settle on the parent id.** `useTableData` settles the parent id it fetches with and uses
   the parent record that matches it for the query context, so navigating over five parents fetches the
   first and the last only.
3. **The toolbar settles the record it fetches auxiliary inputs for**, and does not fetch them at all
   while the tab is in form view (the form's FIC provides them).
4. **Linked Items fetch only while their section is expanded.**
5. **The keyboard-navigation debounce of the URL update and `SETSESSION` goes from 150 ms to
   `SELECTION_SETTLE_MS`:** on a slow machine each key press takes longer than 150 ms, so it sent a
   `SETSESSION` for almost every row.

The row highlight, the selection graph, the URL and the form's own initialization are unchanged.

## 3. Behaviour

- One selection change: identical to before (leading edge).
- Fast navigation: for up to 400 ms after the last move, child tabs keep the previous parent's rows
  shown as loading (as during a fetch), and process buttons are evaluated with empty auxiliary inputs
  (Classic's `=== ''` fallback, as while a fetch is in flight) rather than another record's; records the
  user moved past are not requested.
- While a child tab waits, its form state and selection are already cleared for the new parent
  (`components/window/Tab.tsx`), and "New" creates under the new parent.
- Linked Items load when the section is opened, and again when the record changes while it is open.

## 4. Tests and acceptance

- `hooks/__tests__/useSettledValue.test.ts` (fake timers): leading change, coalesced burst, trailing
  value, restart of the quiet period.
- `useToolbar`: no auxiliary-input fetch in form view; the first and the last record of a burst of
  selections only; a late response for a record the user moved past is not applied.
- `hooks/table/__tests__/useSettledParent.test.ts`: the parent id and record `useTableData` fetches with
  follow the first and the last parent of a burst, and report the held state.
- Whole MainUI suite, `tsc`, Biome, data-testid codemod.
- Re-run the selection measurement: 5 ArrowDown and 5 Next at `CPU_THROTTLE=4` with fewer requests and
  lower blocking time; the normal benchmark with no step more than 10% worse.
