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
- [utils/processes/definition/utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts) — `buildProcessScriptContext` exposes `callAction` / `callDatasource` / `callServlet` plus the shared `OB` shim to migrated scripts.
- [utils/ob/](../../../packages/MainUI/utils/ob/) — `createOBShim()` builds the `OB.*` namespace (PropertyStore, I18N, Format, Utilities, Styles, …); see §4.8.

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
| `OB.*` shim — `PropertyStore.get`/`set`, `I18N.getLabel`, `Format.*`, `Utilities.Number.JSToOBMasked`, `Utilities.Action.set`/`execute`, `Utilities.generateRandomString`, `Styles.MessageBar`, `TestRegistry.register`, module-namespace writes | [utils/ob/](../../../packages/MainUI/utils/ob/) (shared per modal via [utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts) `buildProcessScriptContext`) | DONE |
| `showMsgInProcessView` response action (toast on success/warning/error) | [useProcessExecution.ts:679-696](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts#L679-L696) | DONE |
| Parameter-level hooks compiled + bound to form items / grid lifecycle | [useParameterChangeHooks.ts](../../../packages/MainUI/components/ProcessModal/hooks/useParameterChangeHooks.ts) (onParameterChange via central `form.watch`), [WindowReferenceGrid.tsx](../../../packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx) (onGridLoad on data-arrived), proxies in [scriptProxies.ts](../../../packages/MainUI/utils/processes/definition/scriptProxies.ts) | DONE (§4.12; audited-sufficient proxies, §4.13 shared scope deferred) |
| Modal dialogs — promise-based `confirm` / `warn` / `say` (+ `isc` shim) injected into every hook context | [dialogs.ts](../../../packages/MainUI/utils/processes/definition/dialogs.ts) (singleton queue + script API, folded into `buildProcessScriptContext`), [ProcessDialogHost.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDialogHost.tsx) (renders via `ActionModal`, mounted in [ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx)) | DONE (§4.6; plain-text message, advanced button/HTML deferred) |
| In-modal message bar — `messageBar` / `view.messageBar` (`setMessage(severity, title, text, actions?)` / `hide()`), sanitized HTML | [messageBarStore.ts](../../../packages/MainUI/utils/processes/definition/messageBarStore.ts) + [sanitizeHtml.ts](../../../packages/MainUI/utils/processes/definition/sanitizeHtml.ts) (singleton + DOMPurify), [ProcessMessageBar.tsx](../../../packages/MainUI/components/ProcessModal/ProcessMessageBar.tsx) (banner, mounted in [ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx)) | DONE (§4.7; replaces the temporary §4.12 toast backing) |
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

**Coverage status.** DONE. Promise-based `confirm` / `warn` / `say` (plus `ask` alias and the `isc`
namespace) are implemented in [dialogs.ts](../../../packages/MainUI/utils/processes/definition/dialogs.ts)
and rendered by [ProcessDialogHost.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDialogHost.tsx).
They are injected into every hook context by `buildProcessScriptContext`
([utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts)), so onLoad / onProcess /
onParameterChange / onGridLoad / onRefresh all receive them.

**Implementation notes (delivered).**

- **Imperative API, React-free.** `dialogs.ts` owns a singleton FIFO request queue (one dialog at a
  time, faithful to the classic single modal) and the script-facing helpers. Being React-free it is
  importable by the pure `buildProcessScriptContext`; the helpers are spread into the returned context
  (`confirm`, `warn`, `say`, `isc`), shadowing the native `window.confirm` inside compiled hooks.
- **Promise + classic callback.** Every helper returns a Promise (`confirm`/`ask` → `boolean`,
  `warn`/`say` → `void`) and never blocks the event loop. The overloaded classic shapes are honoured:
  the 2nd argument may be a callback **or** an options object, with an optional trailing callback —
  `confirm(message, callback)` and `confirm(message, options, callback)` both work and still receive
  the boolean. Migrated scripts typically `await` instead.
- **Reuses the visual shell.** `ProcessDialogHost` subscribes to the queue via `useSyncExternalStore`
  and renders the existing [ActionModal](../../../packages/ComponentLibrary/src/components/ActionModal/index.tsx)
  (title / message / variant buttons / overlay). No new dialog chrome was built. The host is mounted
  **inside** `ProcessDefinitionModal` (lifecycle bound to the process modal), not globally.
- **Safe defaults.** If no host is mounted (modal closed) the call resolves to `false` and logs; on
  host unmount with a dialog still pending, `clearDialogs` resolves it to `false` — never an accidental
  OK on a destructive branch. `confirm` shows OK + Cancel; `warn` / `say` show a single acknowledge
  button.
- **Audited-sufficient scope.** `options.title` is supported (with per-kind default titles); advanced
  classic options (`toolbarButtons` / `buttons` with custom `click`) are ignored. Messages render as
  **plain text** — rich HTML in dialogs is deferred to align with the §4.7 message-bar sanitizer; the
  in-scope process `confirm` messages are plain i18n labels.
- **Tests.** [dialogs.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/dialogs.test.ts)
  (resolution, callback/options shapes, `isc`/`ask` mirroring, FIFO queue, no-host default, clear) and
  [ProcessDialogHost.test.tsx](../../../packages/MainUI/components/ProcessModal/__tests__/ProcessDialogHost.test.tsx)
  (render, accept/cancel, single-button info dialog, unmount resolves pending).

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
its state managed by the modal so scripts can mutate it through a `view.messageBar` handle.
Final signature (resolved in §9.4):

```ts
view.messageBar.setMessage(
  severity: 'info' | 'success' | 'warning' | 'error',
  title: string | null,
  text: string,                          // sanitized HTML, formatting tags only
  actions?: Array<{ label: string; onClick: () => void }>
): void;
view.messageBar.hide(): void;
```

- `text` is rendered through a **DOMPurify**-based sanitizer with a locked allowlist (formatting
  tags only: `b`, `i`, `em`, `strong`, `br`, `span`, `p`, `ul`, `ol`, `li`, `code`; no `<a>`, no
  `<script>`, no inputs, no `style` attribute, no `on*` handlers). The sanitizer config is
  immutable and not exposed to migrated scripts.
- `actions` render as real React buttons inside the banner. Classic patterns that used inline
  `<a href="#" onclick="...">` (e.g. Match Statement's "never show again") must be rewritten as
  `actions` entries; `onClick` is a closure in the module scope (§4.13).
- See §9.4 for the full sanitization policy, rationale, and dependency justification.

**Backend requirement.** None.

**Coverage status.** DONE. Implemented as a singleton store +
[ProcessMessageBar.tsx](../../../packages/MainUI/components/ProcessModal/ProcessMessageBar.tsx) host
mounted at the top of the modal body, replacing the temporary toast backing left by §4.12. Files:
[messageBarStore.ts](../../../packages/MainUI/utils/processes/definition/messageBarStore.ts),
[sanitizeHtml.ts](../../../packages/MainUI/utils/processes/definition/sanitizeHtml.ts),
[ProcessMessageBar.tsx](../../../packages/MainUI/components/ProcessModal/ProcessMessageBar.tsx),
handle type in [scriptProxies.ts](../../../packages/MainUI/utils/processes/definition/scriptProxies.ts),
injection in [utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts). Tests:
[messageBarStore.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/messageBarStore.test.ts),
[sanitizeHtml.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/sanitizeHtml.test.ts),
[ProcessMessageBar.test.tsx](../../../packages/MainUI/components/ProcessModal/__tests__/ProcessMessageBar.test.tsx).

**Implementation notes (delivered).**

- **Store + host pattern (mirrors §4.6 dialogs).** A React-free singleton store
  (`setMessage`/`hide`/`subscribe`/`getState`, one message at a time — replace, no queue) is consumed
  by `ProcessMessageBar` via `useSyncExternalStore`. The host is mounted at the top of the modal's
  scrollable body, above `renderResponse()`/`renderParameters()`. The message lifetime is owned by the
  modal (cleared on each open via an effect in `ProcessDefinitionModal`), **not** by the host's
  unmount: the host mounts/unmounts during the modal's loading-spinner ↔ form transitions, so clearing
  on its unmount wiped messages a script set in `onLoad`/`onChange` (fixed while wiring §4.10). This
  **replaces the temporary toast backing** introduced in §4.12.
- **Visual reuse.** The banner reuses the modal's existing banner visual language
  (`border-l-4 bg-gray-50` + `<h4>` title) with per-severity CSS tokens
  (`--color-{success,warning,error}-main`, `--color-etendo-main` for info) and ComponentLibrary SVG
  icons. `title` is plain text; `text` is sanitized HTML; `actions` are real React buttons; a close
  button calls `hide()`.
- **Sanitization (§9.4).** `text` is sanitized by a single `sanitizeMessageHtml` helper wrapping
  DOMPurify with the locked allowlist (formatting tags only; `class` the only attribute; `<a>`/`on*`/
  `style` forbidden). The config is internal and not exposed to scripts.
- **Dual access (no §4.1 scope creep).** The same singleton handle is injected into the script context
  as a top-level `messageBar` key (so process-level `onLoad`/`onProcess`/`onRefresh`, which receive no
  `view`, call `messageBar.setMessage(...)`) **and** is exposed as `view.messageBar` inside the
  parameter/grid proxies (§4.12). Both reach the same banner. The full process-level `view` object
  stays deferred to §4.1.

**Unlocks.** Match Statement, AddPayment, AddTransaction, Validate Costing Rule, Aging Balance
(via `OB.OnChange.agingProcessDefinition*`), VAT Regularization, ETFRA family.

---

### §4.8 — `OB.*` namespace shim

**What classic does.** The global `OB.*` object is the canonical entry point for translations,
remote calls, format helpers, action registration, style constants, datasource creation, and
property access. Before this step the new UI only exposed `OB.PropertyStore.get`; the core shim is
now implemented in [utils/ob/](../../../packages/MainUI/utils/ob/) (see Coverage status below).

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

**Coverage status.** DONE (core shim). Implemented in [utils/ob/](../../../packages/MainUI/utils/ob/):
`PropertyStore.get`/`set`, `I18N.getLabel` (with `%n` substitution), `Format.*`,
`Utilities.Number.JSToOBMasked`, `Utilities.Action.set`/`execute`, `Utilities.generateRandomString`,
`Styles.MessageBar`, `TestRegistry.register` (no-op) and tolerant module-namespace writes.
`Datasource.create` (§4.11) remains deferred — exposed as a stub that throws a traceable
"not implemented yet" error pointing to its step. (`Utilities.Action.executeJSON` is now implemented
— see §4.10; `RemoteCallManager.call` is now implemented — see §4.9.)

**Implementation notes (delivered).**

- **One shared `OB` per modal.** `createOBShim(deps)` is built once inside `buildProcessScriptContext`
  ([utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts)) and reaches onLoad /
  onProcess / onChange / onRefresh through the existing `...processScriptContext` spread, so the
  action registry and `OB.<Module>.<Process>` namespace writes persist across hooks (this also lays
  the groundwork for §4.13). The previous per-call `createOBShim()` sites were removed.
- **`JSToOBMasked` — simple, audit-gated.** A `grep` of every in-scope process confirmed all calls
  pass `OB.Format.defaultNumericMask` (standard `#,##0.00`-style mask) and never an exotic literal
  mask, so a ~25-line deterministic implementation ([number.ts](../../../packages/MainUI/utils/ob/number.ts))
  replaces the classic `OBPlainToOBMasked` chain. It honours the mask's min/max decimals and the
  given separators; masks with literal symbols are explicitly out of scope (documented in its JSDoc).
- **Namespace auto-vivify = plain object + idiomatic guard (no Proxy).** `OB` is a plain extensible
  object; migrated scripts keep the `OB.APRM = OB.APRM || {}` guard before nesting. `if (OB.Foo)`
  still reads `undefined` for unknown keys.
- **`I18N.getLabel`** resolves the template via the language-context dictionary and applies classic
  positional `%n` substitution; unknown keys fall back to the key itself (new-UI convention).
- **`Format.*`** derives the decimal/grouping symbols from the current language via
  `Intl.NumberFormat`; grouping size 3 and the default numeric mask are constants.

**Unlocks.** Essentially every process in §6 except the trivial onChange-only ones. The shim is
the foundation: any other capability that returns JS-side data (§4.7 message bar uses `OB.Styles`,
§4.10 actions uses `OB.Utilities.Action`, §4.11 datasource uses `OB.Datasource`) depends on it.

**Tests.** [utils/ob/__tests__/](../../../packages/MainUI/utils/ob/__tests__/) — one suite per
module (i18n, format, number, action, utilities, styles, obShim) plus `setStoredPreference` coverage
in [propertyStore.test.ts](../../../packages/MainUI/utils/__tests__/propertyStore.test.ts).

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

**Coverage status.** DONE.

**Implementation notes (delivered).**

- **Factory module, React-free.** `createRemoteCallManager(deps)`
  ([remoteCallManager.ts](../../../packages/MainUI/utils/ob/remoteCallManager.ts)) mirrors the
  `createAction` / `createI18N` factory pattern: the transport is injected as `deps.remoteCall` so
  `utils/ob` stays free of any React / `fetch` layer. `buildProcessScriptContext`
  ([utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts)) wires
  `remoteCall = (handler, params) => callAction(handler, params)`, reaching the same kernel endpoint
  (`POST org.openbravo.client.kernel?_action=<handler>`) the classic RPC posts to — so the shim was
  moved to run after `callAction` is declared.
- **Classic callback contract.** `call(actionName, data, requestParams, callback, callerContext, errorCallback)`
  fires `remoteCall(actionName, data ?? {})` and:
  - On resolve → `callback({ status: 0 }, result.data, { clientContext: callerContext })` — `data` is
    the parsed JSON body.
  - On reject (transport / non-OK HTTP) → `errorCallback` when a function, otherwise `callback`, with
    `{ status: -1 }` so classic `response.status < 0` branches keep working.
- **Business error vs transport error.** A business error arrives as a normal HTTP 200 response with
  `data.message.severity === 'error'`; it flows through the success path and the script inspects
  `data`, exactly like classic. Only a rejected `callAction` lowers `status` below zero.
- **`requestParams` (3rd arg)** is accepted for signature compatibility but not used for routing: the
  kernel call is always a POST (action handlers are POST). The classic `httpMethod`/GET override is
  intentionally out of scope.
- **No transport = traceable throw.** A shim built without `remoteCall` (e.g. `createOBShim()` with no
  deps, as in isolated tests) throws `"OB.RemoteCallManager.call requires a remoteCall dependency"`
  rather than failing silently. In production the dependency is always injected.
- **Fire-and-forget / reentrancy.** `call` returns `void` (like classic) and always chains `.catch`
  (no unhandled rejection). Each call is an independent promise with no shared state, so nested
  callbacks (common in AddPayment) are reentrant by construction.

**Tests.** [remoteCallManager.test.ts](../../../packages/MainUI/utils/ob/__tests__/remoteCallManager.test.ts)
(success / failure / errorCallback routing / caller context / missing-data / no-transport),
plus integration coverage in [obShim.test.ts](../../../packages/MainUI/utils/ob/__tests__/obShim.test.ts)
and [utils.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/utils.test.ts)
(routes through `callAction`; transport failure → negative status).

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

**Coverage status.** DONE. `OB.Utilities.Action.executeJSON` is wired and every classic action
type is routed to a new-UI side effect (see the table below). `OB.Utilities.Action.set` / `.execute`
were already covered in §4.8.

**Implementation notes (delivered).**

- **Pure parser + pure router, React-free store.** The existing pure parser
  `dispatchResponseActions(data) → DispatchedAction[]`
  ([responseActionDispatcher.ts](../../../packages/MainUI/components/ProcessModal/utils/responseActionDispatcher.ts))
  was extended with the two report action types, and `dispatchSingle` was exported so a lone
  `{ name: payload }` entry from `executeJSON` runs through the same logic. A new pure router
  `dispatchResponseAction(action, ctx)` (a single flat switch, no nested ternaries) delegates each
  `kind` to a named handler on an `ActionDispatchContext`. A singleton store
  ([actionDispatcherStore.ts](../../../packages/MainUI/utils/processes/definition/actionDispatcherStore.ts))
  holds the active context — the same store/host pattern used by the dialogs (§4.6) and the message
  bar (§4.7). The process modal registers the live handlers on mount
  ([useActionDispatchContext.ts](../../../packages/MainUI/components/ProcessModal/hooks/useActionDispatchContext.ts))
  and clears them on unmount.
- **`executeJSON` is registry-first.** Each entry runs its function registered via
  `OB.Utilities.Action.set` if present, otherwise the built-in handler for that type. The built-in
  `custom` action is seeded into the registry and invokes `paramObj.func` only when it is a function
  (the classic string-eval form is intentionally dropped for security). `utils/ob` stays free of any
  React dependency: the shim receives `dispatchBuiltinAction` by injection through `createOBShim`
  ([obShim.ts](../../../packages/MainUI/utils/ob/obShim.ts) / [action.ts](../../../packages/MainUI/utils/ob/action.ts)),
  wired from `buildProcessScriptContext`.
- **Dual entry, no double effect.** Migrated scripts call `executeJSON` directly; in addition the
  onProcess return path dispatches the returned actions through `dispatchProcessReturnActions`
  ([useProcessExecution.ts](../../../packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts)),
  which **excludes** the `message` and `openDirectTab` kinds — those keep driving the existing
  success/banner/navigation flow, so they are never applied twice.
- **Action type → new-UI effect:** `showMsgInProcessView` → message bar (§4.7); `showMsgInView` →
  toast; `openDirectTab` → `handleNavigateToTab`; `refreshGrid` → targeted refetch of the launching
  tab's grid via `refetchDatasource(tab.id)` (NOT the `onSuccess` success handler — that closes/reloads
  the modal and, when `refreshGrid` is dispatched from `onLoad`, reopens it and re-runs `onLoad` in an
  infinite loop; `refetchDatasource` only re-runs the grid's data fetch and leaves the selection graph
  untouched, so `onLoad` does not re-fire); `refreshGridParameter` → modal grid refresh key;
  `smartclientSay` → dialog `say` (§4.6);
  `OBUIAPP_browseReport` / `OBUIAPP_downloadReport` → token-authenticated fetch → Blob → open /
  download ([reportActions.ts](../../../packages/MainUI/utils/processes/definition/reportActions.ts);
  the new UI authenticates with a Bearer token, so a plain `window.open(url)` cannot be used);
  `setSelectorValueFromRecord` → best-effort no-op with a warning (the standalone process modal has no
  caller selector field; effective once a process is launched from a selector — §4.1/§4.3).

**Unlocks.** Match Statement (Match Statement OnLoad handler returns `responseActions`),
AddPayment (returns `refreshGrid` + `openDirectTab` after submission), AddTransaction,
Etendo Payment Execution, ProductCharacteristics, every process that downloads a report.

**Tests.** [responseActionDispatcher.test.ts](../../../packages/MainUI/components/ProcessModal/utils/__tests__/responseActionDispatcher.test.ts)
(parser + router + `buildReportActionUrl`),
[actionDispatcherStore.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/actionDispatcherStore.test.ts),
[reportActions.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/reportActions.test.ts),
[action.test.ts](../../../packages/MainUI/utils/ob/__tests__/action.test.ts) and
[obShim.test.ts](../../../packages/MainUI/utils/ob/__tests__/obShim.test.ts).

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

**Coverage status.** DONE (core wiring + audited-sufficient proxies). Implemented in:
[scriptProxies.ts](../../../packages/MainUI/utils/processes/definition/scriptProxies.ts),
[compileParameterHook.ts](../../../packages/MainUI/utils/processes/definition/compileParameterHook.ts),
[useParameterChangeHooks.ts](../../../packages/MainUI/components/ProcessModal/hooks/useParameterChangeHooks.ts),
plus the wiring in [ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx)
and [WindowReferenceGrid.tsx](../../../packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx).
Both fields are exposed on `ProcessParameter` ([types.ts](../../../packages/api-client/src/api/types.ts)).
Tests: [scriptProxies.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/scriptProxies.test.ts),
[compileParameterHook.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/compileParameterHook.test.ts),
[useParameterChangeHooks.test.tsx](../../../packages/MainUI/components/ProcessModal/hooks/__tests__/useParameterChangeHooks.test.tsx).

**Implementation notes (delivered).**

- **Centralised onParameterChange, not per-selector.** Each parameter's `etmetaOnParameterChange` is
  compiled once and bound from a single `form.watch` subscription in `useParameterChangeHooks`
  (mounted by the modal), rather than wiring every selector. The hook fires with
  `(item, view, form, grid)` and `grid = null` for scalar parameters. The grid-cell variant
  (`item.rowNum` / `item.columnName`) is supported by `createItemProxy` extras but is only populated
  once the grid-cell onChange path is wired.
- **Firing semantics — `watch` + diff + re-entrancy + debounce (no per-selector blur wiring).** Classic
  fires on the item's *blur*; the new UI's form is `mode: "onChange"`, but the real commit timing comes
  from each selector: `NumericSelector` commits on blur, and select / boolean / date / datetime /
  tabledir / list commit once per discrete selection, so only free-text (`GenericSelector`) commits per
  keystroke. Three guards make this safe and blur-like: (1) a value diff — fire only when the committed
  value actually changed; (2) a re-entrancy guard — a hook's own `item.setValue` does not recursively
  re-fire that parameter; (3) a trailing ~250 ms debounce — coalesces free-text keystroke bursts into a
  single call. Net effect: discrete selectors fire once immediately, numeric fires on blur, text fires
  once the typing settles, and loops are impossible. A literal per-selector `onBlur` wiring was
  considered and rejected: it is distributed across every selector and semantically ambiguous for
  discrete selectors that have no meaningful blur.
- **onGridLoad fires per datasource payload.** Bound to `WindowReferenceGrid`'s data-arrived effect (the
  rawRecords-changed sync), it runs once per load with `(grid, view, parameters)` — mirroring the classic
  grid `dataArrived` hook (which also fires on reload, e.g. the empty-result message in
  `productCharacteristicsProcess.testOnGridLoad`). `grid.view.theForm` is wired so the script can read
  sibling parameter values.
