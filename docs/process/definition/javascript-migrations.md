# JavaScript migrations — platform requirements for full classic parity

> **Goal:** enumerate **every platform capability** the new Etendo UI (Next.js, `/client`) and the
> metadata adapter module (`/erp/modules/com.etendoerp.metadata`) must provide so that **each of the
> 37 in-scope legacy JavaScript files can be ported with no loss of behaviour** relative to the
> classic SmartClient UI.
>
> **Analysis date:** 2026-06-01 · **Companion inventory:** [process-definition-js-testing.md](./process-definition-js-testing.md).
>
> **This document does *not* describe how to port any specific file, nor the staging order of the
> JS migration itself.** It is a *requirements* document: what platform surface the migrated scripts
> need to find when they run.

---

## §1. Purpose and relation to the inventory

The inventory ([process-definition-js-testing.md](./process-definition-js-testing.md)) enumerates
*what* must migrate: **37 in-scope processes**, ~7,600 lines of legacy JS across 33 distinct files,
the 5 hook points and the 6 metadata columns added by `com.etendoerp.metadata`.

This document enumerates *the platform capabilities* the new UI and the metadata adapter must
provide so each of those files can be ported with no loss of behaviour. The §4 capability sections
are each tagged **DONE / PARTIAL / MISSING** against the current substrate, cross-referenced with
the 37 processes in §6, and folded into a priority ordering in §7.

Out of scope here: the JS rewrite for any specific file (lives in the migration tickets per
process), the operational decision of which process to migrate first (lives in §7 as a *recommen-
dation*, not a binding plan), and any change to the database schema (closed — six columns exist).

---

## §2. Reference architecture

Request flow is canonical end-to-end:

```
Client (Next.js, /client)
  └─ ProcessDefinitionModal opens a Defined Process
     └─ /api/erp proxy (Next.js route handlers under /client/packages/MainUI/app/api)
        └─ ERP (Etendo classic, Tomcat)
           └─ /sws/com.etendoerp.metadata/meta/process/{id} (ProcessDefinitionBuilder)
              ├─ DataToJsonConverter auto-emits Hibernate properties
              └─ Builder explicitly renames `eTMETAOnload` → `etmetaOnload`
```

Where the **runtime substrate** for JS hooks lives today on the client:

- [ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx) — compiles `etmetaOnload` / `etmetaOnRefresh`, calls them with the view-arg.
- [hooks/useProcessExecution.ts](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts) — compiles + calls `etmetaOnprocess` on Execute click.
- [processView.ts](../../../packages/MainUI/components/ProcessModal/processView.ts) — `compileOnRefreshFunction` helper.
- [utils/functions.ts](../../../packages/MainUI/utils/functions.ts) — `compileStringFunction` / `executeStringFunction` runtime (single-function compile, context injection via `new Function`).
- [utils/processes/definition/utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts) — `buildProcessScriptContext` exposes `callAction` / `callDatasource` / `callServlet` to migrated scripts.
- [utils/propertyStore.ts](../../../packages/MainUI/utils/propertyStore.ts) — `createOBShim()` exposes `OB.PropertyStore.get`.

Each gap below names which side of the wire it must be filled on. **The vast majority of work is
on the client**; the metadata module is already very close to complete because the `DataToJsonConverter`
auto-emits the new `etmeta*` properties under their property names (the previous iteration
already fixed the only legacy-casing exception, `eTMETAOnload` → `etmetaOnload`).

---

## §3. Current substrate baseline

Closed work that ships today, with evidence:

