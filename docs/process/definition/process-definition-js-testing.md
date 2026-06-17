# Defined Processes with legacy JavaScript — migration scope inventory

> **Goal:** measure the *scope* of migrating the legacy JavaScript of "Defined Processes" to the
> new UI (`/client`). This document is an **inventory only**; it migrates nothing.
>
> **Analysis date:** 2026-05-27 · **Source of truth:** `etendodev` database (`obuiapp_process`
> table), not the workspace XML data dumps.

---

## 1. Introduction

In Etendo Classic, a **Defined Process** (a row of the `obuiapp_process` table, shown in a
"Pick & Execute" modal or as an action) may carry custom client-side logic written in JavaScript
files. That logic:

- uses **SmartClient** (`isc.*`), a framework the new UI does not use;
- manipulates **DOM** sections that do not exist in the new UI;
- is injected as a **static resource** at classic-UI startup (registered by `ComponentProvider`
  classes), which is not replicable in Next.js.

Therefore this logic **cannot be reused** and must be rewritten. Before planning that rewrite we
need to know **how many** processes carry it and **where** each file lives.

The migration target (detailed in §4) is six columns the `com.etendoerp.metadata` module added
to the metadata tables: four on `obuiapp_process` (`em_etmeta_onload`, `em_etmeta_onprocess`,
`em_etmeta_on_refresh`, `em_etmeta_payscript_logic`) and two on `obuiapp_parameter`
(`em_etmeta_on_parameter_change`, `em_etmeta_on_grid_load`).

> **Migration architecture & playbook:** the platform capabilities, the classic→new equivalence
> table, and the bare-arrow-function contract used to migrate each process live in
> [`new-javascript-code.md`](./new-javascript-code.md). This document remains the inventory and the
> authority on *what* to migrate and test; the `status` column in §6 tracks each process through the
> `pending → migrated → qa-passed` lifecycle.

---

## 2. Methodology and data source

The database holds **241** defined processes. The workspace XML data dumps only cover ~88 (the
modules whose source is present in this checkout); the database includes 153 more, from installed
modules without local source. **This inventory is therefore built from the database**, not the
XML.

The columns store **function names** (e.g. `OB.APRM.AddPayment.onLoad`), not paths. The `.js`
file is located by searching the function namespace across the repository's `.js` files. Module
source paths (`modules_core/…`, `modules/…`, `web/js/…`) are preferred; when a module is not
checked out as source, the deployed copy under `WebContent/web/…` is reported.

---

## 3. Scope definition

**In scope:** JavaScript that **intentionally and specifically** modifies a concrete Defined
Process.

**Out of scope:** JavaScript that affects processes **intrinsically or globally** without
targeting a specific one (generic UI overrides, framework utilities, window/tab event handlers).

Three **declarative signals** capture it (their union):

| # | Signal | Mechanism |
|---|---|---|
| 1 | **Metadata columns** | `obuiapp_process`: `on_load_function`, `clientsidevalidation`, `on_refresh_function`; `obuiapp_parameter`: `onchangefunction`, `ongridloadfunction` |
| 2 | **Action-type parameter** | a parameter whose value references an action registered in JS via `OB.Utilities.Action.set('<name>', …)` — process-specific actions only |
| 3 | **Hardcoded `processId`** | a `.js` file containing a 32-hex id matching an `obuiapp_process_id` |

Detected exclusions → see §8.

---

## 4. The five JavaScript hook points

Before discussing the inventory, this section explains **what each of the five DB columns
actually does at runtime** in the classic UI, so the migration target on the new UI (Next.js)
can be planned with the right semantics. Three columns live on the process itself
(`obuiapp_process`); two live on each parameter (`obuiapp_parameter`).

Across all five, the stored value is a **JavaScript namespace** (e.g. `OB.APRM.AddPayment.onLoad`).
The classic UI resolves that namespace at runtime against the global `OB.*` object built from the
files registered by `ComponentProvider`. The function is then invoked with a well-defined argument
list that depends on the hook (see below).

The new-UI counterpart is **six fields** added by the `com.etendoerp.metadata` module: one
direct migration target per classic hook (§4.1–4.2) plus a sixth field on the process
(`em_etmeta_payscript_logic`) for the **shared module body** — helpers, constants and state
that all hooks reference (§4.3).

### 4.1 Process level — `obuiapp_process`

#### `on_load_function` — modal opening
Runs **once, when the process modal/dialog opens**, after the parameter widgets have been built
but before the user can interact with them. Its job is to **initialize the dialog**: set defaults
that depend on the calling context (selected record, current role, organisation, system date),
pre-populate grids, hide/show or enable/disable parameters that don't apply to this context, and
load any reference data the user will need.

Typical signature: `OB.<Module>.<Process>.onLoad(view)`, where `view` is the process view object
(holds the parameter inputs, the parent record, and helpers to mutate them). Side effects are
performed against `view` (e.g. `view.theForm.getItem('<param>').setValue(...)`). Return value is
not used to gate anything; the dialog opens regardless.

Migration target: **`em_etmeta_onload`**.

#### `clientsidevalidation` — pre-submit validation
Runs **when the user clicks "Done"/"OK"** to submit the process, **before** the server call.
Its job is to **decide whether the submission proceeds**: validate cross-parameter business rules
(e.g. "amount cannot exceed pending"), check selected grid rows, optionally show confirmations or
error messages. If validation fails it must **abort the submission**.

Typical signature: `OB.<Module>.<Process>.onProcess(view, actionHandler)` (the exact name varies).
The function returns `false` (or invokes a "stop" callback) to cancel; `true`/no return means
"proceed and call the server-side process". This is the last hook before the request leaves the
browser, so it is also used for last-mile transformations of the payload.

Migration target: **`em_etmeta_onprocess`**.

#### `on_refresh_function` — re-render / re-evaluation
Runs when the process view is **re-evaluated** after its initial load — typically after a
significant change that forces a recomputation of derived state across multiple parameters at
once (rather than the single-field reaction that `onchangefunction` covers). In practice it is
used much less than the other two hooks and many processes leave it empty.

Typical signature: `OB.<Module>.<Process>.onRefresh(view)`. Side effects on `view`; return value
not used to gate.

Migration target: **`em_etmeta_on_refresh`** — a process-level field added to `obuiapp_process`
by the `com.etendoerp.metadata` module, sibling of `em_etmeta_onload` and `em_etmeta_onprocess`.
A dedicated column is preferred over collapsing this hook into the shared body, both for symmetry
with the classic schema and to keep the migration mapping mechanically 1:1.

### 4.2 Parameter level — `obuiapp_parameter`

These two columns exist **per parameter** of a given process. They are the channel through which
"changing field A reacts on field B" is expressed declaratively in metadata. The same process
can declare many of them (e.g. `AddPayment` has 16 parameters with `onchangefunction` /
`ongridloadfunction`, all pointing into the shared file `ob-aprm-addPayment.js`).