- **Audited-sufficient proxies (no full §4.1/§4.2/§4.3 yet).** `item` / `form` / `view` / `grid` proxies
  implement only the methods the in-scope migrated scripts actually call (`item.getValue`/`setValue`,
  `form.getItem`/`getValues`/`redraw`, `view.theForm`/`messageBar`, `grid.getData().getLength()`/
  `getSelectedRecords`/`getRecord`/`getRecordIndex`/`data`), backed by react-hook-form and the grid's
  loaded rows + selection. Every other classic method on these proxies is a stub that throws
  `"<api> is not implemented yet"` (same convention as the deferred `OB.*` stubs), so an unported script
  fails clearly instead of with a cryptic "undefined is not a function". The full view/form/grid
  contracts (dynamic field add/remove, `grid.setEditValue`, selection mutation, filter editor, …) land
  with §4.1 / §4.2 / §4.3.
- **§4.13 shared scope deferred.** Parameter hooks receive `OB.*`, `callAction`/`callDatasource`/
  `callServlet` and the proxies, but do **not** yet resolve bare-name helpers nor
  `OB.<Module>.<Process>.*` from `em_etmeta_payscript_logic`. Bodies migrated for this step must be
  self-contained or use the implemented APIs; the shared module scope lands with §4.13 (which §7 orders
  after this step).