| Capability | File / call site | Status |
|---|---|---|
| Process-level `etmeta*` JSON exposure (`etmetaOnload`, `etmetaOnprocess`, `etmetaOnRefresh`, `etmetaPayscriptLogic`) | [ProcessDefinitionBuilder.java](../../../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/ProcessDefinitionBuilder.java) | DONE |
| Parameter-level `etmetaOnParameterChange` / `etmetaOnGridLoad` JSON exposure | [ParameterBuilder.java](../../../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/ParameterBuilder.java) (auto-emitted by `DataToJsonConverter`; entity property names already in camelCase per [Parameter.java:348-364](../../../../erp/src-gen/org/openbravo/client/application/Parameter.java#L348-L364)) | DONE |
| `view.onRefreshFunction` compile-once + attach on both view-args | [processView.ts:40-53](../../../packages/MainUI/components/ProcessModal/processView.ts#L40-L53), [ProcessDefinitionModal.tsx:239-247](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx#L239-L247), [useProcessExecution.ts:654-668](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts#L654-L668) | DONE |
| `executeStringFunction` / `compileStringFunction` runtime (single-fn compile, context injection) | [functions.ts:55-87](../../../packages/MainUI/utils/functions.ts#L55-L87) | DONE |
| PayScript DSL registration on modal open | [ProcessDefinitionModal.tsx:310-315](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx#L310-L315) | DONE |
| Promise-based `callAction` / `callDatasource` / `callServlet` HTTP helpers | [utils.ts:120-190](../../../packages/MainUI/utils/processes/definition/utils.ts#L120-L190) | DONE |
| `OB.PropertyStore.get` shim | [propertyStore.ts:79-94](../../../packages/MainUI/utils/propertyStore.ts#L79-L94) | DONE |
| `showMsgInProcessView` response action (toast on success/warning/error) | [useProcessExecution.ts:679-696](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts#L679-L696) | DONE |
| Parameter-level hooks compiled + bound to form items / grid lifecycle | nothing yet — DB columns and API payload present, client never reads them | NOT STARTED |
| All other capabilities in §4 | n/a | MISSING or PARTIAL as flagged below |

---

## §4. Capability requirements

Each subsection follows a fixed template:

> **What classic does** — behaviour summary anchored on a canonical example.
> **Classic APIs covered** — bulleted list with one file:line evidence link each.
> **New-UI requirement** — what the migrated script must find when it runs, in terms of API
> surface shape. *No implementation detail.*
> **Backend requirement (if any)** — whether `com.etendoerp.metadata` must change.
> **Coverage status** — DONE / PARTIAL (with gap named) / MISSING.
> **Unlocks** — which processes from §6 flip to feasible.

### §4.1 — The `view` object contract

**What classic does.** Every hook (onLoad, onProcess, onRefresh, onChange, onGridLoad) receives a
`view` object that lets the script read its environment (current record, parent window, selected
records, the form, the grid) and trigger lifecycle actions (refresh, hide/show buttons, dispatch
nested processes). The shape is the SmartClient `OBStandardView`-style object, partially exposed
on the new UI as the view-arg dictionary constructed at [ProcessDefinitionModal.tsx:945-953](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx#L945-L953).

**Classic APIs covered by this capability** (read-only access unless otherwise stated):

- `view.theForm` — the DynamicForm hosting the parameter widgets. Evidence: [ob-aprm-addPayment.js:131](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L131).
- `view.messageBar` + `.setMessage(severity, title, text)` + `.hide()` — the in-modal sticky banner. See §4.7. Evidence: [ob-aprm-matchStatement.js:56](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L56), [ob-onchange-functions.js:73](../../../../erp/modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-onchange-functions.js#L73).
- `view.popupButtons.members` — array of footer buttons; scripts iterate to find by `_buttonValue`. Evidence: [ob-aprm-matchStatement.js:36](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L36).
- `view.cancelButton` (+ `.hide()`) — Cancel button handle. Evidence: [ob-aprm-matchStatement.js:40](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L40).
- `view.parentElement` / `view.parentElement.parentElement.closeButton` — modal chrome handles (close ‘X’). Evidence: [ob-aprm-matchStatement.js:41](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L41).
- `view.parentWindow` / `view.parentWindow.view.standardWindow` — traversal upward to the parent window for nested-process launching. Evidence: [ob-aprm-matchStatement.js:212](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L212).
- `view.callerField` (+ `.record`) — the field/button that invoked this process and its record. Evidence: [ob-aprm-findTransaction.js:40](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-findTransaction.js#L40), [validateCostingRuleProcess.js:46](../../../../erp/web/js/validateCostingRuleProcess.js#L46).
- `view.windowId` — current AD_Window id. Evidence: [ob-aprm-findTransaction.js:52](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-findTransaction.js#L52).
- `view.getContextInfo()` — context map (parameter values + parent record fields). Evidence: [ob-aprm-findTransaction.js:45](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-findTransaction.js#L45).
- `view.refresh(force, keepEditedValues)` — re-fetch and re-render the view. Evidence: [productCharacteristicsProcess.js:263](../../../../erp/web/js/productCharacteristicsProcess.js#L263).
- `view.activeView.tabId` / `view.getView(tabId)` — multi-tab traversal inside the parent window. Evidence: [periodControlStatus.js:49](../../../../erp/web/js/periodControlStatus.js#L49), [productCharacteristicsProcess.js:25](../../../../erp/web/js/productCharacteristicsProcess.js#L25).
- `view.handleReadOnlyLogic()` / `view.handleButtonsStatus()` — re-evaluate dynamic ReadOnly + button-display rules. Evidence: [ob-aprm-addPayment.js:1671](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1671).
- `view.fireOnPause(id, fn, delay)` — debounce/delay callback. Evidence: [ob-aprm-addPayment.js:1689](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1689).
- `view.selectAllRecords()` / `view.getSelection()` — convenience selection delegators (proxy to embedded grid). Evidence: [etvatr_regularization_utilities.js:31](../../../../erp/WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js#L31).
- `view.onRefreshFunction(view)` — already implemented (§3).
- `view.openProcess(params)` — launch a nested process popup (see §4.5).
- `view.standardWindow` — handle on the parent window for `openProcess` and history navigation.
- `view.sourceView` — the originating view when the process was launched from a tab/window context. Evidence: [ob-aprm-matchStatement.js:90](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L90).

**New-UI requirement.** The view-arg dictionary built in [ProcessDefinitionModal.tsx:945-953](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx#L945-L953) (and the variant in [useProcessExecution.ts:654-668](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts#L654-L668)) must be extended with each property above. Properties that map to UI elements that don't yet exist on the new modal (`messageBar`, `popupButtons`, `cancelButton`) become live handles once those elements exist (§4.7, §4.10, §4.5). Read-only descriptors (`windowId`, `callerField`, `parentWindow`, `sourceView`) are pure data and can be added immediately. Action methods (`refresh`, `getView`, `openProcess`, `fireOnPause`, `handleReadOnlyLogic`, `handleButtonsStatus`, `selectAllRecords`, `getSelection`) must be bound to the React layer through stable function handles so scripts can call them imperatively.

**Backend requirement.** None. The view object is constructed entirely on the client from data
already in the process-definition / tab-context payload.

**Coverage status.** PARTIAL. Today only `onRefreshFunction` is wired; the remaining ~16 view
properties / methods are absent.

**Unlocks (when complete).** Any process that touches the view object beyond the form items
themselves: Match Statement, AddPayment, AddTransaction, FindTransaction, Aging Balance,
ProductCharacteristics, PeriodControl, the Packing pair, ValidateCostingRule. Effectively
**most processes in §6 except the trivial onChange-only ones**.

---

### §4.2 — Form-item API

**What classic does.** Hooks read and mutate every field on the form imperatively: change a value
without firing onChange recursion, toggle required/disabled/hidden, replace the dropdown's
valueMap, add or remove fields dynamically, force a focus or a redraw, fetch a selector's data
on demand. The form is the SmartClient `DynamicForm` accessible at `view.theForm`.

**Classic APIs covered.**

- `form.getItem(name)` — retrieve a form item by parameter name. Evidence: [createFromOrders.js:6](../../../../erp/modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js#L6), [ob-aprm-addPayment.js:131](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L131).
- `form.getField(index)` / `form.getFields()` — index-based access. Evidence: [ob-aprm-addPayment.js:197](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L197), [ob-onchange-functions.js:109](../../../../erp/modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-onchange-functions.js#L109).
- `item.getValue()` / `item.setValue(value)` — read/write the value. Evidence: [received_in-paid_out-onchange.js:6](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/received_in-paid_out-onchange.js#L6), [etvatr_regularization_utilities.js:26](../../../../erp/WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js#L26).
- `item.setValueFromRecord(record)` — bulk-set value + display value from a record object. Evidence: [ob-aprm-addPayment.js:332](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L332).
- `item.setRequired(bool)` / `item.setDisabled(bool)` — toggle validation + interactivity. Evidence: [ob-aprm-addTransaction.js:120](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addTransaction.js#L120).
- `item.show()` / `item.hide()` / `form.hideItem(name)` — toggle visibility. Evidence: [etvatr_regularization_utilities.js:21](../../../../erp/WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js#L21), [ob-aprm-addTransaction.js:30](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addTransaction.js#L30).
- `item.valueMap` (read) / `item.setValueMap(map)` / `item.getValueMap()` — dropdown options. Evidence: [ob-aprm-addPayment.js:269](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L269), [periodControlStatus.js:159](../../../../erp/web/js/periodControlStatus.js#L159).
- `item.clearValue()` — reset to empty. Evidence: [ob-aprm-addPayment.js:334](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L334).
- `item.fetchData(callback)` — force the selector to refetch its dataset. Evidence: [ob-aprm-addPayment.js:330](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L330).
- `form.addField(field)` / `form.removeField(index)` — dynamic parameter injection. Evidence: [ob-aprm-addPayment.js:158](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L158), [ob-aprm-addPayment.js:198](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L198).
- `form.focusInItem(name)` — set keyboard focus. Evidence: [OBWPACK_PackingComponent.js:59](../../../../erp/modules/org.openbravo.warehouse.packing/web/org.openbravo.warehouse.packing/js/OBWPACK_PackingComponent.js#L59).
- `form.redraw()` / `form.markForRedraw()` / `item.redraw()` — explicit re-render. Evidence: [ob-aprm-matchStatement.js:148](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L148), [createFromOrders.js:15](../../../../erp/modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js#L15).
- `item.name` (read), `item.canvas` (access underlying widget), `item.canvas.viewGrid` (embedded grid handle — see §4.3), `item.canvas.markForRedraw()`. Evidence: [etvatr_regularization_utilities.js:8](../../../../erp/WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js#L8).
- `form.getValues()` / `form.values` — bulk read of all parameters. Evidence: [periodControlStatus.js:357](../../../../erp/web/js/periodControlStatus.js#L357).
- `form.paramWindow` / `form.view` — traversal back to the hosting view from a form context. Evidence: [ob-aprm-addPayment.js:1478](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1478).

**New-UI requirement.** The new modal renders parameters through [ProcessParameterSelector.tsx](../../../packages/MainUI/components/ProcessModal/selectors/ProcessParameterSelector.tsx), backed by react-hook-form. The migrated script needs a `view.theForm` handle that exposes the above API surface. The minimum viable form-item API needed by §6's 37 processes is `getItem(name)` returning an object with `getValue` / `setValue` / `setValueFromRecord` / `setRequired` / `setDisabled` / `show` / `hide` / `setValueMap` / `clearValue` / `name`. Dynamic addField / removeField is needed only by AddPayment / AddTransaction (the heaviest two). `fetchData` is needed by AddPayment only.

**Backend requirement.** None.

**Coverage status.** PARTIAL. The current view-arg exposes none of these; mutation today happens
through the `_dynamicParameters` and `_filterExpressions` return contract on the onLoad result
([utils.ts:287-318](../../../packages/MainUI/utils/processes/definition/utils.ts#L287-L318)),
which is a *declarative* path — the *imperative* form-item API is missing.

**Unlocks.** All onLoad scripts that mutate the form, and all onChange scripts (parameter-level
hooks rely heavily on cross-parameter mutation). Most relevant in §6: AddPayment, AddTransaction,
FundsTransfer, FindTransaction, Aging Balance, processRecords family, ProductCharacteristics,
PeriodControl.

---

### §4.3 — Embedded interactive grid

**What classic does.** Several processes embed a SmartClient `ListGrid` *inside* the process modal
as a parameter (Window Reference / OBPickAndExecute), and scripts manipulate it programmatically:
read/write the selection, override cell edit values, swap the datasource, force a fetch, apply
filters, attach per-row components, register selectionChanged callbacks. The grid handle is
reached via `view.theForm.getItem('<paramName>').canvas.viewGrid`.

**Classic APIs covered.**

- Selection: `grid.getSelectedRecords()` — [ob-aprm-matchStatement.js:78](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L78), [periodControlStatus.js:96](../../../../erp/web/js/periodControlStatus.js#L96); `grid.selectSingleRecord(record)` — [ob-aprm-matchStatement.js:190](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L190); `grid.selectRecord(index)` / `grid.deselectRecord(index)` / `grid.deselectAllRecords()` / `grid.userSelectAllRecords()` — [ob-aprm-addPayment.js:713](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L713), [ob-aprm-addPayment.js:715](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L715), [ob-aprm-addPayment.js:1574](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1574), [ob-aprm-addPayment.js:172](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L172).
- Row access: `grid.getRecordIndex(record)` — [ob-aprm-matchStatement.js:173](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L173); `grid.getRecord(index)` — [ob-aprm-addPayment.js:670](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L670); `grid.getEditedRecord(index)` — [ob-aprm-matchStatement.js:173](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L173).
- Edit values: `grid.setEditValue(rowIdx, colName, value)` — [ob-aprm-addPayment.js:708](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L708), [ob-aprm-addPayment.js:1225](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1225); `grid.getEditValues(rowIdx)` — [ob-aprm-addPayment.js:667](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L667); `grid.getEditedCell(rowIdx, field)` — [ob-aprm-addPayment.js:851](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L851).
- Data and lifecycle: `grid.invalidateCache()` — [ob-aprm-matchStatement.js:147](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L147), [createFromOrders.js:14](../../../../erp/modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js#L14); `grid.fetchData(criteria)` — [ob-aprm-addPayment.js:169](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L169); `grid.filterByEditor()` — [ob-aprm-matchStatement.js:99](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L99); `grid.data.{localData, allRows, cachedRows, totalRows}` — [ob-aprm-addPayment.js:579](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L579), [ob-aprm-addPayment.js:1177](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1177), [ob-aprm-addPayment.js:210](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L210); `grid.getTotalRows()` — [ob-aprm-addPayment.js:959](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L959).
- Datasource swap (the "defer initial fetch" trick): `grid.dataSourceOrig = grid.dataSource; grid.dataSource = null` then restore. Evidence: [ob-aprm-matchStatement.js:85-98](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L85-L98).
- Filter editor: `grid.filterEditor.getEditForm()` — [ob-aprm-addPayment.js:357](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L357); `grid.setFilterEditorCriteria(criteria)` — [ob-aprm-addPayment.js:366](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L366); `grid.getCriteria()` — [createFromOrders.js:8](../../../../erp/modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js#L8); `grid.addSelectedIDsToCriteria(criteria, preserveSelected)` — [createFromOrders.js:7](../../../../erp/modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js#L7).
- Lifecycle callbacks: `grid.selectionChanged` — [ob-aprm-matchStatement.js:159](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L159); `grid.removeRecordClick` — [ob-aprm-addPayment.js:177](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L177); `grid.dataArrived` — [ob-aprm-addPayment.js:181](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L181); `grid.dataProperties.transformData` — [ob-aprm-addPayment.js:175](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L175).
- Column metadata: `grid.getFieldByColumnName(colName)` — [ob-aprm-addPayment.js:843](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L843).
- Cross-references: `grid.contentView.messageBar` (in-modal banner from a grid context), `grid.view` (back-pointer), `grid.parentElement.messageBar`. Evidence: [ob-aprm-matchStatement.js:108](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L108).

**New-UI requirement.** The new modal currently renders embedded grids via [WindowReferenceGrid.tsx](../../../packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx), but only as a static data list with no imperative API. The capability needed is a *programmable grid handle* exposed on `view.theForm.getItem('<paramName>').canvas.viewGrid` (the same path classic uses) with the full surface above. Internally the new UI may back this with a React component + an `useImperativeHandle` ref forwarded to the script — implementation detail not in scope here. **Minimum** surface for the four processes that actually need a programmable grid (Match Statement, AddPayment, AddTransaction, Find Transactions) is: selection helpers, getEditedRecord, setEditValue, invalidateCache, getCriteria, addSelectedIDsToCriteria, dataArrived callback. Lifecycle callbacks must support multiple subscribers (classic chains them; the new UI must too).

**Backend requirement.** None. The grid datasource configuration is already covered by today's
process-definition payload.

**Coverage status.** MISSING. WindowReferenceGrid renders rows but exposes no programmable surface.

**Unlocks.** Match Statement, AddPayment, AddTransaction, Find Transactions, Add Credit Payments,
Add Invoices, Select Invoices and Orders, Select Payments Pick and Edit, Service Order Line
Relation, RFC/RTV HQL Pick and Edit, Manage Variants, ProductCharacteristics, the Packing pair.

---

### §4.4 — Per-row grid component plugin

**What classic does.** A process can register a custom row component class via
`isc.ClassFactory.defineClass('<ClassName>', isc.HLayout); isc.<ClassName>.addProperties({canExpandRecord: true, click, initWidget, ...})`. Each row of the embedded grid then renders an instance that receives `this.grid` / `this.record` / `this.view` and typically draws inline icon-buttons (Search, Add, Clear) that fire actions or launch nested processes. Canonical case: the Match Statement `APRMMatchStatGridButtonsComponent` ([ob-aprm-matchStatement.js:184-377](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L184-L377)).

**Classic APIs covered.**

- Class definition: `isc.ClassFactory.defineClass(name, parentClass)` — [ob-aprm-matchStatement.js:184](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L184).
- Property attachment: `isc.<ClassName>.addProperties({canExpandRecord, initWidget, click, ...})` — [ob-aprm-matchStatement.js:186](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L186).
- Row-component context: `this.grid` / `this.record` / `this.view` injected at row render time — [ob-aprm-matchStatement.js:190-195](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L190-L195).
- Icon button widgets (delivered through §4.8): `isc.OBGridToolStripIcon.create({buttonType, prompt, action})`, `isc.OBGridToolStripSeparator.create({})`. Evidence: [ob-aprm-matchStatement.js:203](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L203).

**New-UI requirement.** A row-level plugin slot on the embedded grid component. Scripts must be
able to register a per-process row renderer keyed by `(processId, parameterId | referenceFieldId)`
whose callback receives `{record, view, parentGrid}` and returns either a React element or a
declarative descriptor `{ buttons: [{ icon, prompt, action: (ctx) => void }, ...] }`. The new UI
must expose a small declarative API (since arbitrary React elements from a `new Function`-compiled
script is not reasonable; declarative button descriptors are). Built-in icon presets must cover
classic's `search`, `add`, `clearRight` button types and a separator type.

**Backend requirement.** None.

**Coverage status.** MISSING.

**Unlocks.** Match Statement (canonical case), and any future process that wants per-row actions
on its embedded grid.

---

### §4.5 — Nested-process modal stack

**What classic does.** From within an open process (or from a grid-row component), a script can
launch a *nested* process modal layered on top of the current one:

```js
standardWindow.openProcess({
  callerField: me,
  paramWindow: true,
  processId: 'E68790A7B65F4D45AB35E2BAE34C1F39',  // Add Transaction
  windowId: grid.view.windowId,
  externalParams: { bankStatementLineId: record.id },
  windowTitle: OB.I18N.getLabel('APRM_MATCHTRANSACTION_ADD_BUTTON')
});
```
Evidence: [ob-aprm-matchStatement.js:227-241](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L227-L241).

When the nested popup is closed (user clicks ✕ or the process completes), classic auto-fires the
parent view's `onRefreshFunction`:

```js
// erp/modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/process/ob-parameter-window-view.js:436-439
if (typeof this.callerField.view.onRefreshFunction === 'function') {
  this.callerField.view.onRefreshFunction(this.callerField.view);
}
```

The trigger is `closeClick()`; the dispatch target is `this.callerField.view` (the parent view
that launched the nested popup).

**Classic APIs covered.**

- `standardWindow.openProcess(params)` — accepts `{callerField, paramWindow, processId, windowId, externalParams, windowTitle}`. Evidence: [ob-aprm-matchStatement.js:227](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L227).
- Auto-trigger of `parentView.onRefreshFunction(parentView)` on nested-popup close. Evidence: [ob-parameter-window-view.js:436-439](../../../../erp/modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/process/ob-parameter-window-view.js#L436-L439).
- `view.callerField` set on the nested popup, pointing back to the row component / button that launched it.

**New-UI requirement.**

1. A modal stack: opening a process while one is already open pushes a new modal layered on top
   of (not replacing) the current one.
2. `view.openProcess(params)` exposed on the script-facing view-arg with the same shape as classic
   (`{processId, windowId, externalParams, windowTitle, callerField?, paramWindow?}`).
3. On nested-popup close (X or success), the new UI invokes `parentView.onRefreshFunction(parentView)`
   if defined. The TODO at [useProcessExecution.ts:663-665](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts#L663-L665) is the placeholder marker for this hookup.
4. `callerField` populated on the nested view with the originating row component / button handle,
   so scripts can reach it through `view.callerField.view`.

**Backend requirement.** None. The same `/meta/process/{id}` endpoint serves the nested process.

**Coverage status.** MISSING.

**Unlocks.** Match Statement (launches Find Transaction and Add Transaction nested), and any
process that chains into another (currently rare but the pattern is documented).

---

### §4.6 — Modal dialogs (`isc.confirm` / `isc.warn` / `isc.say`)

**What classic does.** Scripts gate flow on a synchronous-looking modal dialog with OK/Cancel
buttons. `isc.confirm(message, callback)` is the most common form: the callback receives `true`
if the user clicked OK, `false` (or `null` on close) otherwise. Variants `isc.warn` and `isc.say`
display warning / info levels.

**Classic APIs covered.**

- `isc.confirm(message, callback)`. Evidence: [validateCostingRuleProcess.js:39](../../../../erp/web/js/validateCostingRuleProcess.js#L39), [ob-aprm-matchStatement.js:139](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L139), [ob-aprm-addPayment.js:298](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L298).
- `isc.warn(message, callback)`, `isc.say(message, callback)` — known classic APIs (less frequent
  in the sample but documented for completeness).

**New-UI requirement.** Promise-returning helpers exposed both directly on the script context
(`confirm` / `warn` / `say` keys, alongside `callAction`) and via an `isc` shim namespace for
literal-port compatibility. Both forms must resolve to `boolean` (OK/Cancel) and never block the
JS event loop. Migrated scripts will await them rather than passing a callback; a thin adapter
must support the classic `(message, callback)` callback shape too, since several files use it
without `await`.

**Backend requirement.** None.

**Coverage status.** MISSING.

**Unlocks.** Validate Costing Rule, Match Statement, AddPayment (uses confirm before submitting
in some branches), and any onLoad that confirms before running an expensive backend call.

---

### §4.7 — In-modal message bar

**What classic does.** `view.messageBar.setMessage(severity, title, text)` renders a sticky
banner *inside* the process modal (distinct from the global toast). `view.messageBar.hide()` clears
it. Severity is one of `isc.OBMessageBar.TYPE_INFO` / `TYPE_SUCCESS` / `TYPE_WARNING` / `TYPE_ERROR`.

**Classic APIs covered.**

- `view.messageBar.setMessage(severity, title, text)`. Evidence: [ob-aprm-matchStatement.js:56](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L56), [ob-aprm-addPayment.js:254](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L254), [validateCostingRuleProcess.js:24](../../../../erp/web/js/validateCostingRuleProcess.js#L24).
- `view.messageBar.hide()`. Evidence: [ob-onchange-functions.js:73](../../../../erp/modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-onchange-functions.js#L73).
- Severity constants via §4.8 (`OB.MessageBar.TYPE_*` or `isc.OBMessageBar.TYPE_*`).

**New-UI requirement.** A `<MessageBar>` UI element rendered inside the modal layout
([ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx)),
its state managed by the modal so scripts can mutate it through a `view.messageBar` handle
exposing `setMessage(severity, title, text)` / `hide()`. The banner must support raw HTML content
since classic scripts inject `<a>`-based "never show again" affordances (Match Statement). HTML
sanitization must run server-side or via a strict allowlist on the client.

**Backend requirement.** None.

**Coverage status.** MISSING. Today, `react-toastify` is used for global toasts (success/error on
process completion) via `extractResponseMessage`; an in-modal banner does not exist.

**Unlocks.** Match Statement, AddPayment, AddTransaction, Validate Costing Rule, Aging Balance
(via `OB.OnChange.agingProcessDefinition*`), VAT Regularization, ETFRA family.

---

### §4.8 — `OB.*` namespace shim

**What classic does.** The global `OB.*` object is the canonical entry point for translations,
remote calls, format helpers, action registration, style constants, datasource creation, and
property access. Today the new UI only exposes `OB.PropertyStore.get` ([propertyStore.ts:79-94](../../../packages/MainUI/utils/propertyStore.ts#L79-L94)).

**Classic APIs covered.**

- **i18n**: `OB.I18N.getLabel(labelId, paramsArray?)`. Evidence: [validateCostingRuleProcess.js:24](../../../../erp/web/js/validateCostingRuleProcess.js#L24), [ob-aprm-matchStatement.js:70](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L70).
- **Remote calls (callback-style)**: `OB.RemoteCallManager.call(handler, params, otherParams, callback)`. Evidence: [validateCostingRuleProcess.js:45](../../../../erp/web/js/validateCostingRuleProcess.js#L45), [ob-aprm-matchStatement.js:75](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L75). See §4.9 for adapter strategy.
- **Property store**: `OB.PropertyStore.get(key, windowId)` *(already covered)* and `OB.PropertyStore.set(key, value)` *(missing)*. Evidence: [ob-aprm-addPayment.js:581](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L581), [ob-aprm-addPayment.js:611](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L611).
- **Number formatting**: `OB.Format.defaultNumericMask`, `OB.Format.defaultDecimalSymbol`, `OB.Format.defaultGroupingSymbol`, `OB.Format.defaultGroupingSize`. Evidence: [ob-aprm-findTransaction.js:73-76](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-findTransaction.js#L73-L76).
- **Number conversion**: `OB.Utilities.Number.JSToOBMasked(mask, value, decimal, grouping, groupingSize)`. Evidence: [ob-aprm-findTransaction.js:71](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-findTransaction.js#L71), [ob-aprm-addTransaction.js:86](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addTransaction.js#L86).
- **Action system**: `OB.Utilities.Action.set(name, fn)` — register named action; `OB.Utilities.Action.execute(name, params)` — invoke by name; `OB.Utilities.Action.executeJSON(actions, target, source, view)` — dispatch an action JSON array. Evidence: [etvatr_regularization_utilities.js:20](../../../../erp/WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js#L20), [payment-action-popup.js:88](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/payment-action-popup.js#L88), [payment-action-popup.js:95](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/payment-action-popup.js#L95). See §4.10.
- **Style constants**: `OB.Styles.MessageBar.leftMsgContainerStyle`, `.rightMsgContainerStyle`, `.rightMsgTextStyle`, and module-specific `OB.Styles.OBWPACK.*`. Evidence: [ob-aprm-matchStatement.js:115](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L115), [OBWPACK_PackingComponent.js:87](../../../../erp/modules/org.openbravo.warehouse.packing/web/org.openbravo.warehouse.packing/js/OBWPACK_PackingComponent.js#L87).
- **Datasource creation**: `OB.Datasource.create({...})`. Evidence: [productCharacteristicsProcess.js:92](../../../../erp/web/js/productCharacteristicsProcess.js#L92). See §4.11.
- **Utilities**: `OB.Utilities.generateRandomString(length)`. Evidence: [OBWPACK_PackingComponent.js:69](../../../../erp/modules/org.openbravo.warehouse.packing/web/org.openbravo.warehouse.packing/js/OBWPACK_PackingComponent.js#L69).
- **Test registry**: `OB.TestRegistry.register(name, obj)`. Evidence: [periodControlStatus.js:168](../../../../erp/web/js/periodControlStatus.js#L168).
- **Process-namespace assignment**: `OB.<Module>.<Process> = {}` (e.g. `OB.APRM.MatchStatement = {}`). Evidence: [ob-aprm-matchStatement.js:20](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L20). The shim must accept these writes so legacy code that namespaces its helpers under `OB.<Module>.<Process>.<helper>` still works.

**New-UI requirement.** Extend `createOBShim()` (and the script context built in
[utils.ts:120-190](../../../packages/MainUI/utils/processes/definition/utils.ts#L120-L190)) with
every API above. Backings:

- `OB.I18N.getLabel(key, args)` → wraps `useTranslation`'s `t(key, args)`; needs a non-hook form
  that closes over the current language at modal-open time.
- `OB.RemoteCallManager.call` → callback-style adapter over `callAction` (see §4.9).
- `OB.Format.*` → derived from the current user's locale (already accessible via session state).
- `OB.Utilities.Number.JSToOBMasked` → port of the SmartClient utility (it's pure JS — copy
  the function body from the classic file).
- `OB.Utilities.Action.{set,execute,executeJSON}` → see §4.10.
- `OB.Styles.*` → static map of CSS class names → new-UI equivalents; preserve the classic names
  so HTML injected by scripts continues to look right. **Sanitize injected HTML before render.**
- `OB.Datasource.create` → see §4.11.
- `OB.Utilities.generateRandomString` → trivial UUID-ish helper.
- `OB.TestRegistry.register` → no-op stub (test infrastructure is not migrated).
- `OB.<Module>.<Process>` namespace writes must be allowed; the shim provides a tolerant object
  (auto-vivify nested objects).

**Backend requirement.** None.

**Coverage status.** HEAVILY MISSING. Today only `OB.PropertyStore.get`.

**Unlocks.** Essentially every process in §6 except the trivial onChange-only ones. The shim is
the foundation: any other capability that returns JS-side data (§4.7 message bar uses `OB.Styles`,
§4.10 actions uses `OB.Utilities.Action`, §4.11 datasource uses `OB.Datasource`) depends on it.

---

### §4.9 — Callback-to-Promise adapter for `OB.RemoteCallManager.call`

**What classic does.** Scripts invoke a server action handler with a callback that receives
`(response, data, request)`:

```js
OB.RemoteCallManager.call(
  'org.openbravo.costing.CostingRuleProcessOnProcessHandler',
  { ruleId: view.parentWindow.view.lastRecordSelected.id },
  {},
  function(response, data, request) { /* ... */ }
);
```
Evidence: [validateCostingRuleProcess.js:45](../../../../erp/web/js/validateCostingRuleProcess.js#L45), [ob-aprm-matchStatement.js:75](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L75), [payment-action-popup.js:88](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/payment-action-popup.js#L88).

The new substrate ([utils.ts:144-157](../../../packages/MainUI/utils/processes/definition/utils.ts#L144-L157)) is `callAction(handler, payload): Promise<{data}>`.

**Classic APIs covered.**

- `OB.RemoteCallManager.call(handler, params, otherParams, callback, context?)` — callback shape.
- Nested-callback patterns (callback inside a callback) — common in AddPayment.

**New-UI requirement.** Provide a compatibility shim `OB.RemoteCallManager.call(handler, params, otherParams, callback)` that internally awaits `callAction(handler, params)` and invokes the callback with `(response, data, request)` shaped to match the classic contract (the new UI does not produce a meaningful `response` / `request` — pass minimal sentinel objects and the parsed JSON as `data`). The shim must propagate errors to the callback's `response.status` (negative on failure, classic uses `< 0`) so existing error branches work without modification.

This adapter is **strongly preferred over rewriting every callback site to `await`** because (a) it
enables line-for-line ports of the classic JS, lowering migration risk; (b) the `new Function`-
compiled bodies cannot use top-level `await` cleanly — the wrapping factory in
[functions.ts:55-81](../../../packages/MainUI/utils/functions.ts#L55-L81) returns an `async` function
when the user writes `async`, but classic code is callback-style and an adapter is the natural
bridge.

**Backend requirement.** None.

**Coverage status.** MISSING.

**Unlocks.** Every process that calls a server action handler from JS: at minimum Validate
Costing Rule, Match Statement, FindTransaction, AddPayment, AddTransaction, FundsTransfer, Set
New Currency, the Packing pair, Etendo Payment Execution, Match Statement preference action.

---

### §4.10 — Action JSON dispatcher (`OB.Utilities.Action.executeJSON` + related)

**What classic does.** Server action handlers (and migrated scripts) return a `responseActions`
JSON array. `OB.Utilities.Action.executeJSON(actions, target, source, view)` iterates the array
and dispatches each entry by its key (the action type), executing the corresponding registered
handler against the current view. The new UI handles only one action type today:
`showMsgInProcessView` ([useProcessExecution.ts:679-696](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts#L679-L696)).

**Classic APIs covered.**

- `OB.Utilities.Action.set(name, fn)` — register a custom action keyed by `name`. Evidence: [etvatr_regularization_utilities.js:20](../../../../erp/WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js#L20), [payment-action-popup.js:154](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/payment-action-popup.js#L154).
- `OB.Utilities.Action.execute(name, params)` — fire a registered action. Evidence: [payment-action-popup.js:88](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/payment-action-popup.js#L88).
- `OB.Utilities.Action.executeJSON(actions, target, source, view)` — dispatch an action array. Evidence: [ob-aprm-matchStatement.js:96](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L96), [payment-action-popup.js:95](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/payment-action-popup.js#L95).
- Built-in action types observed in the sample:
  - `showMsgInProcessView` — DONE.
  - `showMsgInView` — display a message in the *parent* view (not the modal). MISSING.
  - `refreshGrid` — invalidate the parent tab's grid (different from `view.onRefreshFunction`). MISSING.
  - `OBUIAPP_browseReport` — open a report viewer. MISSING.
  - `OBUIAPP_downloadReport` — trigger a file download. MISSING.
  - `setSelectorValueFromRecord` — set a selector's value from a record. MISSING.
  - `openDirectTab` — open a tab pointing at a specific record. MISSING.
  - `smartclientSay` — show an info dialog. MISSING (overlap with §4.6).
  - `custom` — invoke a function registered by name via `OB.Utilities.Action.set`. MISSING.

**New-UI requirement.** A `dispatchResponseAction(action, ctx)` function (or `OB.Utilities.Action.executeJSON` direct shim) that handles each action type with the same semantics as classic. The function must be *callable from migrated scripts directly* (e.g. inside a `callAction` callback in the §4.9 adapter), not just exercised through the `onProcess` return path. The dispatcher must look up custom action names registered via `OB.Utilities.Action.set` from the script-side registry.

`refreshGrid` deserves special note: the parent grid is *outside* the process modal (on the
window that hosts the process button); refreshing it requires the new UI to expose a side-channel
from the modal back to the launching tab. The existing `revalidateDopoProcess` server action
([revalidate.ts](../../../packages/MainUI/app/actions/revalidate.ts)) covers part of this for
success cases; the `refreshGrid` action type requires extending it to be callable from
mid-execution (not only on modal close).

**Backend requirement.** None. Action JSON is server-emitted by existing action handlers; no
adapter changes there.

**Coverage status.** PARTIAL (1 of 9 action types covered).

**Unlocks.** Match Statement (Match Statement OnLoad handler returns `responseActions`),
AddPayment (returns `refreshGrid` + `openDirectTab` after submission), AddTransaction,
Etendo Payment Execution, ProductCharacteristics, every process that downloads a report.

---

### §4.11 — Datasource access from scripts

**What classic does.** Scripts can build an ad-hoc datasource (`OB.Datasource.create({...})`) to
fetch supplementary data, or reach into the grid's existing `dataSource` and call `fetchData`
directly. The "dummy criterion" trick (`isc.OBRestDataSource.getDummyCriterion()`) forces a refetch
even when no criteria changed.

**Classic APIs covered.**

- `OB.Datasource.create({...})` — create a REST datasource. Evidence: [productCharacteristicsProcess.js:92](../../../../erp/web/js/productCharacteristicsProcess.js#L92).
- `dataSource.fetchData(criteria, callback)` — imperative fetch. Evidence: [ob-aprm-addPayment.js:169](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L169).
- `isc.OBRestDataSource.getDummyCriterion()` — produce a no-op criterion that still triggers a
  cache invalidation. Evidence: [ob-aprm-matchStatement.js:146](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js#L146), [createFromOrders.js:13](../../../../erp/modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js#L13).
- Grid-level `grid.dataSource` / `grid.dataSourceOrig` (the deferred-fetch trick) — covered by §4.3.

**New-UI requirement.** Expose `OB.Datasource.create(config)` returning an object with the same
surface (`{fetchData(criteria, callback), setCacheData(records)}`) backed by `callDatasource`
([utils.ts:159-172](../../../packages/MainUI/utils/processes/definition/utils.ts#L159-L172)). The
dummy criterion can be implemented as a literal `{operator: 'and', criteria: []}` object — its
purpose in classic is to bypass the cache, which the new UI handles by always re-fetching when
`fetchData` is called.

**Backend requirement.** None.

**Coverage status.** PARTIAL — the underlying HTTP layer (`callDatasource`) exists; the
`OB.Datasource` façade does not.

**Unlocks.** ProductCharacteristics (defines its own datasource), AddPayment (refetches
business-partner data), PeriodControl, Match Statement (datasource swap), createFromOrders.

---

### §4.12 — Parameter-level hook execution

**What classic does.** Each parameter of a Defined Process can carry two callbacks:

- `onchangefunction` — fires from the form item's `onChange` when the user (or another script)
  changes the parameter value. Canonical signature: `(item, view, form, grid, editRow?)`.
- `ongridloadfunction` — fires when an embedded grid loads/reloads its rows. Canonical signature:
  `(grid, view, parameters)`.

Evidence: [received_in-paid_out-onchange.js:4](../../../../erp/modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/received_in-paid_out-onchange.js#L4) (4-arg onChange), [ob-aprm-addPayment.js:1214](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1214) (grid-row onChange variant with `item.rowNum` / `item.columnName`), [productCharacteristicsProcess.js:57](../../../../erp/web/js/productCharacteristicsProcess.js#L57) (onGridLoad).

These columns map to `em_etmeta_on_parameter_change` and `em_etmeta_on_grid_load`, both already
added to `obuiapp_parameter` by `com.etendoerp.metadata`.

**Backend status (confirmed via inspection):** the parameter entity exposes both fields as clean
camelCase properties (`Parameter.etmetaOnParameterChange`, `Parameter.etmetaOnGridLoad` —
[Parameter.java:348-364](../../../../erp/src-gen/org/openbravo/client/application/Parameter.java#L348-L364)), and `ParameterBuilder.toJSON()` runs `converter.toJsonObject(parameter, FULL_TRANSLATABLE)` ([ParameterBuilder.java](../../../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/ParameterBuilder.java)) which auto-emits all entity properties. **The JSON contract is therefore already correct** — `/meta/process/{id}` already includes `etmetaOnParameterChange` and `etmetaOnGridLoad` on each parameter. No backend change needed.

**Classic APIs covered.**

- onChange signature: `function(item, view, form, grid, editRow?)`. Evidence (4-arg form): [ob-aprm-addPayment.js:355](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L355). Evidence (grid-cell variant): [ob-aprm-addPayment.js:1214](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js#L1214).
- onGridLoad signature: `function(grid, view, parameters)` or shorter `function(grid)`. Evidence: [productCharacteristicsProcess.js:57](../../../../erp/web/js/productCharacteristicsProcess.js#L57).
- Both must receive a `view` arg with the §4.1 contract and (for onGridLoad) a `grid` arg with the §4.3 contract.

**New-UI requirement.** [ProcessParameterSelector.tsx](../../../packages/MainUI/components/ProcessModal/selectors/ProcessParameterSelector.tsx) (or the form-item rendering layer it delegates to) must:

1. Read `etmetaOnParameterChange` / `etmetaOnGridLoad` from each parameter's JSON payload.
2. Compile each non-null body once via `compileStringFunction` (sharing the same script context as the process-level hooks: `Metadata`, `OB`, `callAction`, ...).
3. Bind the compiled `onParameterChange` to the form item's `onChange` event, invoking it with `(item, view, form, grid, editRow)`. The `item` proxy must conform to §4.2; the `form`, `grid`, `view` proxies to §4.1, §4.2, §4.3.
4. Bind the compiled `onGridLoad` to the embedded grid's data-arrived event when the parameter is a grid-typed reference (Window Reference / OBPickAndExecute), invoking it with `(grid, view, parameters)`.
5. Reuse the same shared scope (§4.13) as the process-level hooks so helpers defined in `em_etmeta_payscript_logic` are visible inside parameter hooks too.

**Backend requirement.** Already done (confirmed above). To document the contract for future
schema changes, the `etmeta*` keys on each parameter must be **always present**, with `null` when
the column is empty. Audit: extend the existing tests for `ProcessDefinitionBuilder` to add the
absence/null assertions for `etmetaOnParameterChange` / `etmetaOnGridLoad` on a parameter that
carries them and on one that doesn't.

**Coverage status.** MISSING (frontend only — backend already serves the data).

**Unlocks.** All 23 column-signal-1 processes that use parameter-level mechanisms (every process
with `onchangefunction ×N` or `ongridloadfunction ×N` in the inventory §6 table).

---

### §4.13 — Shared module scope for `em_etmeta_payscript_logic`

**What classic does.** Every classic process file is a *single module* mixing the metadata-
referenced entry points (`onLoad`, `onProcess`, `onRefresh`, per-parameter `onChange` /
`onGridLoad`) with internal helpers, constants, and closure state that the entry points call into
by bare name. Canonical case: `ob-aprm-addPayment.js` declares ~53 top-level properties under
`OB.APRM.AddPayment.*`, of which only ~18 are metadata-referenced entry points; the remaining
~35 are shared helpers (`updateTotal`, `distributeAmount`, `getConvertedAmount`,
`tryToUpdateActualExpected`, `applyBankAmountToConverted`, ...) reachable from any hook by writing
`OB.APRM.AddPayment.updateTotal(view, ...)`. Evidence: [ob-aprm-addPayment.js](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js).

`em_etmeta_payscript_logic` is the new-UI home for that shared module body (per the inventory's
§4.3). Today the field is **only** used to register the PayScript DSL ([ProcessDefinitionModal.tsx:310-315](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx#L310-L315)), not as a shared JS scope.

**Classic APIs covered.**

- Bare-name helper resolution from hooks: `updateTotal(view, ...)` inside `paymentMethodOnChange`
  (defined in the same file). Evidence: many sites in [ob-aprm-addPayment.js](../../../../erp/modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js).
- Module-level state persisting across hook invocations within the same dialog session (caches,
  "already-warned" flags, debouncers).
- Module-level constants and lookup tables loaded once.
- Namespace registration (`OB.APRM.MatchStatement = {}; OB.APRM.MatchStatement.onLoad = function(view) {...}`)
  — the §4.8 OB shim must tolerate these writes during the evaluation of `etmetaPayscriptLogic`.

**New-UI requirement.** The runtime contract for a process with a non-null `etmetaPayscriptLogic`:

1. When the modal opens, evaluate `etmetaPayscriptLogic` *once* via `new Function(...contextKeys, body)(...)` (the same shape as `compileStringFunction` but at the module level rather than wrapping a single expression). The body declares helpers, constants, and module state.
2. The evaluation returns a *scope object* whose properties are the declared helpers (either via explicit `return { ... }` at the end of the body, or by walking the lexical scope — the simpler convention is "the body must end with `return { helperA, helperB, constantC, ... };`" and the new UI documents this requirement).
3. Each of the five hook bodies (`etmetaOnload`, `etmetaOnprocess`, `etmetaOnRefresh`, and per-parameter `etmetaOnParameterChange` / `etmetaOnGridLoad`) is compiled within a context that includes the scope object spread into its named parameters, so `updateTotal(view, ...)` resolves to the helper without any `OB.<NS>.` prefix.
4. The scope object is also exposed under `OB.<Module>.<Process>` (auto-vivified per §4.8) so legacy literal `OB.APRM.AddPayment.updateTotal(...)` calls work without modification.
5. PayScript DSL registration (today's behaviour at [ProcessDefinitionModal.tsx:310-315](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx#L310-L315)) continues to work for processes that use the field for DSL rules instead of helpers. The runtime must distinguish the two uses: if the body is a JS function-expression sequence ending with a `return`, treat it as a module body; if it's PayScript-DSL JSON, treat it as DSL.

**Backend requirement.** None. The field is already exposed by the converter.

**Coverage status.** MISSING (as a shared JS scope). PayScript DSL use already works.

**Unlocks.** All processes whose JS file has more than ~5 declarations under its namespace, i.e.
all 4 hard processes (AddPayment, Manage Packing, the two Validate Barcode Action variants) and
most of the medium processes that share helpers across hooks (Match Statement, Aging Balance,
ProductCharacteristics, the entire ETFRA family, ob-onchange-functions).

---

## §5. Backend requirements (`erp/modules/com.etendoerp.metadata`)

Most of the backend work is already done; this section is short and surgical.

### §5.1 — Parameter-level field exposure
**Status: ALREADY DONE.** `etmetaOnParameterChange` and `etmetaOnGridLoad` are clean camelCase
properties on the `Parameter` entity ([Parameter.java:348-364](../../../../erp/src-gen/org/openbravo/client/application/Parameter.java#L348-L364)), and `ParameterBuilder.toJSON()` ([ParameterBuilder.java](../../../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/ParameterBuilder.java)) runs the converter in `FULL_TRANSLATABLE` mode which auto-emits every entity property. The `/meta/process/{id}` JSON already includes both keys on every parameter, with `null` when the column is empty (matching the contract documented in §5.2). **No code change needed.** Recommended: add a test in `ProcessDefinitionBuilderTest` asserting both keys appear on a parameter with non-null values and that they are `null` (and present) when empty, to lock the contract.

### §5.2 — Stable null vs absent contract
**Status: DONE for process-level keys.** Every `etmeta*` key on `/meta/process/{id}` must be
always present (never absent), with value `null` when the column is empty. The four process-level
keys (`etmetaOnload`, `etmetaOnprocess`, `etmetaOnRefresh`, `etmetaPayscriptLogic`) satisfy this
after the previous iteration. The two parameter-level keys inherit the converter's behaviour
(always-present); the recommended test in §5.1 makes this guarantee explicit.

### §5.3 — Action-handler call shape
**Status: NO CHANGE NEEDED.** Today's `callAction` HTTP shape ([utils.ts:144-157](../../../packages/MainUI/utils/processes/definition/utils.ts#L144-L157)) — `POST /api/erp/org.openbravo.client.kernel?_action=<handler>` — matches what classic's `OB.RemoteCallManager.call` POSTs to under the hood. Any §4.9 adapter built on top of `callAction` therefore reaches every existing action handler without any change in the metadata module or the ERP. Documented here for the record.

### §5.4 — `processId` signal (signal 3) — six processes
**Status: NO CHANGE NEEDED.** Six of the 37 in-scope processes are detected only by hardcoded
`processId` in their classic JS (no metadata column binding) — Clone, Manage PickingList Action,
Open Close Periods, the two Validate Barcode Action variants, Manage Packing Action. The
migration of those six processes is performed by *moving the JS into the new metadata columns*
(`em_etmeta_onload` / `em_etmeta_onprocess` / etc.) keyed on the same `processId`. The metadata
module already serves `/meta/process/{id}` against any process id; no signal-3-specific code is
needed.

---

## §6. Per-process feasibility matrix

Mapping of every in-scope process to the §4 capabilities it depends on. **Feasible today?** is
**YES** only if the process needs nothing beyond what is DONE in §3; **WITH-X** if it needs one
additional §4 capability; **NO** otherwise.

Mechanism-to-capability shorthand (combined with the per-file readings):

- `onchangefunction` ⇒ §4.12 + §4.2 (often §4.8 for Format/Number).
- `ongridloadfunction` ⇒ §4.12 + §4.3.
- `on_load_function` ⇒ §4.1 + frequently one or more of §4.6 / §4.7 / §4.8 / §4.10 / §4.11 depending on body.
- `clientsidevalidation` ⇒ §4.1 + frequently §4.6 / §4.7 / §4.9 / §4.10.
- `on_refresh_function` ⇒ DONE.
- signal-3 (hardcoded processId) ⇒ depends on body; flagged below.

Rows ordered as in inventory §6 (easiest first).

| id | name | mechanisms | capabilities required | feasible today? | unlocked by |
|---|---|---|---|---|---|
| C044DDAA929E40D780C36154FBB968F7 | Create Invoices from Orders | onChg ×1 | §4.12, §4.2, §4.3 (grid criteria) | NO | §4.12 + §4.2 + §4.3 |
| 31ED9333E46C419D92E9F1B10F821B91 | Clone (signal 3) | processId | §4.9, §4.8 (RPC + I18N) | NO | §4.8 + §4.9 |
| 71E00A0E964E43AE81C5AFBCDCA5F87C | Valued Stock Report | onChg ×1 | §4.12, §4.2 | WITH §4.12+§4.2 | §4.12 + §4.2 |
| B57A0126F38B428F936FA2B52186EB97 | Consulta de Facturas en Verifactu | onChg ×2 | §4.12, §4.2 | WITH §4.12+§4.2 | §4.12 + §4.2 |
| 45ED6D0400FD42BEA9771C549A9AE8AB | Validate Costing Rule | onLoad, onProc | §4.1, §4.6 (confirm), §4.7 (msgBar), §4.8 (I18N), §4.9 (RPC) | NO | §4.1 + §4.6 + §4.7 + §4.8 + §4.9 |
| CC73C4845CDC487395804946EACB225F | Funds Transfer | onLoad, onChg ×1 | §4.1, §4.2, §4.12, §4.8 | NO | §4.1 + §4.2 + §4.8 + §4.12 |
| C88AB6CBA1694000AFF5706A31B08AE1 | Select Payments Pick and Edit | onGridLoad ×1 | §4.12, §4.3 | NO | §4.12 + §4.3 |
| 20D69FFD251A481BA75F33538EDFCF76 | VAT Regularization | onLoad, onGridLoad ×1 | §4.1, §4.2, §4.3, §4.10 (Action.set), §4.12 | NO | §4.1 + §4.2 + §4.3 + §4.10 + §4.12 |
| B5C942145F354ABEBC9F16235D80D776 | Set New Currency | onLoad, onProc | §4.1, §4.6, §4.8, §4.9 | NO | §4.1 + §4.6 + §4.8 + §4.9 |
| 154CB4F9274A479CB38A285E16984539 | Find Transactions to Match | onProc | §4.1, §4.8 (Format/Number), §4.9, §4.10 | NO | §4.1 + §4.8 + §4.9 + §4.10 |
| EB4C4053F3B94A17A08D1DD7E89CEB7E | Aging Balance Process Definition for Payables | onChg ×5 | §4.12, §4.2, §4.7, §4.8 | NO | §4.7 + §4.8 + §4.2 + §4.12 |
| 0D37A9F6109549DEB058373EF2DAEB6A | Aging Balance for Receivables | onChg ×5 | §4.12, §4.2, §4.7, §4.8 | NO | (same as above) |
| AB2EFCAABB7B4EC0A9B30CFB82963FB6 | Create Lines From Order | onLoad | §4.1, §4.3 (grid), §4.8 | NO | §4.1 + §4.3 + §4.8 |
| D37588FFC6264BED91FA7611DBFFC679 | Balance Sheet and P&L Structure advanced | onChg ×1 | §4.12, §4.2, §4.8 | NO | §4.2 + §4.8 + §4.12 |
| 56E951BB13A44AFBB642291081613E46 | General Ledger Report Advanced | onChg ×1 | (same as ETFRA family) | NO | §4.2 + §4.8 + §4.12 |
| 636EF6F0F8B64E94A8247930569B98CA | Journal Entries Report Advanced | onChg ×2 | (same as ETFRA family) | NO | §4.2 + §4.8 + §4.12 |
| D8E8015B1478473799E47F84796C481C | Trial Balance | onChg ×1 | (same as ETFRA family) | NO | §4.2 + §4.8 + §4.12 |
| 99E532BA0306450A839F5DE238375238 | Select Invoices and Orders | onGridLoad ×1 | §4.12, §4.3 | NO | §4.12 + §4.3 |
| B7B1D4F53D4249C5A10D3AD0865D909F | Manage PickingList Action (signal 3) | processId | §4.1, §4.8, §4.9, §4.10 | NO | §4.1 + §4.8 + §4.9 + §4.10 |
| 60F1E2DEB1B544908CDD4CF99ACA80EB | Etendo Payment Execution | onChg ×2, action (signal 2) | §4.12, §4.2, §4.8, §4.10 (Action.set/execute/executeJSON) | NO | §4.2 + §4.8 + §4.10 + §4.12 |
| A5A9B914DEAF4C16B028C9D8A4F39A6F | Create Inverse document for Invoice | onLoad, onChg ×1 | §4.1, §4.2, §4.12, §4.8 | NO | §4.1 + §4.2 + §4.8 + §4.12 |
| B4A21A617AD64137BF8C9A6770F65AD2 | Create Inverse document for Order | onLoad | §4.1, §4.8 | NO | §4.1 + §4.8 |
| 8DF818E471394C01A6546A4AB7F5E529 | Process Orders | onLoad | (same as above family — processRecords.js) | NO | §4.1 + §4.8 |
| 33338B1F2C4F499EBA4F5547BE0B2A4E | Process Shipment | onLoad, onChg ×1 | §4.1, §4.2, §4.12, §4.8 | NO | §4.1 + §4.2 + §4.8 + §4.12 |
| 272C8D38EF3245BF882E623CE92AB4E7 | Process Invoices | onLoad, onChg ×1 | §4.1, §4.2, §4.12, §4.8 | NO | §4.1 + §4.2 + §4.8 + §4.12 |
| DF7F70B82C514F639F06495E0B818A53 | Add Credit Payments | onLoad, onProc, onGridLoad ×2 | §4.1, §4.2, §4.3, §4.7, §4.8, §4.9, §4.12 | NO | §4.1 + §4.2 + §4.3 + §4.7 + §4.8 + §4.9 + §4.12 |
| C4265E27C8134096B49DFBF69369DFC6 | Service Order Line Relation Pick and Edit | onLoad, onGridLoad ×1 | §4.1, §4.3, §4.12, §4.8 | NO | §4.1 + §4.3 + §4.8 + §4.12 |
| 9C260D0E9C054A6F88AFC8E3B23A0E9A | Add Invoices | onLoad, onProc, onGridLoad ×2 | (same shape as Add Credit Payments) | NO | §4.1 + §4.2 + §4.3 + §4.7 + §4.8 + §4.9 + §4.12 |
| E68790A7B65F4D45AB35E2BAE34C1F39 | Add Transaction | onLoad, onProc, onChg ×7 | §4.1, §4.2, §4.3, §4.7, §4.8, §4.9, §4.10, §4.12, §4.13 | NO | (many) |
| A832A5DA28FB4BB391BDE883E928DFC5 | Open Close Periods (signal 3) | processId | §4.1, §4.2, §4.3, §4.8, §4.9, §4.11 | NO | §4.1 + §4.2 + §4.3 + §4.8 + §4.9 + §4.11 |
| FE3A8C134D41488DB3A69837BD54B56A | Manage Variants | onGridLoad ×1 | §4.3, §4.11, §4.12 | NO | §4.3 + §4.11 + §4.12 |
| 86F0B1EBE2BC48E3ACF458768D14CC99 | Match Statement | onLoad, onProc, **onRefresh** | §4.1, §4.3, §4.4, §4.5, §4.6, §4.7, §4.8, §4.9, §4.10, §4.13 (refresh DONE) | NO | (heavy: all of A-L) |
| A2C19D0EF6594D14A64BC62E99A89CC3 | RFC/RTV HQL Pick and Edit Lines | onLoad | §4.1, §4.2, §4.3, §4.8 | NO | §4.1 + §4.2 + §4.3 + §4.8 |
| 50D2EB7B24B44EA39C4735AC51CA8E0A | Validate Barcode Action (pickinglist, signal 3) | processId | §4.1, §4.2, §4.3, §4.8, §4.9, §4.10, §4.13 | NO | (heavy) |
| 71DEE8098CE74C939575FF57609952CC | Validate Barcode Action (packing, signal 3) | processId | §4.1, §4.2, §4.3, §4.8, §4.9, §4.10, §4.13 | NO | (heavy) |
| 83AD8A78FB1C4EDBB4A222A276498938 | Manage Packing Action (signal 3) | processId | §4.1, §4.2, §4.3, §4.8, §4.9, §4.10, §4.13 | NO | (heavy) |
| 9BED7889E1034FE68BD85D5D16857320 | Add Payment | onLoad, onProc, onChg ×13, onGridLoad ×3 | §4.1, §4.2, §4.3, §4.6, §4.7, §4.8, §4.9, §4.10, §4.11, §4.12, §4.13 | NO | **all capabilities** |

No row is feasible today: every in-scope process needs at least §4.12 (parameter hooks) or
§4.8 (OB shim) or §4.1 (view contract). The lowest-cost wins are the rows that need only
`§4.12 + §4.2` (3 processes) — Valued Stock Report, Verifactu Query, and (partially) the simple
onChange-only candidates.

---

## §7. Capability priority order (recommendation)

Cheap-to-expensive, with **BE** (backend, `com.etendoerp.metadata`) and **FE** (frontend,
`client/`) tags. Final ordering is the user's call; this is the recommended sequence based on
the unlock tallies in §6 and dependency relationships between capabilities.

1. **[BE] §5.1 + §5.2 — Lock the JSON contract.** No new code; **only audit + test**. Add tests in `ProcessDefinitionBuilderTest` / `ParameterBuilderTest` asserting that all six `etmeta*` keys are always present (with `null` when empty) on every payload. Locks the foundation for every FE consumer downstream.
2. **[FE] §4.8 — `OB.*` shim extension** (`I18N`, `Format`, `Utilities.Number`, `Utilities.Action.{set,execute}` *(executeJSON in §4.10)*, `Styles`, `Utilities.generateRandomString`, `PropertyStore.set`, namespace auto-vivify). Small, blocks ~30 processes for messaging/formatting/namespace registration.
3. **[FE] §4.12 — Parameter-level hook execution.** Compile + bind `etmetaOnParameterChange` and `etmetaOnGridLoad` in [ProcessParameterSelector.tsx](../../../packages/MainUI/components/ProcessModal/selectors/ProcessParameterSelector.tsx). Unlocks 23 of the 31 column-signal processes. Requires §4.8 (the script body uses `OB.*` helpers freely) and a minimal §4.2 form-item proxy on `view.theForm`.
4. **[FE] §4.6 — Modal dialogs.** Promise-based `confirm` / `warn` / `say` exposed under both names. Small, blocks every flow-gating onLoad / onProc.
5. **[FE] §4.7 — In-modal message bar.** `<MessageBar>` element inside the modal + `view.messageBar.setMessage` / `.hide()` handle. Moderate; needed by most onProcess scripts that report status without dispatching `responseActions`.
6. **[FE] §4.10 — Action JSON dispatcher.** Extend the existing `extractResponseMessage` path into a `dispatchResponseAction(action, ctx)` covering every classic action type (`showMsgInView`, `refreshGrid`, `OBUIAPP_browseReport`, `OBUIAPP_downloadReport`, `setSelectorValueFromRecord`, `openDirectTab`, `smartclientSay`, `custom`), and wire `OB.Utilities.Action.executeJSON` / `.execute` to it. Moderate.
7. **[FE] §4.9 — `OB.RemoteCallManager.call` callback adapter.** Thin wrapper over `callAction` that emulates the classic callback contract. Cheap once §4.8 lands. Unlocks every script that calls a server action handler.
8. **[FE] §4.11 — Datasource façade.** `OB.Datasource.create(config)` returning a `{fetchData}` object backed by `callDatasource`. Moderate.
9. **[FE] §4.2 — Form-item full API.** Programmatic mutation surface on `view.theForm.getItem(name)`. Moderate; depends on react-hook-form primitives.
10. **[FE] §4.13 — Shared module scope for `etmetaPayscriptLogic`.** Evaluate the body once into a module scope; compile each hook within that scope; auto-vivify under `OB.<Module>.<Process>`. Straightforward but invasive (touches every hook compile site).
11. **[FE] §4.1 — `view` object completion.** Expose the remaining view properties / methods (`popupButtons`, `cancelButton`, `parentWindow`, `parentElement`, `fireOnPause`, `handleReadOnlyLogic`, `handleButtonsStatus`, `refresh`, `getView(tabId)`, `sourceView`, `callerField`). Large; some properties (footer-button programmability) require new modal-chrome plumbing.
12. **[FE] §4.3 — Embedded interactive grid.** Programmable grid surface on `view.theForm.getItem('<param>').canvas.viewGrid` (selection, edit values, datasource swap, filter API, lifecycle callbacks). Large. Blocker for Match Statement / AddPayment / AddTransaction full ports.
13. **[FE] §4.4 — Per-row grid plugin.** Declarative row-action registration keyed by `(processId, parameterId)`. Depends on step 12.
14. **[FE] §4.5 — Nested-process modal stack.** Modal stack + `view.openProcess(params)` + auto-fire of parent's `onRefreshFunction` on child close. Depends on step 12 (the canonical case launches a nested process from a row component).

Steps §5.3 and §5.4 are not on the priority list because they require no code change; they are
documented in §5 as standing confirmations of the existing contract.

After step 4 (§4.6), **all 9 easy processes are mostly feasible** modulo §4.12. After step 8
(§4.9), **the 24 medium processes are mostly feasible** modulo the per-process additions. The
last three steps (§4.3 / §4.4 / §4.5) gate Match Statement and the 4 hard processes (AddPayment,
ManagePacking pair, both Validate Barcode Action variants).

---

## §8. Verification and acceptance criteria for the migration as a whole

Single-sentence acceptance criteria for each of the 10 QA representative processes from inventory
§10, with the §4 capabilities they exercise. When all 10 ship, every §4 subsection is exercised
by at least one process.

| QA # | id | process | acceptance criterion | §4 capabilities exercised |
|---|---|---|---|---|
| 1 | 45ED6D0400FD42BEA9771C549A9AE8AB | Validate Costing Rule | Open the modal, see onLoad-populated defaults; submit with invalid input and confirm the confirm dialog blocks execution. | §4.1, §4.6, §4.7, §4.8, §4.9 |
| 2 | C044DDAA929E40D780C36154FBB968F7 | Create Invoices from Orders | Change the affected parameter and verify the embedded grid's criteria update accordingly. | §4.2, §4.3, §4.12 |
| 3 | 20D69FFD251A481BA75F33538EDFCF76 | VAT Regularization | onLoad runs on open; the embedded grid's onGridLoad correctly decorates the rows with the migrated logic. Custom action set via `OB.Utilities.Action.set` fires from a parameter button. | §4.1, §4.2, §4.3, §4.10, §4.12 |
| 4 | 154CB4F9274A479CB38A285E16984539 | Find Transactions to Match | clientsidevalidation gates the submit; the process is reachable from Match Statement's nested launch (§4.5). | §4.1, §4.5, §4.8, §4.9, §4.10 |
| 5 | EB4C4053F3B94A17A08D1DD7E89CEB7E | Aging Balance Payables | Change each of the 5 affected parameters and verify each onChange fires with the migrated `OB.OnChange.agingProcessDefinition*` semantics. Message bar shows the warning when applicable. | §4.2, §4.7, §4.8, §4.12 |
| 6 | 86F0B1EBE2BC48E3ACF458768D14CC99 | Match Statement | All three of onLoad / onProc / onRefresh fire correctly; the embedded grid renders the row-component plugin; launching the nested Find Transaction popup, closing it, auto-fires this process's onRefresh. | §4.1–§4.10, §4.13 |
| 7 | 60F1E2DEB1B544908CDD4CF99ACA80EB | Etendo Payment Execution | `Received In` / `Paid Out` onChange fire; the `EAPM_Popup` action registered via `OB.Utilities.Action.set` opens the migrated popup with the right parameters. | §4.2, §4.8, §4.10, §4.12 |
| 8 | A832A5DA28FB4BB391BDE883E928DFC5 | Open Close Periods | Pure signal-3 routing: the JS migrated into the new fields runs end-to-end despite no metadata-column binding existing in classic. The custom popup it builds renders correctly. | §4.1, §4.2, §4.3, §4.8, §4.9, §4.11 |
| 9 | 83AD8A78FB1C4EDBB4A222A276498938 | Manage Packing Action | Both `OBWPACK_PackingComponent.js` and `OBWPACK_Process.js` migrations are loadable together (§4.13 shared scope); barcode workflow runs. | §4.1, §4.2, §4.3, §4.8, §4.9, §4.10, §4.13 |
| 10 | 9BED7889E1034FE68BD85D5D16857320 | Add Payment | All 16 parameter callbacks (onChange ×13, onGridLoad ×3) fire correctly; onLoad populates defaults; clientsidevalidation runs; submission triggers refreshGrid and openDirectTab action types. | every §4 capability |

When all 10 pass, every §4 capability has at least one process exercising it.

---

## §9. Open investigations

1. **`dist.js` bundle processes** from inventory §7 (12 processes across Advanced Warehouse
   Management, CRM, Warehouse Packing). The classic JS is only available as a minified bundle,
   not as readable source. Required follow-up: clone the source modules so the bundles can be
   un-minified, and run the §4 surface scan against them; the capability set above may need
   additional entries.
2. **`processRecords.js`-shared family** (5 processes: Create Inverse Invoice/Order, Process
   Orders / Shipment / Invoices). The same file is referenced by 5 process ids. Confirm whether
   a single migration covers all five (preferred) or each id needs its own copy of the relevant
   subset.
3. **`ob-onchange-functions.js` partial migration.** The full file is large but only the
   `OB.OnChange.agingProcessDefinition*` entries are in scope. Confirm before starting that
   migrating just those is sufficient and the rest of the file's exports are not needed
   elsewhere in the new UI (likely true given the new UI uses different mechanisms).
4. **HTML sanitization policy for `view.messageBar.setMessage`.** Match Statement injects an
   anchor-link-with-inline-onclick to deliver the "never show this again" affordance. Either
   port the HTML through a strict allowlist (block `onclick`, use a React-handled click handler)
   or change the migrated code to use a structured message. Decide before §4.7 implementation.
5. **`OB.<Module>.<Process>` namespace globals vs per-modal scope.** Two processes share the
   same OB namespace prefix (e.g. all `OB.APRM.*`) only because classic loaded all APRM files
   globally; the new UI evaluates one process at a time. The §4.13 shared scope per-process is
   sufficient — but document explicitly that **inter-process namespace sharing is not supported**
   in the new UI. If any classic file relies on calling a function defined by *another* process
   file (the §4-M coupling check ruled this out for the sample but should be confirmed for the
   remaining 27 processes), that file needs its helpers duplicated.
6. **PayScript DSL vs JS-function-expression dispatch on `etmetaPayscriptLogic`.** The §4.13
   contract treats the column as either DSL or JS depending on body shape. Decide on the
   detection rule (e.g. "starts with `{` → DSL, starts with `function`/`(` → JS module body";
   or an explicit `/// payscript-dsl` / `/// js-module` shebang).