#### `onchangefunction` — parameter value changed
Fires **when the user changes the value of that specific parameter** in the process modal
(analogous to a form field's `onChange`). Its job is to **react to that single change**: update
dependent parameters (recompute a total, refresh a selector's filter, toggle visibility/enabled),
cascade defaults, fetch related data, etc.

Typical signature: `OB.<Module>.<Process>.<paramHandler>(item, view, form, grid, editRow)` —
classic SmartClient form callback. The handler receives the changed item plus enough context
to read other parameters and write to them.

This is **where most of the per-parameter business logic lives**, and is the reason the
parameter-level columns dominate by count (23 out of the 31 column-signal processes).

Migration target: **`em_etmeta_on_parameter_change`** — a parameter-level field already added to
`obuiapp_parameter` by the `com.etendoerp.metadata` module. Each parameter carries its own
script; shared helpers continue to live in the process-level `em_etmeta_payscript_logic`.

#### `ongridloadfunction` — grid rows loaded
Applies to parameters whose UI is a **grid** (a tabular selector with multiple rows, as in
"select invoices to pay"). Runs **each time the grid loads (or reloads) its rows**, before
they are shown to the user.

Its job is to **decorate/transform the loaded rows** before display: format cells, compute
derived columns (e.g. a "payment amount" column initialised from "pending amount"), set
row-level visual state (read-only, highlighted), or pre-select rows according to a rule.

Typical signature: `OB.<Module>.<Process>.<paramHandler>(grid, view, parameters)` where `grid`
is the SmartClient grid widget.

Migration target: **`em_etmeta_on_grid_load`** — a parameter-level field already added to
`obuiapp_parameter` by the `com.etendoerp.metadata` module (sibling of
`em_etmeta_on_parameter_change`).

### 4.3 The shared module body — `em_etmeta_payscript_logic`

The five hooks above are **entry points**, not the whole logic. In the classic UI, every process
file mixes those entry points with **internal helpers, constants, and module-level state** that
the hooks call into. A representative case is `ob-aprm-addPayment.js` (1,935 lines, 53 top-level
declarations under `OB.APRM.AddPayment.*`): only ~18 of those declarations are metadata-referenced
entry points; the remaining ~35 are helpers such as `updateTotal`, `distributeAmount`,
`getConvertedAmount`, `tryToUpdateActualExpected`, `applyBankAmountToConverted`, each invoked from
several hooks. None of them fits inside any one hook field.

**`em_etmeta_payscript_logic`** (process-level, on `obuiapp_process`) is the home for that
**shared module body**. Its concrete role on the new UI is:

- **Shared helpers** invoked by multiple hooks of the same process (e.g. `updateTotal` called by
  three different `onChange` handlers).
- **Module-level constants and lookups** (status codes, conversion tables) loaded once and read
  by many hooks.
- **Closure-scoped state** that must persist across hook invocations within the same dialog
  session (caches, "already-warned" flags, debouncers).
- **Type-like definitions** the hooks rely on (small classes/objects encapsulating computations).

What it is **not**: it is not "all the process code". The five hook fields carry the entry
points; `payscript_logic` carries the shared infrastructure they reference. For trivial processes
with a single hook and no internal helpers (most of the **9 easy** processes in §6) this field
can stay **NULL**. For the **4 hard** and most of the **medium** processes — where 50%+ of the
file's lines are shared helpers — populating this field is essential; otherwise the helpers
would have to be duplicated across every hook that uses them, defeating the migration.

The runtime contract is straightforward: the new-UI process runner evaluates `payscript_logic`
once into a module scope, then compiles each hook field as a function within that same scope,
so hooks can reference helpers by bare name (no global pollution, no duplication).

### 4.4 Why two levels exist

The two-level layout is **deliberate**, not an accident of history. The process-level hooks
describe the **lifecycle of the dialog as a whole** (open, submit, refresh); the parameter-level
hooks describe **reactive bindings between fields** (change of A affects B). A single process
can therefore combine an `onLoad` (initialise the dialog) with multiple `onchangefunction`
handlers (react to each field) without those concerns leaking into each other.

In the classic UI, all hooks of a given process typically point into the **same `.js` file**
(a shared namespace like `OB.APRM.AddPayment.*`), which acts as a module of related handlers
sharing helpers and local state. That file-level cohesion is what the migration must preserve:
splitting one process across many disconnected scripts in the new UI would break the shared
helpers and make the logic much harder to read. The full migration target reproduces this layout
faithfully:

| Classic column | New-UI field | Table | Role |
|---|---|---|---|
| `on_load_function` | `em_etmeta_onload` | `obuiapp_process` | Lifecycle: open |
| `clientsidevalidation` | `em_etmeta_onprocess` | `obuiapp_process` | Lifecycle: submit |
| `on_refresh_function` | `em_etmeta_on_refresh` | `obuiapp_process` | Lifecycle: re-evaluate |
| `onchangefunction` | `em_etmeta_on_parameter_change` | `obuiapp_parameter` | Reactive: value changed |
| `ongridloadfunction` | `em_etmeta_on_grid_load` | `obuiapp_parameter` | Reactive: grid rows loaded |
| *(no classic counterpart — shared body)* | `em_etmeta_payscript_logic` | `obuiapp_process` | Shared helpers / constants / module state |

Five hook fields for entry points + one body field for shared infrastructure: the same shape as
the classic single-file module, expressed declaratively in metadata.

---

## 5. Executive summary

| Metric | Value |
|---|---|
| Total defined processes (DB) | **241** |
| With JS to migrate (in scope) | **37** |
| ↳ via signal 1 (columns) | 31 |
| ↳ additional via signal 3 (`processId`) | 6 |
| ↳ with an extra file via signal 2 (action) | 1 (Etendo Payment Execution → `payment-action-popup.js`) |
| Without process JS | 204 |
| Processes inside a `dist.js` bundle (to review, §7) | ~12 (warehouse mgmt / CRM) |
| Distinct `.js` files to migrate (high confidence) | 33 |
| Total legacy JS to migrate (distinct files) | **~7,600 lines · ~250 KB** |
| Largest files | `ob-aprm-addPayment.js` (1,935 lines), `OBWPACK_PackingComponent.js` (1,033), `OBWPL_ValidateComponent.js` (714) |
| Difficulty distribution (by lines) | **8 easy** (<100) · **25 medium** (100–500) · **4 hard** (>500) |

`uipattern` distribution: `OBUIAPP_PickAndExecute` 116 · `A` 89 · `M` 24 ·
`OBUIAPP_Report` 11 · `ETRX_RxAction` 1.

> **Completeness note:** signal 1 has near-perfect precision; signals 2 and 3 extend coverage to
> non-columnar bindings. Processes whose logic lives in minified `dist.js` bundles of recent
> modules are listed separately (§7) and require manual review.

---

## 6. Defined Processes with legacy JS to migrate (37)

`Signal`: 1=columns, 2=action, 3=processId. Paths are relative to `erp/`. "⚠ deploy" = only
available as a deployed copy under `WebContent/web/…` (module source not checked out).

**Difficulty** is a heuristic based on total raw lines of the JS file(s) to migrate:
**easy** < 100 lines · **medium** 100–500 · **hard** > 500. Rows are ordered easiest first;
within a band, smallest first.

Distribution: **8 easy · 25 medium · 4 hard.**

| # | id | name | signal | mechanisms (signal 1) | difficulty | size (lines · KB) | `.js` file(s) | status |
|---|---|---|---|---|---|---|---|---|
| 1 | C044DDAA929E40D780C36154FBB968F7 | Create Invoices from Orders | 1 | `onchangefunction` ×1 | easy | 15 · 0.6 KB | `modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/createFromOrders.js` | migrated |
| 2 | 31ED9333E46C419D92E9F1B10F821B91 | Clone | 3 |  | easy | 25 · 1.2 KB | `modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/ob-clone-record.js` | invalid |
| 3 | 71E00A0E964E43AE81C5AFBCDCA5F87C | Valued Stock Report | 1 | `onchangefunction` ×1 | easy | 27 · 0.7 KB | `modules_core/com.etendoerp.reportvaluationstock/web/com.etendoerp.reportvaluationstock/js/etrvs-onchange.js` | migrated |
| 4 | B57A0126F38B428F936FA2B52186EB97 | Consulta de Facturas en Verifactu | 1 | `onchangefunction` ×2 | easy | 41 · 1.0 KB | `WebContent/web/com.etendoerp.verifactu/js/etvfac-organization-info.js` ⚠ deploy | migrated |
| 5 | 45ED6D0400FD42BEA9771C549A9AE8AB | Validate Costing Rule | 1 | `on_load_function`, `clientsidevalidation` | easy | 47 · 1.9 KB | `web/js/validateCostingRuleProcess.js` | migrated |
| 6 | CC73C4845CDC487395804946EACB225F | Funds Transfer | 1 | `on_load_function`, `onchangefunction` ×1 | easy | 49 · 1.9 KB | `…/org.openbravo.advpaymentmngt/js/ob-aprm-fundsTransfer.js` | migrated |
| 7 | 20D69FFD251A481BA75F33538EDFCF76 | VAT Regularization | 1 | `on_load_function`, `ongridloadfunction` ×1 | easy | 57 · 2.0 KB | `WebContent/web/com.etendoerp.vat.regularization/js/etvatr_regularization_utilities.js` ⚠ deploy | migrated |
| 8 | B5C942145F354ABEBC9F16235D80D776 | Set New Currency | 1 | `on_load_function`, `clientsidevalidation` | easy | 64 · 2.8 KB | `web/js/checkAvailableCredit.js` | migrated |
| 9 | 154CB4F9274A479CB38A285E16984539 | Find Transactions to Match | 1,3 | `clientsidevalidation` | medium | 106 · 3.6 KB | `…/org.openbravo.advpaymentmngt/js/ob-aprm-findTransaction.js` | migrated |
| 10 | C88AB6CBA1694000AFF5706A31B08AE1 | Select Payments Pick and Edit | 1 | `ongridloadfunction` ×1 | medium | 112 · 3.9 KB ³ | `WebContent/web/org.openbravo.module.remittance/js/ob-rem-utilities.js` ⚠ deploy ³ | migrated |
| 11 | EB4C4053F3B94A17A08D1DD7E89CEB7E | Aging Balance Process Definition for Payables | 1 | `onchangefunction` ×5 | medium | 117 · 4.3 KB | `modules_core/org.openbravo.client.application/web/…/js/utilities/ob-onchange-functions.js` ¹ | migrated |
| 12 | 0D37A9F6109549DEB058373EF2DAEB6A | Aging Balance Process Definition for Receivables | 1 | `onchangefunction` ×5 | medium | 117 · 4.3 KB | `…/js/utilities/ob-onchange-functions.js` ¹ | migrated |
| 13 | AB2EFCAABB7B4EC0A9B30CFB82963FB6 | Create Lines From Order | 1 | `on_load_function` | medium | 119 · 3.7 KB | `modules_core/org.openbravo.client.application/web/…/js/procurement/ob-procurement.js` | migrated |
| 14 | D37588FFC6264BED91FA7611DBFFC679 | Balance Sheet and P&L Structure advanced | 1 | `onchangefunction` ×1 | medium | 124 · 4.2 KB (4 files) | `WebContent/web/com.etendoerp.financial.reports.advanced/js/etfra-*.js` ⚠ deploy ² | migrated |
| 15 | 56E951BB13A44AFBB642291081613E46 | General Ledger Report Advanced | 1 | `onchangefunction` ×1 | medium | 124 · 4.2 KB (4 files) | `…/financial.reports.advanced/js/etfra-*.js` ⚠ deploy ² | migrated |
| 16 | 636EF6F0F8B64E94A8247930569B98CA | Journal Entries Report Advanced | 1 | `onchangefunction` ×2 | medium | 124 · 4.2 KB (4 files) | `…/financial.reports.advanced/js/etfra-*.js` ⚠ deploy ² | migrated |
| 17 | D8E8015B1478473799E47F84796C481C | Trial Balance | 1 | `onchangefunction` ×1 | medium | 124 · 4.2 KB (4 files) | `…/financial.reports.advanced/js/etfra-*.js` ⚠ deploy ² | migrated |
| 18 | 99E532BA0306450A839F5DE238375238 | Select Invoices and Orders | 1 | `ongridloadfunction` ×1 | medium | 163 · 5.6 KB (2 files) | `WebContent/web/org.openbravo.module.remittance/js/rem_addinvandord_utilities.js` · `ob-rem-utilities.js` ⚠ deploy | migrated |
| 19 | B7B1D4F53D4249C5A10D3AD0865D909F | Manage PickingList Action | 3 |  | medium | 173 · 5.6 KB | `WebContent/web/org.openbravo.warehouse.pickinglist/js/OBWPL_Process.js` ⚠ deploy ⁴ | blocked |
| 20 | 60F1E2DEB1B544908CDD4CF99ACA80EB | Etendo Payment Execution | 1,2 | `onchangefunction` ×2 | medium | 178 · 5.1 KB (2 files) | `modules_core/com.etendoerp.advpaymentmngt/web/com.etendoerp.advpaymentmngt/js/received_in-paid_out-onchange.js` · `…/js/payment-action-popup.js` (signal 2: `EAPM_Popup`) | migrated |
| 21 | A5A9B914DEAF4C16B028C9D8A4F39A6F | Create Inverse document for Invoice | 1 | `on_load_function`, `onchangefunction` ×1 | medium | 192 · 6.6 KB | `modules_core/com.smf.jobs.defaults/web/com.smf.jobs.defaults/processRecords.js` | migrated |
| 22 | B4A21A617AD64137BF8C9A6770F65AD2 | Create Inverse document for Order | 1 | `on_load_function` | medium | 192 · 6.6 KB | `…/com.smf.jobs.defaults/processRecords.js` | migrated ⁵ |
| 23 | 8DF818E471394C01A6546A4AB7F5E529 | Process Orders | 1 | `on_load_function` | medium | 192 · 6.6 KB | `…/com.smf.jobs.defaults/processRecords.js` | migrated ⁵ |
| 24 | 33338B1F2C4F499EBA4F5547BE0B2A4E | Process Shipment | 1 | `on_load_function`, `onchangefunction` ×1 | medium | 192 · 6.6 KB | `…/com.smf.jobs.defaults/processRecords.js` | migrated ⁶ |
| 25 | 272C8D38EF3245BF882E623CE92AB4E7 | Process Invoices | 1 | `on_load_function`, `onchangefunction` ×1 | medium | 192 · 6.6 KB | `…/com.smf.jobs.defaults/processRecords.js` | migrated ⁷ |
| 26 | DF7F70B82C514F639F06495E0B818A53 | Add Credit Payments | 1 | `on_load_function`, `clientsidevalidation`, `ongridloadfunction` ×2 | medium | 205 · 6.3 KB | `WebContent/web/org.openbravo.financial.bpsettlement/js/ob-obfbps-addpayments.js` ⚠ deploy | migrated |
| 27 | C4265E27C8134096B49DFBF69369DFC6 | Service Order Line Relation Pick and Edit | 1 | `on_load_function`, `ongridloadfunction` ×1 | medium | 206 · 10.7 KB | `web/js/productServices.js` | migrated ⁸ |
| 28 | 9C260D0E9C054A6F88AFC8E3B23A0E9A | Add Invoices | 1 | `on_load_function`, `clientsidevalidation`, `ongridloadfunction` ×2 | medium | 215 · 6.5 KB | `WebContent/web/org.openbravo.financial.bpsettlement/js/ob-obfbps-addinvoices.js` ⚠ deploy | migrated |
| 29 | E68790A7B65F4D45AB35E2BAE34C1F39 | Add Transaction | 1 | `on_load_function`, `clientsidevalidation`, `onchangefunction` ×7 | medium | 216 · 6.2 KB | `…/org.openbravo.advpaymentmngt/js/ob-aprm-addTransaction.js` | pending |
| 30 | A832A5DA28FB4BB391BDE883E928DFC5 | Open Close Periods | 3 |  | medium | 256 · 7.4 KB | `web/js/periodControlStatus.js` | component ⁹ |
| 31 | FE3A8C134D41488DB3A69837BD54B56A | Manage Variants | 1 | `ongridloadfunction` ×1 | medium | 322 · 10.9 KB | `web/js/productCharacteristicsProcess.js` | pending |
| 32 | 86F0B1EBE2BC48E3ACF458768D14CC99 | Match Statement | 1 | `on_load_function`, `clientsidevalidation`, `on_refresh_function` | medium | 377 · 11.9 KB | `…/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js` | pending |
| 33 | A2C19D0EF6594D14A64BC62E99A89CC3 | RFC/RTV HQL Pick and Edit Lines | 1 | `on_load_function` | medium | 470 · 14.5 KB | `modules_core/org.openbravo.client.application/web/…/js/return-material/ob-return-material.js` | pending |
| 34 | 50D2EB7B24B44EA39C4735AC51CA8E0A | Validate Barcode Action | 3 |  | hard | 714 · 24.3 KB | `WebContent/web/org.openbravo.warehouse.pickinglist/js/OBWPL_ValidateComponent.js` ⚠ deploy | component |
| 35 | 71DEE8098CE74C939575FF57609952CC | Validate Barcode Action | 3 |  | hard | 1033 · 31.6 KB | `modules/org.openbravo.warehouse.packing/web/org.openbravo.warehouse.packing/js/OBWPACK_PackingComponent.js` | component |
| 36 | 83AD8A78FB1C4EDBB4A222A276498938 | Manage Packing Action | 3 |  | hard | 1201 · 36.9 KB (2 files) | `…/warehouse.packing/js/OBWPACK_PackingComponent.js` · `OBWPACK_Process.js` | component |
| 37 | 9BED7889E1034FE68BD85D5D16857320 | Add Payment | 1 | `on_load_function`, `clientsidevalidation`, `onchangefunction` ×13, `ongridloadfunction` ×3 | hard | 1935 · 63.2 KB | `modules_core/org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js` | pending |

**Notes:**
- ¹ `ob-onchange-functions.js` is a **shared core utilities** file; for Aging Balance only the
  `OB.OnChange.agingProcessDefinition*` functions apply. Migrate only those, not the whole file.
- ² `etfra-*.js` family: `etfra-onchange.js`, `etfra-showDatesFields.js`, `etfra-showHideDimensions.js`,
  `etfra-showHideDocumentNo.js` (shared by the 4 ETFRA reports).
- ³ **File corrected & process `blocked`.** The earlier inventory listed `rem_addinvandord_utilities.js`
  for this process, but that file defines `OB.REM.ProcessPP.*`, which belongs to *Select Invoices and
  Orders* (`99E532BA0306450A839F5DE238375238`). The only hook bound to `C88AB6…` is the **Pick/Edit
  Lines** parameter's `ongridloadfunction = OB.REM.CalculateSelected`, defined in `ob-rem-utilities.js`
  (verified against the `obuiapp_parameter` legacy columns in `etendodev`). Only that one function is in
  scope; the file's other declaration (`OB.REM.CalculateTotal`) is not bound to this process.
  **Migrated 2026-06-11** (see `client/agents/reports/C88AB6CBA1694000AFF5706A31B08AE1.md`): all three
  earlier gaps are now **closed** in the client substrate — `BigDecimal` is injected into every hook
  context, `BigDecimal.prototype.setScale(scale)` exists (`utils/ob/bigDecimal.ts:82-84`, `ROUND_HALF_UP`,
  fixed scale that zero-pads via `toString`), and the `OB` shim now exposes
  `OB.Constants.FIELDSEPARATOR` (`"$"`) / `OB.Constants.IDENTIFIER` (`"_identifier"`)
  (`utils/ob/obShim.ts:85`). The single in-scope hook (the **Pick/Edit Lines** parameter's
  `ongridloadfunction = OB.REM.CalculateSelected`) was ported near line-for-line to
  `em_etmeta_on_grid_load`; all other columns stay empty. Status advances `blocked → migrated`
  (pending manual QA). `OB.REM.CalculateTotal` remains out of scope (no metadata binding for this
  process).
- ⁴ **Scope/binding mismatch — `blocked` 2026-06-11** (see
  `client/agents/reports/B7B1D4F53D4249C5A10D3AD0865D909F.md`). `OBWPL_Process.js` defines
  `OB.OBWPL.Process.*`, the `CLASSNAME` button handlers of six **launcher** processes (Validate
  `40317268…`, Assign and Group `44821BBF…`, Re Assign `C107C380…`, Process `A4008FA0…`, Cancel
  `B6F5DE7C…`, Close `6DA8E27C…`). `B7B1D4F5` ("Manage PickingList Action") is the **backend handler**
  (`ManagePickingListAction`) those launchers POST to; in `etendodev` it has no `em_etmeta_*` columns
  and no parameters. The signal-3 match is only a `RemoteCallManager` *call target* (the UUID literal
  at line 151), not a client-side hook. Nothing of the file belongs in this process's columns; the real
  migration units are the six launcher rows. No capability gap.
- ⁵ **Unblocked & migrated 2026-06-12** (see
  `client/agents/reports/B4A21A617AD64137BF8C9A6770F65AD2.md`). Binds **`OB.Jobs.ProcessOrders.onLoad`**
  (not `ProcessInvoices.onLoad`); its "Document Action" parameter has no `onchangefunction`/`ongridloadfunction`.
  The three blockers (`item.setValueProgrammatically()`, `item.getFirstOptionValue()`,
  `view.okButton.isEnabled()/enable()`) were **implemented** in the client substrate (see the report's
  *Platform changes* and the *Updates* section of `new-javascript-code.md`); `onLoad` was ported to
  `em_etmeta_onload`, all other `em_etmeta_*` columns empty. These capabilities also unblock the rest of
  the `ProcessOrders/ProcessShipment/ProcessInvoices` family (each migrated on its own row).
- ⁶ **Migrated 2026-06-12** (see `client/agents/reports/33338B1F2C4F499EBA4F5547BE0B2A4E.md`). Binds
  **`OB.Jobs.ProcessShipment.onLoad`** on `on_load_function`. Its "Document Action" parameter declares
  `onchangefunction = OB.Jobs.ProcessShipment.onChangeDocumentAction`, but **that function is not defined**
  in `processRecords.js` (only `OB.Jobs.ProcessInvoices.onChangeDocumentAction` exists) — so the binding is
  **dangling** and a no-op in Classic; `em_etmeta_on_parameter_change` is therefore left EMPTY. The same
  family capabilities already added for the ProcessOrders rows
  (`item.setValueProgrammatically()`, `item.getFirstOptionValue()`, `view.okButton.isEnabled()/enable()`)
  cover this hook; `onLoad` was ported to `em_etmeta_onload`, all other `em_etmeta_*` columns empty. Note
  the Classic onLoad only builds `documentStatuses` (never `documentActions`), so the record-action
  pre-selection always falls back to the first option — reproduced faithfully.
- ⁷ **Migrated 2026-06-12** (see `client/agents/reports/272C8D38EF3245BF882E623CE92AB4E7.md`). Binds
  **`OB.Jobs.ProcessInvoices.onLoad`** on `on_load_function` **and** a **real, defined**
  `onchangefunction = OB.Jobs.ProcessInvoices.onChangeDocumentAction` on its "Document Action" parameter
  (unlike the Shipment sibling, whose homonymous binding is dangling). Both hooks are migrated:
  `em_etmeta_onload` ports `ProcessInvoices.onLoad` (handler `ProcessInvoicesDefaults`, `tableId = "318"`,
  and additionally hides `VoidDate`/`VoidAccountingDate`/`POReference` on open), and
  `em_etmeta_on_parameter_change` ports `onChangeDocumentAction` (shows those three fields only when the
  dialog is launched from the Purchase Invoice window `183` and the action is `VO`/`RC`, with `POReference`
  gated on a single-record selection). The same family capabilities already added for the ProcessOrders rows
  (`item.setValueProgrammatically()`, `item.getFirstOptionValue()`) cover the onLoad; this variant has no
  OK-button manipulation. All other `em_etmeta_*` columns left empty.
- ⁸ **Migrated 2026-06-16** (re-evaluated; see `client/agents/reports/C4265E27C8134096B49DFBF69369DFC6.md`,
  §Updates). Previously blocked on the SmartClient **per-toggle** `selectionChanged(record, state)`
  delta, the grid-relative `fireOnPause`, the `activeView` two-tier `getContextInfo` fallback, the
  grid-column field hooks (`orderLinesGridQtyOnChange` / `QuantityValidate` on
  `AD_FIELD_ID = 025D94512BBC49E3A941AB7114C5704E`), and `BigDecimal.multiply`/`setScale`. **All of these
  are now closed by additive substrate capabilities** (verified against `WindowReferenceGrid.tsx`
  `createEmbeddedGridController` / `emitSelectionToggles` / `fireCellEditHooks` /
  `rejectByColumnValidator`, `scriptProxies.ts` `assignGridFireOnPause` / `buildParentWindow`,
  `bigDecimal.ts`): `grid.onSelectionToggle((record, state) => …)`, `grid.fireOnPause`,
  `view.parentWindow.activeView[.parentView].getContextInfo()` (now carrying `inpTabId`),
  `grid.setColumnOnChange('relatedQuantity', …)`, `grid.setColumnValidator('relatedQuantity', …)`, and
  exact `multiply` + `setScale(scale, roundingMode?)`. Migration consolidates into
  `em_etmeta_payscript_logic` (shared helpers) + the **"Pick/Edit Lines"** `em_etmeta_on_grid_load`
  (registers the per-toggle handler and both grid-column hooks, then seeds the totals/service price);
  `em_etmeta_onload` and all other columns stay EMPTY. The classic `deselectRecord(record)` rollback is
  ported as `grid.deselectRecord(grid.getRecordIndex(record))` (the controller resolves by index). ETP-3748's
  `onProcess` pre-submit hook is **not** the unblocker here (no `clientsidevalidation`); the grid-side
  capability set is. Pending manual QA.
- ⁹ **Blocked 2026-06-16** (see `client/agents/reports/A832A5DA28FB4BB391BDE883E928DFC5.md`). Pure
  **signal-3** process: in `etendodev` it has **no** classic hook columns
  (`on_load_function`/`clientsidevalidation`/`on_refresh_function` empty), **no `em_etmeta_*`**, and
  **zero `obuiapp_parameter` rows**; it is launched by two **button** columns (`C_Period.OpenClose`
  `7270DE4F…`, `C_PeriodControl.Open Close` `F27047EF…`). All behavior lives in `OB.OpenClose.openClose`,
  which opens a **bespoke `isc.OBPopup`** (`OpenClosePeriodProcessPopup`) — a hand-built `DynamicForm`
  with one dynamic combo ("Action") seeded by an `ACTION_COMBO` round-trip to `OpenClosePeriodHandler`,
  plus OK/Cancel `OBFormButton`s. The migration target only supports the standard parameter form or a
  custom component from an `onLoad`-returned schema; arbitrary SmartClient widget construction is not in
  the capability catalog, and there is **no hook surface** (no parameters, no hook columns) to attach
  to. The two `PeriodControlStatus_Field`/`PeriodStatus_Field` grid cell renderers are `AD_FIELD.CLIENTCLASS`
  components, out of scope (no `em_etmeta_*` channel). All `em_etmeta_*` columns stay EMPTY until the
  platform documents a custom-component schema for an action-picker dialog (or a list parameter whose
  value map is seeded at open), at which point a parameter would also need to be authored as metadata.
- `processRecords.js` is shared by 5 processes (jobs for invoices/orders/shipment + 2 intercompany).
- **Sizes** are the raw `.js` source (lines · KB). The per-process column repeats shared files, so it
  overcounts; the "Total legacy JS" in §5 (~7,600 lines · ~250 KB) sums **distinct** files once.
  `ob-onchange-functions.js` is counted whole though only its aging functions are in scope.

---

## 7. Processes inside a `dist.js` bundle — manual review required

The process id appears **only** inside a per-module minified bundle
(`com.etendoerp.advanced.warehouse.management/dist.js`, `com.etendoerp.crm/dist.js`), not in an
individual classic `.js` file. These likely belong to a more recent architecture/packaging; each
must be reviewed before deciding whether it belongs to the classic migration scope.

| module | processes (value) |
|---|---|
| Advanced Warehouse and Inventory Management | ETAWIM_ValidateRecordFreshness, ETAWIM_CreateAttributeSetInstance, ETAWIM_CheckBarcode, ETAWIM_GetPreferenceValue, ETAWIM_AdjustInventoryQuantity, ETAWIM_ChangeInventoryStatus, ETAWIM_CompleteInboundReceipt, ETAWIM_ChangeTaskStatus |
| CRM - Lead Management | ETCRM_CompleteCRMTaskWithLeadSync, ETCRM_ChangeTaskStatus, ETCRM_ValidateRecordFreshness |
| Warehouse Packing | OBWPACK_CompletePackingHeader |

---

## 8. Detected scope exclusions

JS files reviewed and **discarded** for not targeting a Defined Process intentionally/specifically:

| file / mechanism | exclusion reason |
|---|---|
| `web/js/cancelAndReplace.js` (`OB.CancelAndReplace.ClientSideEventHandlers*`) | tab/window *Client-Side Event Handler* (`PreSaveUpdate`/`PreDelete`), not a Defined Process |
| `web/js/recalculatePermissionsProcess.js` (`OB.RoleInheritance`) | role-button handler; no declarative binding (column/action/processId) to a process |
| `ob-grid.js`, `ob-layout.js`, `ob-tab.js`, `ob-i18n.js`, widgets, `debugtools`, etc. | generic infrastructure/UI, affects everything, not a specific process |
| Framework actions: `refreshGrid`, `refreshGridParameter`, `showMsgInView`, `showMsgInProcessView`, `OBUIAPP_browseReport`, `OBUIAPP_downloadReport`, `openDirectTab`, `setSelectorValueFromRecord`, `smartclientSay`, `custom` | generic reusable actions, not process-specific |
| Matches under `…/com.etendorx.workspace-ui/.next/…` | build artifacts of the **new UI itself**, not legacy JS |

---

## 9. Full inventory (241 processes)

`JS scope` = **Yes** if the process is in §6. Rows are ordered by module (column omitted for compactness).

| id | name | JS scope |
|---|---|---|
| D1E4EC58B04D4D3FA0060FF28094B39B | Generate Grouped Amortization Plan | No |
| B5A092DD49F24FDF82847A29E1FA926A | Change Customer, Rate and Currency | No |
| 36EB55C6FCC54A45A4A898D818D2C2BD | Adjust Quotation | No |
| 07D9CD2B314E41B5B235613C5C2E3E38 | Create Order From Quotation | No |
| F9C4EF13E5304F81BCF90F190EF31B13 | Modify Payment In Plan | No |
| 287D50AF841D4AE990A6C7E3E6AAA738 | Modify Payment Out Plan | No |
| 46228266084340D2920FA6CCCB6B1BCB | Unvoid | No |
| 951740FA473344958E67876379B62C58 | Process Amortization | No |
| 4329BD7ECB424CECADE112CC82830C19 | Undo Close | No |
| DB90F47C3A7947D39C89BF28A71091FB | Connect to Download Client and Organizacion | No |
| A5A9B914DEAF4C16B028C9D8A4F39A6F | Create Inverse document for Invoice | **Yes** |
| B4A21A617AD64137BF8C9A6770F65AD2 | Create Inverse document for Order | **Yes** |
| 4CE463C04CA0412CAC57EF58FE0F8498 | Add Multiple Payments | No |
| 9BED7889E1034FE68BD85D5D16857320 | Add Payment | **Yes** |
| E68790A7B65F4D45AB35E2BAE34C1F39 | Add Transaction | **Yes** |
| 4EEB3497082C4F2182E16A4371CD5D96 | Modify Payment In Plan | No |
| 8D0D32CC819E449D9A08E0459B482963 | Payment Proposal Pick and Edit Lines | No |
| 154CB4F9274A479CB38A285E16984539 | Find Transactions to Match | **Yes** |
| CC73C4845CDC487395804946EACB225F | Funds Transfer | **Yes** |
| 86F0B1EBE2BC48E3ACF458768D14CC99 | Match Statement | **Yes** |
| 6F87442DF7BC43AB8A666BDED2F7D64E | Modify Payment Out Plan | No |
| 71D7E59A3A604865997604871D540B45 | Process Quality Inspection | No |
| 54BAB25A535C484DA17C61030A991DCF | Adjust Inventory Quantity | No |
| 8E07BD3E686C4088AA192D388E74447D | Change Inventory Status | No |
| F73FF0A5E912481FAA42E85459452A67 | Change Task Status | No |
| 2B385E30B7824262A004A0706F9B6489 | Check Barcode | No |
| 16316C458EFE4C069DC081A9D69EA5B8 | Clear Reference Inventory | No |
| C55CA64A777C4CF795BE5893DD7A0E1E | Complete Inbound Receipt | No |
| 17C53D07D2234B82A359D86BA0AF30F7 | CreateAttributeSetInstance | No |
| 19B7ADFA1E844099A940B4D179EE4062 | Create Lines From Order | No |
| B2A8702313F2460AB41538DF0721E81A | Create Packing Task | No |
| 7889B171DDF04C30B903AE4D07ABF5CD | Create Reference Inventory | No |
| 613B18A1FAEE49CA89A9E4D6ECD23B57 | Generate Locator Barcode | No |
| A0D7236B8EF043BEA40F95B4698B8EAB | Generate Product Barcode | No |
| EE7C26AD2EC14B958EDB86C1ED1E199A | Generate Task | No |
| FF62B6F6A9E442E8A3FF69C8B4AFF416 | Get Available Operator | No |
| 16FACA3B07A641FE8808F5BEF6275D77 | Get Inventory Threshold | No |
| 4179EAAE44A9400BA53DB420DC262B5F | Get Preference Value | No |
| 4C92442317DB4B7E87F7B5CD6B761248 | Inbound Receipt Attribute Validator | No |
| F413F6930C6C425C9032EAAFFFA13887 | Manage Reception Action | No |
| D4BC7BE3AF4D42BFB167A80D2155D9B1 | Relocate Inventory | No |
| 09070FEBBE634441AFA8AD035D88F381 | Validate Record Freshness | No |
| 75343700BE60423F97ED8699AE6168F0 | Validate Reserved Stock | No |
| 7551BC67570D43399228D96B05D6439F | Void Work Effort | No |
| 8575D1B51F534818B4843FD101AA4715 | Protest Remittance | No |
| 5E355E6FDC9F4B868D05AD76C01875C2 | Add Financial Account | No |
| C8C01DD3EEB34C159F0000FC3C864324 | Create Finance Plan | No |
| 8E821B770B1444288410F8A96F232D21 | Create Invoice From Financial Type | No |
| 27BA9260BACA432BAC414ED62DE994E9 | Create Payment From Financial Type | No |
| C16C9A312B854A51A1AAAFDA527D1193 | Update Finance Plan | No |
| 9D487142891545CD9D8C751BA36A463D | Update Financial Account | No |
| D6AB95CE52D34E1599590526115E26C6 | Not Posted Documents | No |
| DF7F70B82C514F639F06495E0B818A53 | Add Credit Payments | **Yes** |
| 9C260D0E9C054A6F88AFC8E3B23A0E9A | Add Invoices | **Yes** |
| EB36A630C87342978D60DAF1C963615E | Cash VAT Manual Settlement P&E | No |
| A5EA2F5C093B4B129425A21528E6C83F | Reactivate Cash VAT Manual Settlement | No |
| AB810AFFC62E4FC199C8C422A18B2533 | Add Products | No |
| EB4C4053F3B94A17A08D1DD7E89CEB7E | Aging Balance Process Definition for Payables | **Yes** |
| 0D37A9F6109549DEB058373EF2DAEB6A | Aging Balance Process Definition for Receivables | **Yes** |
| A2FAF49712D1445ABE750315CE1B473A | Cancel and Replace Sales Order | No |
| 5F7C5316CB7E4598898150AC88061B1B | Cancel Cost Adjustment | No |
| 1B0BF927933A4F41A73739CB6E4A9AD0 | Cashflow Forecast Report | No |
| 3A4E13B0AB764F188CB062DDE2A9B685 | Change Inventory Status | No |
| 0C2AFAEFB67B4CB8A1429195EB119A49 | Confirm Cancel and Replace Sales Order | No |
| 8B81D80B06364566B87853FEECAB5DE0 | Copy from Orders | No |
| CBBD7BB6BDFE4705B68DD3D9FF788D4E | Copy Service Modify Tax Configuration | No |
| FACDBDDCB6F947CBBC9CA8034EBEBD87 | CopyProcessPlanVersion | No |
| 6D8ACA489B96480EAEB0FD7EE729C8C9 | Process Cost Adjustment | No |
| 7737CA7330FD49FBA7EBC225E85F2BC9 | Create Lines From Shipment/Receipt | No |
| AB2EFCAABB7B4EC0A9B30CFB82963FB6 | Create Lines From Order | **Yes** |
| B0985AF0989E40A7B664917C0EA203BE | Create Sequences | No |
| C1A39F72074A4FAC8F354CF7CA1BF704 | Direct Process Import Entries | No |
| 7372662B059D4E01A80E5599B500A2D2 | Doubtful Debt Pick and Edit | No |
| 5D335DD61A264A6FAD881E159ADA9F5A | Fix Backdated Transactions | No |
| 97FFD59B991D49BFB5153C309B009272 | Grant Portal Access | No |
| B526373F96784A54A438B856C7CB908B | InstanceManagementAction | No |
| 726D2F8961314B4C9E9D3E4121C75CD0 | Inventory Amount Update | No |
| 62250E8866EA4D96A66C309878DC039E | Invoice From Shipment | No |
| 4BDE0AF5E8C44B6C9575E388AAECDF69 | Purchase Order Report | No |
| 2669887A12CA495787BEBD2F425849AB | Kill Process | No |
| 96FE01F2F12F45FC8ED4A1978EBD034C | Landed Cost Process | No |
| 281FFDFAB31C4394A2EAA73A6F9F3A3F | LC Cost Match from Invoice | No |
| DDB20065809843FF92835E59ADB2234C | Landed Cost Matching Cancel | No |
| 24E052E6FEB64295B64E683B5196230B | Landed Cost Matching Process | No |
| 70E42AD47E5F4698A9ACCCAF3EB72B9E | Manage Prereservation Pick and Edit | No |
| 5F547560D3DE401AA0B570F22E2C6C06 | Manage Reservation Pick and Edit | No |
| 653F9E5D2CCB48E081D98D000EE7CBCF | Manage Stock Reservation Pick and Edit | No |
| FE3A8C134D41488DB3A69837BD54B56A | Manage Variants | **Yes** |
| D395B727675C45C98320F8A40E0768E7 | Manual Cost Adjustment | No |
| A832A5DA28FB4BB391BDE883E928DFC5 | Open Close Periods | **Yes** |
| 6995A4C2592D434A9E16B71E1694CBCA | Create Purchase Order Lines | No |
| B05273730AA14DAEA91EAC7A828C8026 | Process Price Difference Adjustment | No |
| C600DAD457664EFDA6B1AA76931552BA | Reactivate Landed Cost | No |
| F1EC1AB61DCD4858BAD3A52BE60006F9 | Recalculate Role Permissions | No |
| 0B90883A379A4736B7016B8D5E8E75DB | Box | No |
| BFE085D6E3DC423792FA7DD0DCF5C2A6 | UnBox | No |
| E0870062F05F4DC88E589ABC6A45DF4C | Relate Product Category and new tax to a Service Product | No |
| 8E5996F1F3154B498468938B5341A0CB | Relate Product Cat to a Service Product | No |
| E66C669B0B01498C8EB3F99CD371CF9A | Relate Products to a Service Product | No |
| 41644B58FB034B62A63D2A40F69D2664 | Reserved Good Movement Pick and Edit | No |
| C6ED4B93E0D54C08A57072AEEC40E6EC | Reset Accounting | No |
| 281704CE41444AC4BF9410A725234BFB | Reset Stock Valuation | No |
| 4B5179CBF60C44E79C4BBED159FC498F | Reset Valued Stock Aggregated  | No |
| A2C19D0EF6594D14A64BC62E99A89CC3 | RFC/RTV HQL Pick and Edit Lines | **Yes** |
| 5E9F9D7EECC24E4FBB2C60840FF613BE | RM Receipt Pick and Edit Lines | No |
| 4AD70293357245AB96E59C2CDB43A35D | RM Shipment Pick and Edit Lines | No |
| C4265E27C8134096B49DFBF69369DFC6 | Service Order Line Relation Pick and Edit | **Yes** |
| B5C942145F354ABEBC9F16235D80D776 | Set New Currency | **Yes** |
| 9AB8A39485BD4FB1B6BB38B27E707668 | Test SMTP Connection | No |
| 7DC2C8DC186B4C1DB18E147911950861 | UpdateInvariants | No |
| 45ED6D0400FD42BEA9771C549A9AE8AB | Validate Costing Rule | **Yes** |
| CDEA2939B10242B593A37E3958BC013F | Change Status | No |
| 9D573CA8D29C4244A9E26A1D0F2BD760 | Change Task Status | No |
| 67C8A62B1E86456D8C7603DA217D6D06 | Complete CRM Task With Lead Sync | No |
| D5120C90478E4BDBA620CF68923C47BD | Convert Lead SubApp | No |
| 7B5B26878090413A9AAAE226D98D0BD5 | Generate Task | No |
| A5369211B6994DDB8DAD7662EDF4733F | Validate Record Freshness | No |
| 31ED9333E46C419D92E9F1B10F821B91 | Clone | **Yes** |
| C044DDAA929E40D780C36154FBB968F7 | Create Invoices from Orders | **Yes** |
| 8DF818E471394C01A6546A4AB7F5E529 | Process Orders | **Yes** |
| 33338B1F2C4F499EBA4F5547BE0B2A4E | Process Shipment | **Yes** |
| 5638D6D4B33F44C889C3AFCA0DEB8130 | Send Mail | No |
| 272C8D38EF3245BF882E623CE92AB4E7 | Process Invoices | **Yes** |
| 22014C416A7E4DAC965E8CE4143E2D92 | Offer Add Org | No |
| D47F228584614C869651BBD944068BA6 | Offer Add Product | No |
| 8353E46E74024F78890AB466E7DD48DD | Offer Add Product Category | No |
| 57496FB9CF9E4E8F847224017941570E | Post | No |
| 60F1E2DEB1B544908CDD4CF99ACA80EB | Etendo Payment Execution | **Yes** |
| 849B956E25DA47E19F9681C23A3F297D | AlertProcess | No |
| 4ED07BDD577D424EA831161AE4BA59EE | Async Error Collector | No |
| 5E45DBA172BA4F17BED6C0B52A9D8926 | Async Result Collector | No |
| 8852FB40F5A546598BA2B4F280CFEA1B | Log Persistor Processor | No |
| EC2C48FB84274D3CB3A3F5FD49808926 | Check Hosts | No |
| 1FD943C62D2A4F8EA557F8221FA0EB60 | Sync Models | No |
| 9872E2F2D87843F08404DAFFB0D8EB88 | Add Bulk Tasks | No |
| 75BBF5830BC74F7888B277BA7045D678 | Evaluate Copilot Task | No |
| 7260F458FA2E43A7968E25E4B5242E60 | Execute Copilot Task | No |
| C3826556773C45F48763CD6BDFB8E46E | Get MCP Server Configuration | No |
| 332B46F9424D4061B2B083F65874A703 | Sync Assistant | No |
| 402D175C908142B39C12E6FE287CD098 | Sync Tool Structure | No |
| CF2F9DA78D584A2CA6D219EF7836E7ED | Sync LangGraph Image | No |
| 5E3A7C9C576A48E5BF84F2E2B3155D7A | Send Print Job | No |
| ED463E7DABB643D181CA3799C55FF008 | Update Printers | No |
| 965A2049D1404253BE9C8FC85BCF0209 | Create Entity Mappings | No |
| F355D9A73F554AF5860A532D92C167EC | ApproveGoogleDoc | No |
| 3B85498FECA646F19AD0E5D416C36776 | GetMiddlewareToken | No |
| DDADF2E25EEF444A80208E681EFF24CD | Get Token | No |
| 8BD6BF40895C465085AE6F26FEB7D185 | RefreshOAuthConfigs | No |
| 69317AED28D44AA0BAD7A82CE40AE284 | ExampleProcess | No |
| 894FCEB7E7474A279D46FCF0C38E57B6 | Initialize RX Services | No |
| 67D98DCC3DDF42E59222BADF0945E2A9 | Restart RX Services | No |
| D4781FD141934E0F963F3FF087148D21 | Export Budget to Excel | No |
| B74D90309A754F4BAE6662F5719D38B7 | Customer Statement | No |
| D37588FFC6264BED91FA7611DBFFC679 | Balance Sheet and P&L Structure advanced | **Yes** |
| 56E951BB13A44AFBB642291081613E46 | General Ledger Report Advanced | **Yes** |
| 636EF6F0F8B64E94A8247930569B98CA | Journal Entries Report Advanced | **Yes** |
| 8A96EC31C48C4501BEAD18F43A44808A | Purchase Invoice Dimensional Report | No |
| D8E8015B1478473799E47F84796C481C | Trial Balance | **Yes** |
| 77AAF82CC5344022AAD6ECBC9925E574 | Añadir Certificado Digital a Organización | No |
| 8F3F10EC88B34048839D9CBDAB2C6FFF | Rellenar Fechas de Operación | No |
| 574AEEEF61944D6D87E67FC285047340 | Create Deferred Plan | No |
| CCA410DB2BA84A9983CCFFB405743348 | Kill Job | No |
| 9F152A54535F4CA9A74A80F8C6BE0528 | Run Job | No |
| 1F924A51A2474420BDC19E27E4ED7138 | Reactivate Internal Consumption | No |
| B58D7C97069E481D84042B517D7BBB11 | Inventory Scan | No |
| EC673C215BAD4B13875323085B07F95D | Open Swagger | No |
| 84628BC70CDB49B58054E80C20BCBFEE | Reactivate Payment | No |
| B2A7F27C590546F38563C20CA9AD00B7 | Reactivate Reconciliation | No |
| BA47238DB98D4FE7A4B540760EC8226A | Reactivate Transaction | No |
| FB79E902A5384754990AD145F6CAC9FB | Remove Payment | No |
| 745FCF75B6F14024B96CC14429D8E952 | Remove Payments from Invoice | No |
| D2923463223C4F1EADE335D22B9D8FE8 | Remove Payments from Order | No |
| 22C4DBA9FAC9444995EC27DD439A6F1B | Remove Reconciliation | No |
| DC4FCAC608324CB78CF92F99C1A94AD0 | Remove Transaction | No |
| 03923CFFB18E4C89ADA4C03B68F6575B | Copy Rappel | No |
| FCB850074A744845ABE70160D35DD4E7 | Execute Custom Rappel Configuration | No |
| CBEEA06FDA904DC5B28CF200CD933189 | Insert Business Partner In Rappel Configuration | No |
| C1414418016E4942A952A7E1A50ACE71 | Insert Product Category In Rappel Configuration | No |
| 8F9CD1B4C60E43A69786C0B6F1D2E51D | Insert Product In Rappel Configuration | No |
| 1718FAA67B1247DDAAA4D23F34CC8645 | Reactivate | No |
| 99E532BA0306450A839F5DE238375238 | Select Invoices and Orders | **Yes** |
| C88AB6CBA1694000AFF5706A31B08AE1 | Select Payments Pick and Edit | **Yes** |
| F48EC703384C46B4BA9E4802D6626D57 | Clear Report Cache | No |
| 71E00A0E964E43AE81C5AFBCDCA5F87C | Valued Stock Report | **Yes** |
| 7215E0E8F2EF4D918B875E6FA4E684F2 | Reverse GL Journal | No |
| B227A85EF172416183008FEF40B12868 | Reverse GL Journal | No |
| F353F2A7307B464CA2C6515CBEFB0D93 | Corregir Factura | No |
| E36A8BA259164E78AFDDC760172C18F5 | Create Rectification | No |
| B57A0126F38B428F936FA2B52186EB97 | Consulta de Facturas en Verifactu | **Yes** |
| E0D681117A1843C5B9D525701087D7DC | Refrescar monitor Verifactu | No |
| D995FA46EEDB4DAF9F414E661FB13E43 | Marcar Como Listo | No |
| 3D2FDB6FC2BE4F549BA72A98ABD95F8A | Print SII Last connection report | No |
| 9FF06EA1E74845B8B74FBC36AAE40F94 | SII Cash Receipt Modification | No |
| 73B931766AFE4D50A9FD25CB4547D197 | SII Cash Receipt Sender | No |
| 92C02F9A367140C085D1EE3BD27C4E96 | SII duplicated invoice correction | No |
| BAAECFDF9FF144E8A610E9F1EF3E5FBE | SII Invoice Modification | No |
| 2ECF46DAAEEB486EAF79D3594D50DE5F | SII Invoice Sender | No |
| 0662F6BC8D604AAEA5A2DD49E87F4B65 | SII Invoices Query | No |
| EA02D79CA1DE4B46909EA6EF64A66B53 | SII Payment Sender | No |
| BE564945CB2D4892AC0EE51204C5DB7D | SII Unsubscribe Invoice | No |
| 47EA4A31145142CCA33C786DFD984041 | SII Update Invoices | No |
| 3C55FFE46CA940B6819DE3BBA19437E6 | Validate Hash | No |
| CEBDC2E68B1549F7B4F726A8174E532C | Task Type Match | No |
| 12FECC9DF1F4418AB7DAA46D6A05FEC6 | Creación de URL para QR | No |
| BE2486102F2C41779B760609FD69A225 | Creación de fichero XML desde Factura | No |
| 535A8BAE44A34759A7C8FF40D62A5070 | Creación de anulación XML desde Factura | No |
| FF1893F761AF46E893E37CB4EF1DFCB1 | Log Management | No |
| EBC24A55293F4E4BAF56EF8DFA43D578 | RegisterModule | No |
| 20D69FFD251A481BA75F33538EDFCF76 | VAT Regularization | **Yes** |
| 78B3DAC00BA24304AD35364830C7DD8D | Complete Packing From Packing Action | No |
| C4043A216BD7429BB4D77469E7886BAA | Create Packing | No |
| F3B77135F9D94C8FA1EFA270691265FB | Create Packing Header | No |
| 2BFC08B6152D489D847B5A06801D2F11 | Create Packing | No |
| 83AD8A78FB1C4EDBB4A222A276498938 | Manage Packing Action | **Yes** |
| 3AD0D1220BE24A379E0E2E7A6A68E5BB | Complete Packing From Shipment Action | No |
| E8C683DEA4854D4491105C7F7A8EC63E | Pick Goods Shipments | No |
| 82E0DF66C2D944A1BB44566D554217FF | Process Packing Action | No |
| 181CA0DE37E7411B8D1F80A3751C984D | Process Packing Header Action | No |
| 71DEE8098CE74C939575FF57609952CC | Validate Barcode Action | **Yes** |
| 16B1669F496B475B8D0C4D01BF6DD761 | Edit Picking List Item | No |
| 44821BBF79D64516844F388CB2E0F36E | Assign and Group Picking List | No |
| 16A38094118442428479969B17589690 | Cancel Picking List Action | No |
| B6F5DE7C02A64E3DB6E770AF56E299E2 | Cancel Picking List | No |
| 6DA8E27C96D04E329A7A54007AF2DB55 | Close Picking List | No |
| 177A8D588D354C4DBA483CBCA6524DCB | Process Picking List | No |
| 4FCBE7744A3B4DB38A1367F5977B4650 | Create Picking List Action | No |
| 7D3C6136F9754D11A5BE667B6F76D49F | Create Shipment Action | No |
| 653BFAE9C3134083A7F95A9FA0010AE2 | Delete Picking Line | No |
| B7B1D4F53D4249C5A10D3AD0865D909F | Manage PickingList Action | **Yes** |
| CAC397FDDF754A1A8FEE22FDDE8FE2FF | Picking List Movment Line Complete Process | No |
| 3724E106FE4544F2B4402A1D1AE4E1AC | Picking List Movement Line Reject | No |
| 1D2743148D75422AB403C1003D814839 | PickingList Pick And Edit | No |
| 91DAA8C32F874F22AC02198E09BF7A90 | Print Picking List | No |
| 7DE17880BAB5455C9CE38391C93D577E | Process Picking List Action | No |
| A4008FA053C34DF0ACB814F04948E205 | Process Picking List | No |
| 2984DA09C1A64D8F802D432813BA19ED | Picking List Item Raise Incidence | No |
| C107C380836042A9AF4E107521C947AA | Re Assign Picking List | No |
| 369B3102426943F692396E12753DC4BB | Picking Select Sales Orders | No |
| 50D2EB7B24B44EA39C4735AC51CA8E0A | Validate Barcode Action | **Yes** |
| 40317268E74C445FA85DB97249AFFE37 | Validate Picking List | No |
| 371A073B46CA445184F64A71FA033A5E | Get API Key | No |

---

## 10. QA representative sample (10 processes)

Developers must implement and verify all **37** in-scope processes. To keep QA effort bounded
while still exercising every relevant dimension, the following **10 processes** form a
representative sample. Selection rationale:

- **All 3 signals** covered (1, 1+combo, 2, 3).
- **All 5 mechanisms** covered (`on_load_function`, `clientsidevalidation`, `on_refresh_function`,
  `onchangefunction`, `ongridloadfunction`).
- **All 3 difficulty tiers** (easy, medium, hard).
- **Multiple `uipattern` types**: PickAndExecute, A, M, OBUIAPP_Report.
- **Both source-availability flavors**: module checked out vs `⚠ deploy` (deployed copy only).
- **Diverse functional areas**: payments, jobs, reports, warehouse, VAT, period management.

| # | id | name | diff. | signal | mechanisms / why representative |
|---|---|---|---|---|---|
| 1 | 45ED6D0400FD42BEA9771C549A9AE8AB | Validate Costing Rule | easy | 1 | `on_load_function` + `clientsidevalidation` only — minimal smoke test for the two main process-level hooks. Module source present. |
| 2 | C044DDAA929E40D780C36154FBB968F7 | Create Invoices from Orders | easy | 1 | `onchangefunction` ×1 only — smallest file (15 lines); isolates param-level onChange in a clean module. `A` type. |
| 3 | 20D69FFD251A481BA75F33538EDFCF76 | VAT Regularization | easy | 1 | `on_load_function` + `ongridloadfunction` ×1 — covers `ongridloadfunction` and the `⚠ deploy` source path. |
| 4 | 154CB4F9274A479CB38A285E16984539 | Find Transactions to Match | medium | **1,3** | `clientsidevalidation` only at the process level **and** detected also by `processId` — exercises **signal combo (1+3)**. |
| 5 | EB4C4053F3B94A17A08D1DD7E89CEB7E | Aging Balance Process Definition for Payables | medium | 1 | `onchangefunction` ×5 in an **`OBUIAPP_Report`** process; lives in a **shared core utilities** file (`ob-onchange-functions.js`) — exercises partial-file migration. |
| 6 | 86F0B1EBE2BC48E3ACF458768D14CC99 | Match Statement | medium | 1 | The **only** process with `on_refresh_function`, plus `on_load_function` + `clientsidevalidation` — the only way to test the refresh hook. |
| 7 | 60F1E2DEB1B544908CDD4CF99ACA80EB | Etendo Payment Execution | medium | **1,2** | The **only signal-2** case: `onchangefunction` ×2 **plus** an action-parameter (`EAPM_Popup`) registered via `OB.Utilities.Action.set` → migrates **two distinct files**. |
| 8 | A832A5DA28FB4BB391BDE883E928DFC5 | Open Close Periods | medium | **3** | Pure signal-3: classic JS that **hardcodes a `processId`** (no metadata column). `uipattern = M`. Validates the processId-binding migration path. |
| 9 | 83AD8A78FB1C4EDBB4A222A276498938 | Manage Packing Action | hard | 3 | Signal-3 hard case with **two files** (`OBWPACK_PackingComponent.js` + `OBWPACK_Process.js`, 1.201 lines combined). Warehouse module, `A` type. |
| 10 | 9BED7889E1034FE68BD85D5D16857320 | Add Payment | hard | 1 | The crown jewel: **all four signal-1 mechanisms at once** (`on_load_function`, `clientsidevalidation`, `onchangefunction` ×13, `ongridloadfunction` ×3) in the **largest file** (1.935 lines). Single test that flexes every code path. |

### Coverage matrix (what each pick exercises)

| Dimension | Picks |
|---|---|
| `on_load_function` | 1, 3, 6, 10 |
| `clientsidevalidation` | 1, 4, 6, 10 |
| `on_refresh_function` | **6** (only one) |
| `onchangefunction` | 2, 5, 7, 10 |
| `ongridloadfunction` | 3, 10 |
| signal 1 pure | 1, 2, 3, 5, 6, 10 |
| signal 1+3 combo | 4 |
| signal 1+2 combo (action) | 7 |
| signal 3 pure (processId) | 8, 9 |
| easy / medium / hard | 1,2,3 / 4,5,6,7,8 / 9,10 |
| `uipattern` | PE: 1,4,5,6,7 · A: 2,3,9,10 · M: 8 · Report: 5 |
| ⚠ deploy source | 3 |
| Multi-file process | 7 (2 files), 9 (2 files), 10 (effectively 1 file but with shared module utilities) |

### Suggested QA focus per pick

- **#1 Validate Costing Rule** — Open the process modal, verify `onLoad` populates defaults; trigger
  `clientsidevalidation` (e.g., with invalid input) and confirm the migrated logic blocks execution.
- **#2 Create Invoices from Orders** — Change the affected parameter and verify the `onChange`
  callback updates the dependent field exactly as the classic UI did.
- **#3 VAT Regularization** — Verify `onLoad` runs at modal open **and** the grid-load callback
  populates the parameter grid correctly. Confirms the migration toolchain can handle modules
  whose source is only available as a deployed copy.
- **#4 Find Transactions to Match** — Trigger `clientsidevalidation` from the modal; separately
  verify the process is reachable from the place where its `processId` is hardcoded (matches the
  same `ob-aprm-findTransaction.js` flow).
- **#5 Aging Balance Payables** — Report-and-Process flow: change each of the 5 affected
  parameters and verify each `onChange` fires. Confirm only the aging functions of the shared
  `ob-onchange-functions.js` were migrated, not the whole file.
- **#6 Match Statement** — Three checks: `onLoad`, `clientsidevalidation`, and especially
  `on_refresh_function` (e.g., after a child process completes). This is the **only** chance to
  validate the refresh-hook migration.
- **#7 Etendo Payment Execution** — Two distinct things to verify: (a) the `Received In`/`Paid Out`
  parameters fire `onChange`; (b) the action button registered via `EAPM_Popup` opens the migrated
  popup with the right parameters.
- **#8 Open Close Periods** — Open/close a period and verify the popup launched from the
  hardcoded `processId` works identically. Pure non-columnar binding.
- **#9 Manage Packing Action** — Verify barcode/packing flows that span both
  `OBWPACK_PackingComponent.js` and `OBWPACK_Process.js`. Largest single-process JS effort other
  than AddPayment.
- **#10 Add Payment** — Full regression: open modal, validate every default; change each of the
  16 parameters with `onChange`/`onGridLoad` and verify dependent fields/grids update; submit and
  ensure `clientsidevalidation` runs server-side correctly. Practically a re-run of the classic
  AddPayment test suite against the new UI.

> Passing this sample provides high confidence that the migration is sound for the remaining 27
> processes, because each of them is structurally equivalent to one of the patterns covered here.

### Custom-component (warehouse) processes — additional mandatory validation

Beyond the 10 representative picks above, two **custom-component** processes must be validated
explicitly. Unlike every other defined process, they do **not** render the standard parameter form:
they render a bespoke component (`GenericWarehouseProcess` — barcode input bar + lines grid + box
management) built from the schema their `em_etmeta_onload` returns. They take this path because they
carry the declarative flag **`em_etmeta_custom_component = Y`** on `obuiapp_process`; every other
process leaves it `N` and keeps the standard form.

These two exercise a path none of the 10 picks cover, so they are required:

| # | id | name | flag | classic source |
|---|---|---|---|---|
| 11 | C4043A216BD7429BB4D77469E7886BAA | Create Packing | `em_etmeta_custom_component = Y` | `modules/org.openbravo.warehouse.packing/web/org.openbravo.warehouse.packing/js/OBWPACK_PackingComponent.js` |
| 12 | F3B77135F9D94C8FA1EFA270691265FB | Create Packing Header | `em_etmeta_custom_component = Y` | `…/warehouse.packing/js/OBWPACK_PackingComponent.js` |

**Migrated hooks:** `em_etmeta_onload` (returns the `warehouseProcess` schema; opens via
`ManagePackingAction`), `em_etmeta_onprocess` (submits via `ManagePackingAction`), and
`em_etmeta_payscript_logic` (the `onScan` barcode handler, validates via `ValidateBarcodeAction`).

**QA focus (both processes):**
- **Custom render.** Opening the process renders the **packing component** (barcode bar + lines grid
  + box management), **not** the parameter form.
- **Single onLoad.** The `onLoad` runs **exactly once** per open: no duplicated side effects and the
  console shows **no** `[useWarehousePlugin] onLoad evaluation failed`.
- **Scan.** Scanning a barcode fires `onScan`, matches the corresponding line and updates its boxed
  quantity; an unknown barcode is rejected.
- **Submit.** Confirming runs `onProcess` (`ManagePackingAction`) and closes the modal on success.
- **Regression guard.** Standard (non-flagged) processes are unaffected — they still render the
  parameter form and run their `onLoad` once in the full context.

---

## 11. Next steps (out of this inventory's scope)

- **Modules without local source** (marked ⚠ deploy: bpsettlement, financial.reports.advanced,
  verifactu, vat.regularization, remittance, pickinglist): clone their source to access the
  original `.js` before migrating.
- **Review the `dist.js` bundles** of §7 to confirm which carry migratable classic process logic.
- **Target schema is now complete** (six fields, see §4.4 mapping table): no further design
  decisions blocking the migration. Per-parameter entry points live in
  `em_etmeta_on_parameter_change` / `em_etmeta_on_grid_load`; shared helpers in
  `em_etmeta_payscript_logic`; lifecycle hooks in `em_etmeta_onload` / `em_etmeta_onprocess` /
  `em_etmeta_on_refresh`.

---

## Updates

### 2026-06-12 — Unblocked "Create Inverse document for Order" (`B4A21A617AD64137BF8C9A6770F65AD2`, §6 #22)

`ProcessOrders.onLoad` depended on three SmartClient APIs absent from the new UI. They were implemented
in the client substrate (see `client/agents/reports/B4A21A617AD64137BF8C9A6770F65AD2.md` →
*Platform changes*, and the *Updates* section of `new-javascript-code.md`):

- **`item.setValueProgrammatically(value)`** — selects an existing selector option (value + label).
- **`item.getFirstOptionValue()`** — reads the first option value of a selector's current value map.
- **`view.okButton.isEnabled()` / `view.okButton.enable()`** — reads/force-enables the execute button
  (the force-enable overrides only the "mandatory empty" reason).

Also fixed a latent keying bug: `setValueMap`/`getValueMap`/`setRequired` now resolve a parameter by
map-key OR `name` OR `dBColumnName` (the parameters map is keyed by `dBColumnName`, while migrated hooks
address items by `name` — e.g. `DocAction`'s name "Document Action" ≠ dBColumnName "DocAction").

The `onLoad` was ported to `em_etmeta_onload` (porting details: `view.selectedRecords` / `view.tabId`
instead of `view.parentWindow.view.viewGrid` / `view.processOwnerView.tabId`; `Array.add` → `.push`;
`getValueMap()` returns a `ListOption[]` array so `currentValues[action]` → `currentValues.find(...)`).
Status `blocked → migrated` (pending manual QA). These capabilities also unblock the rest of the
`processRecords` family (Process Orders/Shipment/Invoices), each migrated on its own row.