- **`view.messageBar` is the real in-modal banner (§4.7, delivered).** It was initially a temporary
  toast backing; §4.7 replaced it with the sticky `ProcessMessageBar` banner backed by a singleton
  store. The same handle is also injected as a top-level `messageBar` context key for process-level
  hooks that have no `view`.

**Unlocks.** All 23 column-signal-1 processes that use parameter-level mechanisms (every process
with `onchangefunction ×N` or `ongridloadfunction ×N` in the inventory §6 table) whose hook bodies are
self-contained; processes whose hooks rely on shared `payscript_logic` helpers unlock fully with §4.13.

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

1. **[BE] §5.1 + §5.2 — Lock the JSON contract.** ✅ **DONE.** No new production code; audit + test only. Added contract-locking tests asserting all six `etmeta*` keys are always present (with JSON `null` when the column is empty) on every payload: `ProcessDefinitionBuilderTest#testToJSONKeepsAllProcessEtmetaKeysPresentWhenColumnsEmpty` (the four process-level keys, including the `eTMETAOnload`→`etmetaOnload` rename) and `ParameterBuilderTest#toJSONKeepsParameterLevelEtmetaHooksWhenPopulated` / `#toJSONKeepsParameterLevelEtmetaHooksPresentWhenColumnsEmpty` (the two parameter-level keys, populated and null). Locks the foundation for every FE consumer downstream.
2. **[FE] §4.8 — `OB.*` shim extension** (`I18N`, `Format`, `Utilities.Number`, `Utilities.Action.{set,execute}` *(executeJSON in §4.10)*, `Styles`, `Utilities.generateRandomString`, `PropertyStore.set`, namespace auto-vivify). ✅ **DONE.** Implemented in [utils/ob/](../../../packages/MainUI/utils/ob/) as a single `OB` instance per modal folded into `buildProcessScriptContext` ([utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts)); at the time `RemoteCallManager.call`/`Datasource.create`/`Action.executeJSON` were left as traceable deferred stubs (`Action.executeJSON` since done in §4.10, `RemoteCallManager.call` in §4.9; `Datasource.create` still deferred to §4.11). Tests in [utils/ob/__tests__/](../../../packages/MainUI/utils/ob/__tests__/). See §4.8 implementation notes. Unblocks ~30 processes for messaging/formatting/namespace registration.
3. **[FE] §4.12 — Parameter-level hook execution.** ✅ **DONE.** `etmetaOnParameterChange` is compiled once per parameter and bound from a single `form.watch` subscription in [useParameterChangeHooks.ts](../../../packages/MainUI/components/ProcessModal/hooks/useParameterChangeHooks.ts) (mounted by [ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx)), invoked as `(item, view, form, grid)` with three loop/overload guards (value diff, re-entrancy, ~250 ms debounce). `etmetaOnGridLoad` is compiled per grid parameter and fired on the data-arrived effect of [WindowReferenceGrid.tsx](../../../packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx) as `(grid, view, parameters)`. The `item`/`form`/`view`/`grid` proxies ([scriptProxies.ts](../../../packages/MainUI/utils/processes/definition/scriptProxies.ts)) are audited-sufficient — every other classic method throws a traceable "not implemented yet". Compile helper: [compileParameterHook.ts](../../../packages/MainUI/utils/processes/definition/compileParameterHook.ts). See §4.12 implementation notes. Unlocks the column-signal processes whose hook bodies are self-contained; helper-dependent ones unlock fully with step 10 (§4.13). Built on §4.8; §4.13 shared scope intentionally deferred.
4. **[FE] §4.6 — Modal dialogs.** ✅ **DONE.** Promise-based `confirm` / `warn` / `say` (+ `ask` alias and `isc` namespace) implemented in [dialogs.ts](../../../packages/MainUI/utils/processes/definition/dialogs.ts) as a React-free singleton FIFO queue + script API, injected into every hook context via `buildProcessScriptContext` ([utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts)). Rendered by [ProcessDialogHost.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDialogHost.tsx) (reusing `ActionModal`, mounted inside [ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx)). Returns Promises (never blocks) and also honours the classic `(message, callback)` / `(message, options, callback)` shapes; safe `false` default when no host / on unmount. Plain-text messages and advanced button/HTML customization deferred. Tests: [dialogs.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/dialogs.test.ts), [ProcessDialogHost.test.tsx](../../../packages/MainUI/components/ProcessModal/__tests__/ProcessDialogHost.test.tsx). See §4.6 implementation notes.
5. **[FE] §4.7 — In-modal message bar.** ✅ **DONE.** `ProcessMessageBar` banner driven by a singleton store ([messageBarStore.ts](../../../packages/MainUI/utils/processes/definition/messageBarStore.ts) + [ProcessMessageBar.tsx](../../../packages/MainUI/components/ProcessModal/ProcessMessageBar.tsx)), replacing the temporary §4.12 toast backing. `text` sanitized by DOMPurify ([sanitizeHtml.ts](../../../packages/MainUI/utils/processes/definition/sanitizeHtml.ts)); `actions` as React buttons. The handle is exposed both as a top-level `messageBar` context key (process-level hooks) and as `view.messageBar` (parameter/grid proxies). See §4.7 implementation notes. Tests under `utils/processes/definition/__tests__/` and `components/ProcessModal/__tests__/`.
6. **[FE] §4.10 — Action JSON dispatcher.** ✅ **DONE.** A pure router `dispatchResponseAction(action, ctx)` ([responseActionDispatcher.ts](../../../packages/MainUI/components/ProcessModal/utils/responseActionDispatcher.ts)) covers every classic action type (`showMsgInProcessView`, `showMsgInView`, `openDirectTab`, `refreshGrid`, `refreshGridParameter`, `setSelectorValueFromRecord`, `smartclientSay`, `OBUIAPP_browseReport`, `OBUIAPP_downloadReport`, `custom`), fed by a React-free singleton store ([actionDispatcherStore.ts](../../../packages/MainUI/utils/processes/definition/actionDispatcherStore.ts)) that the modal registers handlers into ([useActionDispatchContext.ts](../../../packages/MainUI/components/ProcessModal/hooks/useActionDispatchContext.ts)). `OB.Utilities.Action.executeJSON` is registry-first then routes built-ins via dependency injection ([action.ts](../../../packages/MainUI/utils/ob/action.ts)); the onProcess return path also dispatches the non-message actions (excluding `message`/`openDirectTab`, kept on the existing flow). Reports use a token-authenticated fetch→Blob→open/download ([reportActions.ts](../../../packages/MainUI/utils/processes/definition/reportActions.ts)). See §4.10 implementation notes. Tests under `utils/ob/__tests__/`, `utils/processes/definition/__tests__/` and `components/ProcessModal/utils/__tests__/`.
7. **[FE] §4.9 — `OB.RemoteCallManager.call` callback adapter.** ✅ **DONE.** React-free factory `createRemoteCallManager(deps)` ([remoteCallManager.ts](../../../packages/MainUI/utils/ob/remoteCallManager.ts)) wrapping the injected `callAction` ([utils.ts](../../../packages/MainUI/utils/processes/definition/utils.ts)); emulates the classic `(response, data, request)` callback with `{ status: 0 }` on success / `{ status: -1 }` on transport failure (routed to `errorCallback` when provided), preserving `clientContext`. Tests in [remoteCallManager.test.ts](../../../packages/MainUI/utils/ob/__tests__/remoteCallManager.test.ts), [obShim.test.ts](../../../packages/MainUI/utils/ob/__tests__/obShim.test.ts), [utils.test.ts](../../../packages/MainUI/utils/processes/definition/__tests__/utils.test.ts). See §4.9 implementation notes. Unlocks every script that calls a server action handler.
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

