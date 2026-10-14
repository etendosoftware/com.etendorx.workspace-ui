# Grid: fetch only the needed properties (`_selectedProperties`) — design

- **Ticket:** ETP-5641 (round 2, item "Grid fetches all properties per row")
- **Status:** proposal, not implemented. Needs review before starting: it touches selection, session,
  form initialization, processes and inline editing.
- **Repos:** `com.etendoerp.metadata` (required properties per tab) and this repo (grid, hydration).

## 1. Problem and expected gain

The main grid requests every property of the entity for every row. Measured on Sales Invoice (local,
header tab, 37 rows, `POST /api/datasource`):

| Request | Bytes | Server time | Keys per row |
|---|---|---|---|
| All properties (today) | 187 KB | 221 ms | 183 |
| `_selectedProperties` = id + 29 grid columns | 37 KB | 37 ms | 36 |

Bytes alone would mostly be solved by gzip (infra). The server time is the real gain: Classic's
`DataToJsonConverter` resolves the identifier of every foreign key of every row, so the cost grows with
rows × FK properties, and the demo server is 7–10× slower than local. A 100-row page scales accordingly
(~506 KB in the 2026-10-01 measurement).

The backend always returns `id`, `_identifier`, `_entityName`, `$ref` and `recordTime` besides the
selected properties.

## 2. Why it is not just a parameter

Grid rows are treated as complete records all over the UI. They reach the rest of the app through:

- the selection graph: `hooks/useTableSelection.ts:308-328` (`graph.setSelected` / `setSelectedMultiple`
  with the raw row), `utils/table/openRecordInForm.ts:143-145`;
- the records cache: `components/Table/index.tsx:3557` (`graph.setRecords`), read by `graph.getRecord`;
- `TabContext.record` / `parentRecord` (`contexts/tab.tsx:52-55`), which is the raw row whenever that tab
  is in grid view.

Consumers that would **silently send wrong data to the backend** with a partial row:

| Consumer | Where | What is sent |
|---|---|---|
| SETSESSION on selection | `utils/hooks/useTableSelection/sessionSync.ts:98-102` | every row value as `inp*` |
| FIC EDIT when the form opens from the grid cache | `hooks/useCurrentRecord.ts:123-129` → `utils/hooks/useFormInitialization/utils.ts:89` | every record value as `inp*` |
| Toolbar aux-input FIC | `hooks/Toolbar/useToolbar.ts:115-161` | row as `inp*` |
| Process defaults / form / execution | `hooks/useProcessInitialization.ts:137-155`, `ProcessDefinitionModal.tsx:707`, `ProcessModal/hooks/useProcessExecution.ts:630-821`, `useProcessPayload.ts` | `buildProcessPayload(record)`, `getSelection()` rows, script `selectedRecords` |
| Pick-and-execute grid params | `ProcessModal/WindowReferenceGrid.tsx:1240-1280`, `useProcessDatasourceConfig.ts:62-77` | `inpadOrgId`, `inpadClientId`, `@Invoice.businessPartner@`, … |
| Bulk completion | `utils/process/bulkCompletionUtils.ts:28-58` | `documentStatus`, `processing` per record |
| Legacy (iframe) processes | `utils/processes/manual/utils.ts:205-250` | missing values fall back to fake defaults (`DR`, `N`, empty org/client) — `manual/constants.ts:18-37` |
| Child tab context params | `utils/contextUtils.ts:74-148` (`useTableData.tsx:493-536`) | storedInSession values of ancestors; parent `client` / `organization` (missing org → `AD_ISORGINCLUDED` drops every child row) |
| Selectors in child forms | `hooks/datasource/useTableDirDatasource.ts:160-209, 551-552` | parent record as `inp*`, parent warehouse |
| Inline callout / save | `components/Table/index.tsx:1438-1621`, `Table/utils/saveOperations.ts:83-189, 587-596` | merged row as `inp*`; `oldValues`; `updated` (stale-object check) |
| Tree drag and drop | `hooks/table/useTreeNodeDragDrop.ts:405-417` | `{...row}` as an update with `oldValues` |

Consumers that would **show wrong UI** (nothing sent): button display logic and labels
(`useToolbar.ts:163-214`, `ProcessMenu.tsx:39-48`), child tab display logic (`TabsContainer.tsx:74-130`),
field display/read-only logic against `parentRecord` (`useDisplayLogic.ts`, `BaseSelector.tsx:303`),
audit fields and `_readOnly` (`useFormFields.ts:93-133`, `useFormInitialization.ts:216-237`), breadcrumbs
and recent documents (`_identifier`, always returned), `CustomJsCell` (arbitrary fields), tree icons.

Consumers that only need `id`: delete, clone, print, criteria by `parentId`, Next/Previous (but the target
record then goes through the form path above).

## 3. How Classic does it