### Tech debt — `onLoad` is evaluated twice (warehouse-process detection)

**Change needed.** Stop running each process's `onLoad` body twice. Today it is executed once by
`useWarehousePlugin` ([useWarehousePlugin.ts](../../../packages/MainUI/components/ProcessModal/Custom/GenericWarehouseProcess/useWarehousePlugin.ts))
purely to detect a "warehouse process" (its `onLoad` returns `{ type: "warehouseProcess", … }` and
the modal then renders `GenericWarehouseProcess` instead of the parameter form), and a second time by
`ProcessDefinitionModal` ([ProcessDefinitionModal.tsx](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx))
to populate the normal form's dynamic parameters/defaults. The detection path uses a **reduced
context** (`callAction`, `fetchDatasource`, `OB`, `fetch` only).

Preferred fix: **evaluate `onLoad` once with the full script context and share the result** between
the warehouse-detection branch and the normal form branch. Acceptable alternative: detect warehouse
processes by a **declarative marker** (an AD flag / field) so non-warehouse processes never enter the
detection path at all.

**Objective / why.** A normal process (e.g. Add Payment) currently runs its `onLoad` an extra time in
a crippled sandbox just to conclude "not a warehouse process", which: (a) **duplicates side effects**
(dialogs from §4.6, datasource calls), and (b) **logs a spurious `[useWarehousePlugin] onLoad
evaluation failed` error on every open** for any `onLoad` that uses capabilities absent from the
reduced context (`confirm`/`warn`/`say`, `callDatasource`, `callServlet`, `Metadata`, …). A single
full-context evaluation removes both the wasted execution and the false-error noise.

**How to test.** (1) Attach an `onLoad` that calls `say("opened")` (or `await confirm(...)`) to a
normal process and open it — the dialog must appear **once** and the console must show **no**
`[useWarehousePlugin] onLoad evaluation failed`. (2) Open an actual warehouse process and confirm it
still renders `GenericWarehouseProcess` (detection unbroken). (3) Confirm a normal process still gets
its `onLoad`-populated defaults. (4) Unit-test that the shared evaluation runs `onLoad` exactly once
(spy on `executeStringFunction`).

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

1. **`dist.js` bundle processes** from inventory §7 — **RESOLVED (out of scope by nature)**.

   **Original concern.** 12 processes (8 `ETAWIM_*` + 3 `ETCRM_*` + 1 `OBWPACK_CompletePackingHeader`)
   were flagged in inventory §7 because their JS lived only inside a per-module minified `dist.js`
   bundle (`com.etendoerp.advanced.warehouse.management/dist.js`,
   `com.etendoerp.crm/dist.js`), not in a readable classic `.js` file. The pending question was
   whether the source was recoverable so the §4 surface scan could be run and the capability set
   confirmed.

   **Investigation outcome.** Source-recovery investigation confirmed:
   - `org.openbravo.warehouse.packing` (1 process — `OBWPACK_CompletePackingHeader`) has its
     full source available locally; this process moves to the standard self-contained migration
     regime alongside the 21 files of §9.5. It is **removed from §9.1 scope** and treated as
     part of the normal in-scope set.
   - For the other 11 processes (`ETAWIM_*` + `ETCRM_*`), the upstream source repositories
     (`bitbucket.org:koodu_software/com.etendoerp.advanced.warehouse.management.git`,
     `bitbucket.org:koodu_software/com.etendoerp.crm.git`) were inspected and **confirmed to
     ship only the same `dist.js` artifact** that lives under
     `/erp/WebContent/web/com.etendoerp.{advanced.warehouse.management,crm}/dist.js` — byte-for-byte
     identical. No human-readable source is distributed.

   **Critical finding — these are not classic JS processes.** Inspection of the bundle head
   reveals the bundle is **React Native mobile-app code**, not classic SmartClient / `OB.*` JS:

   ```js
   // dist.js head (both bundles)
   Object.defineProperty(exports, '__esModule', { value: true });
   var React = require('react');
   var stack = require('@react-navigation/stack');
   var i18n = require('i18n-js');
   var dateFns = require('date-fns');
   var etendoUiLibrary = require('etendo-ui-library');
   var reactNative = require('react-native');
   ```

   Inline base64 source maps are embedded (`//# sourceMappingURL=data:application/json;base64,...`)
   so the original code is technically recoverable, but the recovered code is React Native — not
   classic JS.

   **Implication.** The 11 processes appear in `OBUIAPP_PROCESS` because Etendo's mobile module
   registers its action handlers through the classic Defined Process metadata system to reuse the
   server-side infrastructure (Java `ActionHandler`, permissions, configuration). The **frontend
   side** of these processes, however, lives entirely inside a **separate Etendo mobile
   application**, not in classic SmartClient UI and not in the new Next.js UI. There is no
   "classic JS" to migrate, because there was never a classic UI representation of these
   processes — only the mobile RN one.

   **Decision.** The 11 `ETAWIM_*` + `ETCRM_*` processes are **out of scope of ETP-3748
   definitively**, not deferred. They are removed from the in-scope set of inventory §6
   (effective scope becomes 26 processes / 22 classic JS files, since `OBWPACK_CompletePackingHeader`
   stays in scope and the other 11 leave it). Concretely:

   - **ETP-3748 mission is**: provide full classic-JS-support in the new Next.js process modal.
   - **These 11 processes do not have classic JS**: they have React Native components that run in
     a different application stack.
   - **The §4 capability set does not apply** to React Native code — RN uses none of the surfaces
     defined in §4.1–§4.13 (`view.theForm`, `view.messageBar`, `OB.RemoteCallManager`,
     `isc.ClassFactory`, embedded SmartClient grid, etc.).
   - **A future migration of the mobile UI to the new web UI**, if ever pursued, would be a
     separate epic with its own design, its own capability matrix, and its own staging — not a
     continuation of ETP-3748. That work is not scoped here and is not blocking.

   **Per-process feasibility matrix update.** The §6 feasibility matrix retains the row labels
   for these 11 processes for historical reference but marks them as **OUT-OF-SCOPE (mobile RN)**
   in a dedicated column value, distinct from YES / WITH-X / NO. The reduced scope (26 processes
   = original 37 minus 11 RN-only) is the authoritative working set for ETP-3748 priority order
   in §7.

   **Confirmation reference.** The bundle head signature
   (`@react-navigation/stack` + `react-native` + `etendo-ui-library` requires) is the proof the
   code is React Native. Anyone questioning the resolution should re-inspect those imports;
   they are unambiguous. The source-availability negative result was confirmed by direct
   comparison: each `dist.js` shipped in `/erp/WebContent/web/` is byte-identical to the
   `dist.js` in its module's upstream Bitbucket repo.