`OBViewGridComponent.getRequiredGridProperties()` (core, `org.openbravo.client.application`) and
`ob-view-grid.js` send `_selectedProperties` = visible columns + required properties:

- `id`, `client`, `organization` (record writability), audit fields (`updated`, `updatedBy`,
  `creationDate`, `createdBy` — the FIC does not return them in EDIT mode);
- identifier properties of the entity;
- button properties (labels) and properties used in button display logic;
- properties used in subtab display logic; hidden properties used in display logic;
- the link-to-parent property (or the property pointing to the parent tab);
- storedInSession properties; properties used in auxiliary inputs of the tab;
- `processNow` / `processed` when present (doc action buttons).

Classic can stop there because its FIC in EDIT mode loads the record from the database by id. This UI
builds most backend payloads from the client-side record, so it also needs hydration (below).

## 4. Proposed design

### 4.1 Module: required properties per tab

`TabBuilder` adds `requiredGridProperties: string[]` to each tab, computed like Classic (reuse the core
`OBViewTab` / field handler helpers where they are public, otherwise port the queries). Computed once per
tab build; it is part of the window JSON, so the body ETag from round 2 covers it.

### 4.2 Grid: request visible + required

`hooks/table/useTableData.tsx:472-571` adds `_selectedProperties` = `id` + visible columns (from
`tab.fields[*].showInGridView` and the user's column visibility) + `requiredGridProperties` + color
properties already sent in `_extraProperties`.

- Column visibility is filled by an effect after the first render (`useTableData.tsx:1207-1221`): compute
  the first list from `showInGridView` so the first fetch is already reduced.
- Showing a hidden column must refetch (today `handleMRTColumnVisibilityChange` does not touch `query`).
- `fetchSummary` and tree `loadChildNodes` spread `query`; tree mode also needs `parentId`,
  `__treeParentId`, `summaryLevel`, `showDropIcon`, `eTMETAIcon`, `name` — keep tree mode on full rows in
  the first iteration.
- Mark rows as partial (e.g. a non-enumerable flag or a `Set` of ids per tab in the graph), so readers
  can tell a grid row from a full record.

### 4.3 Hydration of the selected record

One request by id (`criteria id = X`, all properties, `_extraProperties` as today): ~5 KB, ~20 ms locally.

- **On settled selection** (phase 4 already settles 400 ms before SETSESSION): hydrate the last selected
  record first, put the full record in the graph (`setSelected`, records cache), then send SETSESSION
  with it. Multi-selection: hydrate the selected rows in one request (`id in (...)`) when an action needs
  them (processes, bulk completion), not on every click.
- **Opening the form**: `useCurrentRecord` must not use a partial cached row; it fetches by id (it already
  does when the tab has property fields). `FormView` record resolution (`FormView/index.tsx:407-434`) the
  same.
- **Processes and legacy processes**: resolve the full selected records before building payloads
  (`ProcessDefinitionModal`, `hooks/Toolbar/useProcessExecution.ts`); the modal can show its loading state
  meanwhile.
- **Child tabs**: `client` / `organization` / storedInSession / link-to-parent come from
  `requiredGridProperties`, so the parent grid row is enough for criteria and context params; selectors in
  child forms use `parentRecord`, which is hydrated when the parent row is selected.
- **Inline editing**: hydrate the row before entering edit mode (the FIC call already makes the user
  wait), so `originalData`, callouts and save use a full record.
- **Button display logic in grid view**: covered by required properties (button + display-logic
  properties), no hydration needed to paint the toolbar.

### 4.4 Risk control

- Behind a flag (env or per-tab) during rollout; default on only after the e2e suites pass.
- A dev-mode guard in `buildPayloadByInputName` / `buildProcessPayload` that warns when called with a
  partial row, to catch missed consumers.
- Tests: unit tests for the property list and hydration; e2e smoke on Sales Invoice / Sales Order:
  complete and post from grid view, Copy From and Add Payment processes, legacy process from grid, child
  tab lines with organization filter, inline edit with a product callout, tree window drag and drop.
- Measure with `perf/bench.mjs` (`load-unfiltered`, `arrow-nav-5`, `open-record`) at 1x/4x and on demo.

## 5. Phases

1. Module: `requiredGridProperties` in `TabBuilder` + tests.
2. UI: graph partial-row marker + hydration service (no behaviour change yet: still full rows).
3. UI: route every consumer in §2 through hydration (form, processes, legacy processes, inline edit,
   SETSESSION).
4. UI: switch the grid request to `_selectedProperties` behind the flag; refetch on column show; measure.
5. Enable by default after e2e.

## 6. Open questions

- Is any consumer relying on fields that neither the visible columns nor Classic's required list cover
  (custom JS cells, client-side callouts in modules)? The dev-mode guard should reveal them.
- Should multi-selection processes hydrate all selected rows (N records) or should the backend load them
  by id (closer to Classic)?