2. **`processRecords.js`-shared family** (5 processes: Create Inverse Invoice/Order, Process
   Orders / Shipment / Invoices) — **RESOLVED**.
   - **Decision:** clone the migrated JS into each of the 5 process rows. No shared-loading
     mechanism (extra metadata table, builder-side concatenation, client-side scope composition)
     will be introduced, and **no canonical copy will be maintained in the `/client` repo**.
     Each process owns its own self-contained copy of the relevant subset of `processRecords.js`
     in its `em_etmeta_*` columns.
   - **Rationale:** N=5 is small and bounded; these processes are legacy in migration mode, not
     in active development, and the historical change rate of `processRecords.js` is near zero.
     Introducing a shared-module mechanism is disproportionate to the problem size, and the
     decision is reversible — a shared mechanism can be retrofitted later without rework of the
     cloned code. Per-process self-containment also keeps blast-radius narrow: a bug in one
     copy does not silently break the other four, and debugging a process only requires reading
     that process's own metadata.
   - **Trade-off acknowledged:** any future fix to the shared logic must be applied 5 times
     manually. This cost is accepted in exchange for zero architectural change. The 5 affected
     process ids are listed in inventory §6 row "Process Records family"; that list is the
     authoritative reference if a future fix needs to be propagated.
3. **`ob-onchange-functions.js` partial migration** — **RESOLVED**.
   - **Decision:** migrate **only the code that is actually used** by an in-scope process. For
     `ob-onchange-functions.js` that means only the `OB.OnChange.agingProcessDefinition*` entries
     identified in inventory §6. The remaining exports of the file are not migrated.
   - **Generalized rule for the whole migration:** dead code is not migrated. If a function,
     branch, or helper is reachable from no in-scope hook (onLoad / onProcess / onRefresh /
     onChange / onGridLoad of any of the 37 processes), it stays out. This applies file-by-file,
     not just to `ob-onchange-functions.js`.
   - **Confidence requirement:** before dropping any block, confirm it is unreachable from the
     in-scope set via static reference search (`grep` for the symbol across the classic JS tree
     and across the 37 process bodies). If a symbol is referenced from outside the in-scope set
     only, it is out-of-scope by definition and safe to drop. If reachability is ambiguous, the
     default is to migrate the block (be conservative when in doubt).
   - **Rationale:** the goal of ETP-3748 is 100% behavioural reproduction of the **in-scope**
     processes, not a 1:1 port of every legacy file. Dead code adds maintenance surface, bloats
     the `em_etmeta_*` columns, and obscures the active logic during code review.
4. **HTML sanitization policy for `view.messageBar.setMessage`** — **RESOLVED**.
   - **Decision:** sanitize the `text` argument with **DOMPurify** under a strict allowlist, and
     extend the `setMessage` signature with a structured `actions` parameter for any clickable
     affordance. The classic `<a href="#" onclick="...">` pattern is **not** carried over.
   - **Sanitizer configuration (immutable, defined once):**
     - `ALLOWED_TAGS`: `b`, `i`, `em`, `strong`, `br`, `span`, `p`, `ul`, `ol`, `li`, `code`
       (formatting only — **no `<a>`, no `<script>`, no `<iframe>`, no `<form>`, no inputs**).
     - `ALLOWED_ATTR`: `class` only.
     - `FORBID_ATTR`: `style`, `srcdoc`, `formaction`, every `on*` event handler attribute.
     - `ALLOWED_URI_REGEXP`: `^(https?|mailto):` (defense in depth; with `<a>` forbidden no
       URI attribute should reach the sanitizer, but this guards against future allowlist relaxation).
   - **Final `setMessage` signature:**
     ```ts
     view.messageBar.setMessage(
       severity: 'info' | 'success' | 'warning' | 'error',
       title: string | null,
       text: string,                          // sanitized HTML, formatting tags only
       actions?: Array<{ label: string; onClick: () => void }>
     ): void;
     ```
     Actions render as real React buttons inside the banner; `onClick` is a closure in the
     migrated script's lexical scope (§4.13), not a `new Function(...)`-compiled string.
   - **Migration rule for classic inline-onclick links:** rewrite as an `actions` entry. The
     Match Statement "never show again" anchor is the canonical example and is covered by this
     rewrite (see §4.7).
   - **Rationale:** the only motivation for `<a>` + inline `onclick` in classic was to attach a
     clickable handler to message text; the structured `actions` parameter covers that 100%
     without HTML rendering of links, eliminates `javascript:`-URL and tabnabbing surface, and
     keeps the click handler in a real React closure with access to `view`, `form`, `OB.*` and
     the module-scope helpers. Allowlist sanitization on `text` covers the *formatting* use
     case (`<b>`, `<br>`, etc.) without exposing the script-execution surface. The two concerns
     are decoupled.
   - **Dependency cost:** one new client-side dependency (`dompurify`, ~20 kB gzipped, widely
     audited, no transitive dependencies). Wrap in a single helper exposing only the locked
     config; do not let migrated scripts call the sanitizer with custom options.
   - **Cross-reference:** the full signature, lifecycle, and React banner component are
     specified in §4.7. The §4.7 surface description must be kept in sync with this decision.
5. **`OB.<Module>.<Process>` namespace globals vs per-modal scope** — **RESOLVED**.
   - **Decision:** no architectural support for cross-process global namespaces will be added.
     Each process is migrated into its own per-modal scope (§4.13 shared module scope per-process
     is the unit of sharing). Helpers shared across files of the same conceptual cluster are
     duplicated into each member of the cluster, not loaded once via a global mechanism.
   - **Evidence (empirical, full scan of the 33 in-scope files persisted at
     `/tmp/namespace-coupling-report.md`):**
     - **21 of 33 files (64%) are completely self-contained** — declare their own namespace,
       define all their methods, call only those methods internally. Zero cross-file edges.
     - **3 namespace-sharing clusters** exist, covering 9 files total:
       - **ETFRA** — 4 files (`etfra-onchange.js`, `etfra-showDatesFields.js`,
         `etfra-showHideDimensions.js`, `etfra-showHideDocumentNo.js`), 6 edges.
       - **OBFBPS** — 2 files (`ob-obfbps-addpayments.js`, `ob-obfbps-addinvoices.js`), 1 edge.
       - **REM** — 2 files (`ob-rem-utilities.js`, `rem_addinvandord_utilities.js`), 1 edge.
     - **Total cross-file edges: 8.** **Cross-file method calls: 0.** All 8 edges are
       references to the namespace *object* (the `OB.<NS> = OB.<NS> || {}` extension pattern),
       not actual function invocations from one file to another. The "sharing" in classic is
       conventional (multiple files extending the same global object because classic loaded
       them all globally), not functional (no file depends on another file's *function* to run).
   - **Migration strategy per category:**
     - **The 21 self-contained files:** straight clone into each process's own
       `em_etmeta_payscript_logic`. No coordination needed.
     - **The 3 clusters (ETFRA / OBFBPS / REM):** the unified helper set of the cluster is
       copied into each member process's `em_etmeta_payscript_logic`. Same per-process
       self-containment as the 21, applied at cluster granularity. One canonical merged body
       per cluster, manually replicated to each member row. Net: 3 one-time merges, then the
       same per-process clone discipline as §9.2.
   - **Rationale:** a global-helpers mechanism (new metadata table, runtime resolver, scope
     composition) would require backend + frontend architectural change to solve a problem
     whose real shape is 3 small clusters with **0 functional dependencies**. The 8 reported
     edges collapse to "different files extend the same namespace object" — a pattern that
     ceases to exist the moment each process is in its own scope, because each migrated
     process can simply own the merged code outright. The migration becomes simpler, not
     harder, by dropping the classic global-loading assumption entirely.
   - **Trade-off acknowledged:** identical to §9.2 — future fixes to a cluster's shared logic
     must be applied to N member rows. For these 3 clusters that means at most 4
     duplications (ETFRA). Accepted in exchange for zero architectural change. The 3 cluster
     memberships above are the authoritative reference if a future fix needs to propagate.
   - **Confirmation rule (no further investigation needed):** the report at
     `/tmp/namespace-coupling-report.md` is the final coupling census for the 33 in-scope
     files. New in-scope additions (e.g. if §9.1 `dist.js` un-minification surfaces new files)
     must be re-scanned with the same procedure to confirm they fit either the "self-contained"
     or "small cluster" category before the clone-on-migration default applies.
6. **PayScript DSL vs JS-module-body dispatch on `etmetaPayscriptLogic`** — **RESOLVED**.

   **Constraint:** the four process rows that already ship `em_etmeta_payscript_logic` content
   in production (Pick Goods Shipments, Create Packing Header, Select Payments PE, Assign)
   must keep working **without content modification**. The detection rule is designed around
   that constraint.

   **Current shipped content shapes (from dataset XML scan):**

   | Process | Module | First chars of body | Shape |
   |---|---|---|---|
   | Pick Goods Shipments | `org.openbravo.warehouse.packing` | `({ onScan: async ... })` | Handler-registry object expression |
   | Create Packing Header | `org.openbravo.warehouse.packing` | `({ onScan: async ... })` | Handler-registry object expression |
   | Select Payments PE | `org.openbravo.module.remittance` | `{ id: "...", compute: ... }` | Declarative rule object |
   | Assign | `org.openbravo.warehouse.pickinglist` | `{ id: "...", compute: ... }` | Declarative rule object |

   All four begin with `{` or `(` — they are **expressions evaluating to an object**, which is
   the structural invariant of PayScript DSL. A JS module body (the §4.13 use case) begins
   with **declarations or statements** (`const`, `let`, `var`, `function`, `class`, `import`,
   `"use strict"`, etc.), never with `{` or `(` as the first significant token.

   **Decision — two-tier classifier:**

   1. **Tier 1 — Explicit marker (opt-in, no ambiguity).** If the first non-blank, non-comment
      line of the body is one of:
      - `// @payscript` or `/* @payscript */` → classify as **PayScript DSL**
      - `// @module-scope` or `/* @module-scope */` → classify as **JS module body**

      The marker takes precedence over the structural rule. Authors who want unambiguous
      classification (or tooling that parses the column) use the marker; everyone else relies
      on Tier 2.

   2. **Tier 2 — Structural fallback (default, classifies existing content).** Strip leading
      whitespace and leading line/block comments. Look at the first remaining significant
      character:
      - `{` or `(` → **PayScript DSL** (expression form returning a config object).
      - Anything else → **JS module body** (declarations / statements).

   **Validation after classification:**
   - **DSL path:** evaluate the body via `new Function("return " + body)()`. If the result is
     not a non-null object, raise a clear modal-open-time error pointing to §4.13:
     *"em_etmeta_payscript_logic classified as PayScript DSL but did not evaluate to an
     object. Add `// @module-scope` if this is a JS module body."*
   - **Module path:** evaluate the body via `new Function(body)()` inside the shared §4.13
     lexical scope. Helpers declared inside become visible to the five hook bodies (onLoad,
     onProcess, onRefresh, onChange, onGridLoad) compiled within the same scope. Runtime
     errors surface at hook invocation time, like any other migrated JS.

   **Impact on existing data — zero content modification required:**

   | Existing process | Starts with | Tier 2 classifies as | Modification needed |
   |---|---|---|---|
   | Pick Goods Shipments | `(` | DSL | **None** |
   | Create Packing Header | `(` | DSL | **None** |
   | Select Payments PE | `{` | DSL | **None** |
   | Assign | `{` | DSL | **None** |

   All four continue to work under the new classifier without any change to their shipped
   dataset XML. Recommended (not required) post-resolution hygiene: add a `// @payscript`
   marker as the first line of each of the four existing bodies, to make the classification
   explicit and forward-compatible with future Tier-2 rule adjustments. The marker can be
   shipped as a follow-up patch to each respective module's `OBUIAPP_PROCESS.xml`.

   **Known edge cases (and their resolution):**
   - **Module body with `"use strict"` directive:** starts with `"` → Tier 2 → module body. ✅
   - **Module body with leading header comment:** comment is skipped before Tier 2 inspection → first significant char is the next declaration → module body. ✅
   - **DSL written as an IIFE-style arrow returning an object** (e.g. `(() => ({...}))()`):
     starts with `(` → Tier 2 → DSL → evaluates → object → passes validation. ✅
   - **Module body that begins with a parenthesized expression** (e.g. an IIFE
     `(function(){...})();` followed by declarations): starts with `(` → Tier 2 misclassifies
     as DSL. **Resolution:** author must use the explicit `// @module-scope` marker. This
     case is documented as the one scenario where Tier 1 is required; in practice migrated
     module bodies start with `const`/`let`/`function` declarations, not IIFEs, so the case
     is rare.

   **Backend requirement.** None. The column already exists and is already serialized verbatim by
   `ProcessDefinitionBuilder`. The classifier runs entirely on the client.

   **Cross-reference:** §4.13 defines the lexical scope semantics for the module-body path.
   §9.6 (this section) defines only the discrimination rule; the scope-sharing contract
   between the body and the five hook columns lives in §4.13 and must stay in sync with
   any future change to this classifier.
