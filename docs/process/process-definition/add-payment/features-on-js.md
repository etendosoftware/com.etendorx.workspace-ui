# Add Payment — Legacy JS Feature Inventory & Test Checklist

> **Scope of this document.** This is an exhaustive, natural-language inventory of every behavior implemented by the classic SmartClient "Add Payment" Process Definition (file [`erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js`](../../../../../erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js), 1935 lines) plus a per-feature checklist that QA must run to confirm the new React-based UI reaches feature parity. The document is the **single source of truth for the migration**: no PR should be opened against the new UI without explicit human authorization, and every behavior listed below must be validated before that authorization is requested.
>
> **Out of scope (deliberate).** Mapping each behavior to a target Process Definition layer (`etmetaOnload` / `etmetaPayscriptLogic` / `etmetaOnprocess`) and gap analysis against the partial conversions under [`add-payment-js/`](../../../../../add-payment-js/) are tracked in follow-up iterations. This file only describes what the legacy does and how to test that the new UI reproduces it.
>
> **Audience.** Frontend developers porting the logic to the three Process Definition fields, and QA engineers running the parity checklist.

## Process identification

| Item | Value |
|---|---|
| Process ID | `9BED7889E1034FE68BD85D5D16857320` |
| Process Name / Search Key | `Add Payment` / `AddPayment` |
| Java action handler | `org.openbravo.advpaymentmngt.actionHandler.AddPaymentActionHandler` |
| Module | Advanced Payables and Receivables Mngmt (`A918E3331C404B889D69AA9BFAFB23AC`) |
| Window button (`AD_Field`) | `EM_APRM_Addpayment` on table `C_Invoice` (tab "Header - Sales Invoice"), reference type Button |
| Button display logic | `@Processed@='Y'&@IsPaid@='N'& (@showAddPayment@='Y' \| @showAddPayment@ ='')` |
| Legacy entry points | `loadFunction = OB.APRM.AddPayment.onLoad`, `clientSideValidation = OB.APRM.AddPayment.onProcess` |

## Source material

- Primary: [`erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js`](../../../../../erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js) — 1935 lines, only namespace `OB.APRM.AddPayment.*`.
- Secondary: [`erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-utilities.js`](../../../../../erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-utilities.js) — generic APRM helpers used by other processes; cross-checked only to confirm that Add Payment does not depend on it.
- Process metadata: [`add-payment-process-info.json`](../../../../../add-payment-process-info.json) — Application Dictionary export with the canonical parameters, grids, references, default-value expressions, display logic and read-only logic.
- Partial conversions (referenced only to confirm React Hook Form field naming alignment, **not** as authoritative behavior): [`add-payment-js/add-payment-on-load.js`](../../../../../add-payment-js/add-payment-on-load.js), [`add-payment-js/add-payment-on-process.js`](../../../../../add-payment-js/add-payment-on-process.js) (empty), [`add-payment-js/add-payment-payscript.js`](../../../../../add-payment-js/add-payment-payscript.js).

## Glossary

| Term | Meaning |
|---|---|
| `trxtype` | Document/transaction type list. `RCIN` = "Receipt In". An empty string (`''`) means the modal was opened from "Add Transaction" (nested caller chain). |
| `issotrx` | Boolean. `true` = sales/receipt; `false` = purchase/payment out. Forced to `true` when `trxtype === 'RCIN'`. |
| `BSL` | Bank Statement Line. Present when the modal is opened from Match Statement → Add Transaction → Add Payment. Activates the `bslamount` field and the converted-amount override. |
| `MC` | Multi-currency. Active when `c_currency_id !== c_currency_to_id`, both set. |
| `CR` / `RE` | Overpayment actions: `CR` = leave as Credit, `RE` = Refund. |
| `writeoff` | Per-invoice flag in the order/invoice grid: amounts on these rows reduce the distributable pool. |
| `generateCredit` | Hidden numeric field used in the actual/expected reconciliation when overpayment is generated as credit. |
| Caller chain | The classic UI tracks a parent → child path via `view.callerField.view.callerField.record`. Add Payment uses it to detect the BSL flow. |

## 1. Form fields and grids referenced by the legacy code

All names below are the `dBColumnName` exactly as declared in [`add-payment-process-info.json`](../../../../../add-payment-process-info.json) — React Hook Form bindings in the new UI MUST keep these names so the framework can route values through `dbColumnName` / `inp` aliases.

### 1.1 Top-level form items

| dBColumnName | Type / reference | Notes |
|---|---|---|
| `fin_payment_id` | Hidden id | Empty when creating a new payment; non-empty when editing. Controls onLoad recalculation gating. |
| `issotrx` | YesNo (20) | Derived; forced by `documentOnChange`. |
| `trxtype` | List (17) | Selectable document type. Empty string means "called from Add Transaction". |
| `ad_org_id` | Selector | Triggers `organizationOnChange`. |
| `received_from` | Selector | Business partner. Drives `isCreditAllowed`. |
| `fin_paymentmethod_id` | Selector | Payment method. |
| `fin_financial_account_id` | Selector | Deposit-to financial account. |
| `c_currency_id` | Selector | Payment currency. |
| `c_currency_to_id` | Selector | Financial-account / converted currency (visible only when multicurrency is active). |
| `payment_date` | Date (15) | Required for multicurrency rate lookup. |
| `payment_documentno` | String (10) | Populated by `AddPaymentDocumentNoActionHandler`. |
| `reference_no` | String (10) | Free text. |
| `conversion_rate` | Number (800019) | Visible only in MC. |
| `converted_amount` | Amount (12) | Visible only in MC. |
| `actual_payment` | Amount (12) | Required. Drives distribution. |
| `expected_payment` | Amount (12) | Sum of selected outstanding amounts. Read-only. |
| `amount_inv_ords` | Amount (12) | Sum of selected invoice/order amounts. Read-only. |
| `amount_gl_items` | Amount (12) | Sum of GL item received_in - paid_out (sign by issotrx). Read-only. |
| `total` | Amount (12) | `amount_inv_ords + amount_gl_items`. Read-only. |
| `used_credit` | Amount (12) | Sum of credit grid selections. Read-only. |
| `difference` | Amount (12) | `actual_payment + used_credit - total`. Read-only. |
| `expectedDifference` | Amount (12) | `expected_payment + used_credit - total + amount_gl_items` (falls back to `difference` when zero). Read-only. |
| `overpayment_action` | List (17) | Value map dynamically reduced to `CR` / `RE` based on context. |
| `document_action` | Selector | Auto-selected when its value map has a single row. |
| `transaction_type` | List (17) | Filters orders/invoices by transaction type. |
| `bslamount` | Amount (12) | Read-only; visible only when display flag is `Y`. Carries Bank Statement Line amount. |
| `customer_credit`, `c_doctype_id`, `c_invoice_id`, `c_order_id`, `DOCBASETYPE`, `StdPrecision`, `generateCredit` | Hidden helpers | Used during math and submission. `StdPrecision` is the rounding scale for converted amount. |

### 1.2 Display- / read-only-logic driver fields

These boolean parameters are inputs to the `AddPaymentDisplayLogicActionHandler` recalculation; their values toggle visibility / read-only state of the user-facing parameters. The legacy code pushes their `paramId` into the `affectedParams` array of `recalcDisplayLogicOrReadOnlyLogic`:

| dBColumnName | Drives |
|---|---|
| `trxtype_display_logic` | Visibility of `trxtype` |
| `ad_org_id_display_logic` | Visibility of `ad_org_id` |
| `bslamount_display_logic` | Visibility of `bslamount` |
| `credit_to_use_display_logic` | Visibility of the `credit_to_use` grid; flipping to `'Y'` forces a fetch |
| `overpayment_action_display_logic` | Visibility of `overpayment_action` |
| `payment_documentno_readonly_logic` | Read-only state of `payment_documentno` |
| `payment_method_readonly_logic` | Read-only state of `fin_paymentmethod_id` |
| `actual_payment_readonly_logic` | Read-only state of `actual_payment` |
| `converted_amount_readonly_logic` | Read-only state of `converted_amount` |
| `payment_date_readonly_logic` | Read-only state of `payment_date` |
| `fin_financial_account_id_readonly_logic` | Read-only state of `fin_financial_account_id` |
| `conversion_rate_readonly_logic` | Read-only state of `conversion_rate` |
| `received_from_readonly_logic` | Read-only state of `received_from` |
| `c_currency_id_readonly_logic` | Read-only state of `c_currency_id` |

### 1.3 Grids embedded in the modal

Each grid is exposed as a parameter whose canvas hosts a viewGrid.

#### 1.3.1 `order_invoice` — Order / Invoice candidates (reference `FF80818132D8F0F30132D9BC395D0038`)

Columns: `id`, `salesOrderNo`, `invoiceNo`, `paymentMethodName`, `businessPartnerName`, `expectedDate`, `invoicedAmount`, `expectedAmount`, `outstandingAmount`, `amount`, `writeoff` (YesNo), `OB_Selected`, `created`, `createdBy`, `updated`, `updatedBy`.

Notable behaviors hooked on this grid: `selectionChanged`, `userSelectAllRecords`, `deselectAllRecords`, `dataArrived`, `dataProperties.transformData`, plus the cell validator `orderInvoiceGridValidation`.

#### 1.3.2 `glitem` — GL Items

Columns: `c_glitem_id`, `C_Bpartner_ID`, `M_Product_ID`, `C_Project_ID`, `C_CostCenter_ID`, `aprm_gl_item_ID`, `User1_ID`, `User2_ID`, `received_in`, `paid_out`, `fin_payment_detail_id`, `OB_Selected`.

Behaviors hooked: `removeRecordClick`, plus the `glItemAmountOnChange` mutually-exclusive `received_in` / `paid_out` logic and `addNewGLItem` template.

#### 1.3.3 `credit_to_use` — Outstanding payments usable as credit

Columns: `id`, `documentNo`, `description`, `paymentDate`, `outstandingAmount`, `paymentAmount`.

Behaviors hooked: `selectionChanged`, `userSelectAllRecords`, `deselectAllRecords`, the cell validator `creditValidation`.

### 1.4 Dynamically injected field

`bankStatementLineId` — NOT declared in the AD JSON. The legacy onLoad creates it at runtime via `isc.OBTextItem.create(...)` and hides it, when the modal's caller chain matches `Match Statement → Add Transaction → Add Payment`. The new UI must reproduce this conditional, runtime field so the submission payload carries the bank-statement-line id.

## 2. Behavior inventory

Every behavior the legacy file implements, grouped by area. Each numbered subsection corresponds to a concrete callable defined in [`ob-aprm-addPayment.js`](../../../../../erp/WebContent/web/org.openbravo.advpaymentmngt/js/ob-aprm-addPayment.js).

### 2.1 Initial Load (OnLoad equivalent)

#### 2.1.1 `OB.APRM.AddPayment.onLoad(view)`

Fires once when the modal is mounted (registered as `loadFunction` in AD).

It reads `fin_payment_id`, `issotrx`, `trxtype`, plus the full caller chain. It then:

1. Resets multicurrency state flags on the form: `_mcShownPrev = false`, `_mcSyncedOnce = false`.
2. Detects the BSL caller chain by checking `view.callerField.view.callerField.record.affinity` and `.matchingType`. When both are defined, it captures `bankStatementLineId = record.id`, adds an `OBTextItem` named `bankStatementLineId` to the form and hides it.
3. Calls `paymentMethodMulticurrency(view, form, !payment)` — recomputes currency / conversion only when there is no existing `fin_payment_id` (i.e. when creating a new payment).
4. Calls `reloadLabels(form)` — refreshes the titles of `received_from` and `fin_financial_account_id` according to `issotrx`.
5. Fires `fetchData()` on both `glitem` and `credit_to_use` grids.
6. Replaces grid prototypes:
   - `order_invoice.viewGrid.selectionChanged` ← `selectionChanged`
   - `order_invoice.viewGrid.userSelectAllRecords` ← `userSelectAllRecords`
   - `order_invoice.viewGrid.deselectAllRecords` ← `deselectAllRecords`
   - `order_invoice.viewGrid.dataProperties.transformData` ← `ordInvTransformData`
   - `order_invoice.viewGrid.dataArrived` ← `ordInvDataArrived`
   - `glitem.viewGrid.removeRecordClick` ← `removeRecordClick`
   - `credit_to_use.viewGrid.selectionChanged` ← `selectionChangedCredit`
   - `credit_to_use.viewGrid.userSelectAllRecords` ← `userSelectAllRecords`
   - `credit_to_use.viewGrid.deselectAllRecords` ← `deselectAllRecords`
   - Stores `_aprmAddPaymentView` and `_aprmAddPaymentForm` back-references on the order/invoice grid.
7. Sets `form.isCreditAllowed = received_from has a value`.
8. Calls `checkSingleActionAvailable(form)` to auto-select the single `document_action` value when only one is available.
9. Stashes the current overpayment value map under `originalValueMap` for later filtering by `updateDifferenceActions`.
10. If `issotrx`, focuses the `actual_payment` field.
11. If `trxtype === ''` (modal opened from Add Transaction), reorders the first three fields by removing and re-adding `trxtype`, `ad_org_id`, `bslamount` (preserves display ordering when the process is invoked from a child window).

#### 2.1.2 Grid onLoadGrid callbacks

- `orderInvoiceOnLoadGrid(grid)` — sets `grid.isReady = true`, clears any `obaprmAllRecordsSelectedByUser` flag. If `issotrx || !payment` and the grid has no selection yet, runs `distributeAmount`. Otherwise runs `updateInvOrderTotal`. Then `refreshEditedSelectedRecordsInGrid(grid)` and `tryToUpdateActualExpected(form)`.
- `glitemsOnLoadGrid(grid)` — if the grid is not yet ready and contains preselected rows, expands the GL Items section (id `7B6B5F5475634E35A85CF7023165E50B`). Recomputes auto-fit field widths after first draw, calls `updateGLItemsTotal(form, 0, false)` and `tryToUpdateActualExpected(form)`.
- `creditOnLoadGrid(grid)` — sets ready flag, clears the all-selected marker, calls `updateCreditTotal(form)` and `tryToUpdateActualExpected(form)`.
- `tryToUpdateActualExpected(form)` — gating helper. Calls `updateActualExpected(form)` only after all three grids (`order_invoice`, `glitem`, `credit_to_use`) report `isReady = true`.

#### 2.1.3 `refreshEditedSelectedRecordsInGrid(grid)`

Re-applies `doSelectionChanged(record, true, view)` for every record in `grid.editedSelectedRecords`. Used to restore selection state after a fetch.

#### 2.1.4 `addNewGLItem(grid)`

Returns a shallow copy of `grid.data[0]` with `paidOut = 0` and `receivedIn = 0`. Template for new GL Item rows.

### 2.2 Reactive field changes (onChange handlers)

Each onChange is registered by the Process Definition framework against a specific form item.

#### 2.2.1 `organizationOnChange` — driver: `ad_org_id`

1. Clears `fin_paymentmethod_id`, `received_from`, `fin_financial_account_id`.
2. If `ad_org_id !== ''`, calls `AddPaymentOrganizationActionHandler` with `{ organization }`.
3. Callback: sets `c_currency_id` value and identifier (`valueMap[data.currency] = data.currencyIdIdentifier`). Then invalidates the `order_invoice` grid cache while preserving filters and previously-selected ids, and triggers `form.redraw()`.

#### 2.2.2 `documentOnChange` — driver: `trxtype`

1. If `trxtype === 'RCIN'`, sets `issotrx = true`; otherwise `false`.
2. Clears `fin_paymentmethod_id` and `received_from`.
3. Clears `fin_financial_account_id` unless `form.paramWindow.parentWindow` is defined (i.e. parent window is preserving that value).
4. Calls `reloadLabels(form)`.
5. Triggers display-logic recalc for `credit_to_use_display_logic` and `actual_payment_readonly_logic`.
6. If `trxtype !== ''`: invalidates the `order_invoice` grid cache (preserving filters + selected ids) and redraws the form.
7. If `trxtype !== ''`: calls `AddPaymentDocumentNoActionHandler` with `{ organization, issotrx }`; callback sets `payment_documentno`.

#### 2.2.3 `receivedFromOnChange` — driver: `received_from`

1. Pushes `credit_to_use_display_logic` into `affectedParams` and triggers display-logic recalc.
2. If the `credit_to_use` grid has any selection, deselects all rows.
3. If `trxtype !== ''`:
   - Calls `ReceivedFromPaymentMethodActionHandler` with `{ receivedFrom, isSOTrx, financialAccount }`. Callback: when `paymentMethodId !== ''`, sets `fin_paymentmethod_id` value + identifier, redraws the form, then cascades into `paymentMethodOnChange`.
   - Invalidates the `order_invoice` cache (preserving filters/selection) and redraws.

#### 2.2.4 `paymentMethodOnChange` — driver: `fin_paymentmethod_id`

1. Patches the `order_invoice` filter editor by merging `{ paymentMethodName: item.getElementValue() }` into the current editor values.
2. Calls `paymentMethodMulticurrency(view, form, true)`.
3. Calls `checkSingleActionAvailable(form)`.
4. If `trxtype !== ''`, applies the merged filter via `setFilterEditorCriteria` + `filterByEditor`.
5. Triggers display-logic recalc for `c_currency_id_readonly_logic`.

#### 2.2.5 `financialAccountOnChange` — driver: `fin_financial_account_id`

1. Calls `paymentMethodMulticurrency(view, form, true)`.
2. Calls `checkSingleActionAvailable(form)`.
3. Triggers display-logic recalc for `c_currency_id_readonly_logic`.

#### 2.2.6 `paymentDateOnChange` — driver: `payment_date`

Calls `paymentMethodMulticurrency(view, form, true)` to refresh the conversion rate (rate depends on date).

#### 2.2.7 `currencyOnChange` — driver: `c_currency_id`

If `trxtype !== ''`: re-runs `paymentMethodMulticurrency(view, form, true)`, invalidates the `order_invoice` cache (preserving filters and selected ids), redraws.

#### 2.2.8 `transactionTypeOnChangeFunction` — driver: `transaction_type`

1. Early returns when `item.getValue() === item.oldSelectedValue`.
2. Snapshots the currently edited selected records (parsing each `id` field via `replaceAll(' ', '').split(',')` into `ids[]`), stores them as `grid.editedSelectedRecords`, marks `grid.changedTrxType = true`.
3. Invalidates the `order_invoice` cache preserving filters + selected ids; redraws. The redistribution then happens inside `ordInvTransformData` when the next fetch returns.

#### 2.2.9 `actualPaymentOnChange` — driver: `actual_payment`

1. Marks `form._mcActualTouched = true`.
2. If `issotrx`: calls `distributeAmount(view, form, true)` and `updateConvertedAmount(view, form, false)`.
3. If `form._pendingRecalcRateFromBSL` is set and `actual_payment > 0`: enters the `_bslApplying` re-entrancy guard, calls `updateConvertedAmount(null, form, true)`, clears `_pendingRecalcRateFromBSL`.
4. Always calls `applyBankAmountToConverted(form)`.

#### 2.2.10 `conversionRateOnChange` — driver: `conversion_rate`

Bails out when `_bslApplying` is set (avoids the BSL re-entrancy loop). Otherwise calls `updateConvertedAmount(view, form, false)` (recompute `converted_amount = actual_payment × rate`).

#### 2.2.11 `convertedAmountOnChange` — driver: `converted_amount`

Calls `updateConvertedAmount(view, form, true)` (recompute `conversion_rate = converted / actual`).

#### 2.2.12 Grid-level amount onChanges

- `orderInvoiceAmountOnChange(item, view, form, grid)` — `updateActualExpected(form)` then `updateInvOrderTotal(form, grid)`.
- `orderInvoiceTotalAmountOnChange(item, view, form, grid)` — `updateActualExpected(form)` then `updateTotal(form)`.
- `glItemTotalAmountOnChange(item, view, form, grid)` — `updateActualExpected(form)` then `updateTotal(form)`.
- `glItemAmountOnChange(item, view, form, grid)` — mutually exclusive cleanup: when `received_in` becomes non-zero, force `paidOut = 0` on the same row; when `paid_out` becomes non-zero, force `receivedIn = 0`. Then `updateGLItemsTotal(form, item.rowNum, false)`, `updateActualExpected(form)`, `updateDifference(form)`.
- `updateCreditOnChange(item, view, form, grid)` — `updateCreditTotal(form)`, if `issotrx` then `distributeAmount(view, form, true)`, then `updateDifference(form)` and `updateActualExpected(form)`.

### 2.3 Multi-currency logic

#### 2.3.1 `paymentMethodMulticurrency(view, form, recalcConvRate)`

Central handler invoked by org / paymentMethod / financialAccount / paymentDate / currency changes and at onLoad. Reads `fin_financial_account_id`, `fin_paymentmethod_id`, `issotrx`, `c_currency_id`, `payment_date`, `ad_org_id`, `trxtype`.

Guard: when `payment_date` is `undefined`, shows the `APRM_PAYMENTDATE_MISSING` error in the modal's message bar and returns `false`.

RPC: `PaymentMethodMulticurrencyActionHandler` with `{ paymentMethodId, currencyId, isSOTrx, financialAccountId, paymentDate, orgId }`.

Callback handles:

- If `data.currencyId` is set: writes `c_currency_id` value and `valueMap[currencyId] = currencyIdIdentifier`.
- Computes `isShown = data.isPayIsMulticurrency && currencyId !== data.currencyToId && currencyId !== undefined`.
- If `data.isWrongFinancialAccount && trxtype === ''`: clears `fin_financial_account_id`.
- Else (financial account is OK): writes `c_currency_to_id` value + identifier; if `recalcConvRate`, also writes `conversion_rate` and `converted_amount`, then calls `updateConvertedAmount(view, form, false)`.
- Toggles `visible` of `conversion_rate`, `converted_amount`, `c_currency_to_id` to `isShown`. Redraws.
- Bookkeeping for sync flags: `becameVisible = isShown && !_mcShownPrev`. If `!isShown`, resets `_mcSyncedOnce` and `_mcPendingSyncMC` to `false`. If `becameVisible`, sets `_mcPendingSyncMC = true` and `_mcSyncedOnce = false`. Persists `_mcShownPrev = isShown`.

#### 2.3.2 `getConvertedAmount(form, amount, directConversion)`

Reads `StdPrecision` and `conversion_rate`. Uses `BigDecimal.ROUND_HALF_UP`.

- `directConversion === true`: `amount × rate` rounded to `StdPrecision`.
- Otherwise: `amount ÷ rate` at scale `StdPrecision`.

#### 2.3.3 `updateConvertedAmount(view, form, recalcExchangeRate)`

Reads `actual_payment`, `converted_amount`, `conversion_rate`.

- `recalcExchangeRate === true`: when `actual_payment !== 0`, writes `conversion_rate = converted_amount / actual_payment` at scale **15** with `ROUND_HALF_UP`. When `actual_payment === 0`, resets `conversion_rate` to `1`.
- Otherwise (and rate exists): writes `converted_amount = getConvertedAmount(actual_payment, true)` and re-asserts the same rate.

#### 2.3.4 `isMultiCurrency(form)`

Returns true if both `c_currency_id` and `c_currency_to_id` are set and different.

#### 2.3.5 `syncActualWithExpectedIfMC(form)`

No-op if MC is not active. Otherwise:

1. Sets `actual_payment = expected_payment` while toggling `_mcAutoSync = true` (so onChange handlers can detect a programmatic update).
2. Resets `_mcActualTouched = false`.
3. If `issotrx`, calls `distributeAmount(null, form, true)`.
4. Calls `updateDifference(form)`, `updateConvertedAmount(null, form, false)`, `applyBankAmountToConverted(form)`.

#### 2.3.6 MC sync flag summary

| Flag | Meaning |
|---|---|
| `_mcShownPrev` | Whether MC fields were visible during the previous calculation cycle. |
| `_mcSyncedOnce` | Latches that the one-shot expected → actual sync has happened. |
| `_mcPendingSyncMC` | Queue that a sync needs to run once expected/actual are stable. |
| `_mcSyncInProgress` | Re-entrancy guard while the sync is executing. |
| `_mcActualTouched` | User manually edited `actual_payment`. |
| `_mcAutoSync` | Internal flag set while the system programmatically writes `actual_payment`. |

The sync trigger lives inside `updateActualExpected(form)`: it fires when `!_mcSyncInProgress`, `_mcPendingSyncMC`, MC active, `expected > 0`, and (`actual === 0` or `!_mcActualTouched`).

#### 2.3.7 Bank Statement Line interaction

- `hasBslAmount(form)` — true when `bslamount` is a non-zero number.
- `applyBankAmountToConverted(form)` — when a BSL amount is present:
  1. Enters `_bslApplying = true`.
  2. Writes `converted_amount = |bslamount|`.
  3. If `actual_payment > 0`: recomputes the rate via `updateConvertedAmount(null, form, true)` and clears `_pendingRecalcRateFromBSL`.
  4. Otherwise: queues `_pendingRecalcRateFromBSL = true` to be applied when the user enters `actual_payment` later.
  5. Exits `_bslApplying = false`.

### 2.4 Order / invoice grid behaviors

#### 2.4.1 `ordInvDataArrived(startRow, endRow)`

1. Calls super.
2. Re-applies `setEditValues(...)` for every currently selected record (preserves user edits across fetches).
3. If `_aprmAutoDistributeInProgress` is set on the grid: schedules a 0 ms `Timer.setTimeout` to call `distributeAmount(view, form, false)` — gives the grid one paint frame before redistributing.

#### 2.4.2 `ordInvTransformData(newData, dsResponse)`

Runs on every data fetch of `order_invoice` (registered via `dataProperties.transformData`).

- Skips when the data source is not `order_invoice`.
- If `grid.changedTrxType`: clears `selectedIds`, `deselectedIds`, `data.savedData`.
- For each record:
  - Normalises `record.id`, `record.invoiceNo`, `record.salesOrderNo` via `orderAndRemoveDuplicates` (strip spaces, split by `,`, sort, dedupe, rejoin with `", "`).
  - When `changedTrxType && editedSelectedRecords.length >= 1`:
    - `curPending = curOutstandingAmt − curAmount`. For every previously selected record whose `ids` intersect the current record's id (via `checkContainsAny`):
      - If `selectedRecord.amount > curPending`: pin `curAmount = curOutstandingAmt`; reduce `selectedRecord.amount` by `curPending`.
      - Otherwise: `curAmount += selectedRecord.amount`; zero out `selectedRecord.amount`.
      - Propagates `Writeoff = true` to the new record if any matched selection had it.
      - Marks `record.obSelected = true`.
    - If any match found, writes the redistributed `amount` back onto the record, pushes the id into `selectedIds`, the record into `pneSelectedRecords`, and a snapshot into `data.savedData`.
- Clears `changedTrxType` at the end.

#### 2.4.3 `selectionChanged(record, state)` and `doSelectionChanged(record, state, view)`

`selectionChanged` debounces through `fireOnPause('selectionChanged' + record.id, ..., 200)` and skips when `preventDistributingOnSelectionChanged` is set. It always invokes super.

`doSelectionChanged`:

1. Computes the remaining `amount = actual_payment − amount_inv_ords − amount_gl_items + used_credit`.
2. Reads `issotrx`, the record's `outstandingAmount`, and `bslamount`.
3. If `issotrx`:
   - On select with non-zero remaining: caps the row's `amount` at `min(outstandingAmount, amount)` taking sign into account (negative-with-negative uses `abs` comparison).
   - If remaining is zero, sets the row's `amount` to `0`.
4. Otherwise (purchase):
   - If `bslamount !== 0`: caps by `min(outstanding, amount)`.
   - Else: uses `outstanding` directly.
5. Triggers `updateInvOrderTotal`, `updateActualExpected`, `updateDifference`, `applyBankAmountToConverted` — but only on the last row when the change came from a "select all" cycle, as detected via `obaprmAllRecordsSelectedByUser`. Clears the all-selected marker afterwards.

#### 2.4.4 `userSelectAllRecords` and `deselectAllRecords`

Both wrap super after setting `obaprmAllRecordsSelectedByUser = true` so that subsequent per-row `doSelectionChanged` invocations defer recomputation until the final row.

#### 2.4.5 `orderInvoiceGridValidation(item, validator, value, record)`

Cell validator. Returns `false` and writes a message-bar error when:

- `record.amount` is not a number → `APRM_NotValidNumber`.
- `|outstanding| < |paid|` → `APRM_MoreAmountThanOutstanding`.
- `paid === 0 && writeoff === false` → `APRM_JSZEROUNDERPAYMENT`.
- Sign mismatch (`paid > 0 && outstanding < 0` or vice versa) → `APRM_ValueOutOfRange`.

#### 2.4.6 `_requestNextOrderInvoicePage(grid)`

Loads the next chunk of records via `data.getRange(startRow, endRow)` while `cachedRows < totalRows`. Sets `_aprmAutoDistributeInProgress = true` so `ordInvDataArrived` schedules another `distributeAmount` after each page arrives. Page size = `resultSize || pageSize || dataPageSize || 100`.

### 2.5 Credit grid behaviors

#### 2.5.1 `selectionChangedCredit(record, state)`

Debounced 200 ms via `fireOnPause('selectionChangedCredit' + record.id, ...)`; delegates to `doSelectionChangedCredit`. Skips when `preventDistributingOnSelectionChanged` is set.

#### 2.5.2 `doSelectionChangedCredit(record, state, view)`

- On select: writes `paymentAmount = outstandingAmount` for the row.
- On deselect: writes `paymentAmount = '0'`.
- On the last row of a "select all" cycle (or on any single-row change), calls `updateCreditTotal(form)`, `updateActualExpected(form)`, and if `issotrx`, `distributeAmount(view, form, true)`.

#### 2.5.3 `creditValidation(item, validator, value, record)`

Cell validator. Returns `false` with a message bar error when:

- `record.paymentAmount` is not a number → `APRM_NotValidNumber`.
- `|outstanding| < |paid|` → `APRM_MoreAmountThanOutstanding`.
- `paid === 0` → `aprm_biggerthanzero`.

#### 2.5.4 `updateCreditTotal(form)`

Sums `paymentAmount` across selected records via `getEditedCell` and writes the result into `used_credit`. Calls `updateTotal(form)`.

### 2.6 GL Items grid behaviors

#### 2.6.1 `removeRecordClick(rowNum, record)`

Calls super then `updateGLItemsTotal(form, rowNum, true)`.

#### 2.6.2 `updateGLItemsTotal(form, rowNum, remove)`

Walks `data.allRows` (skipping `rowNum` when `remove` is true). For each row:

- If `issotrx`: `total += received_in − paid_out`.
- Else: `total += paid_out − received_in`.

If there are no rows, total is `0`. Writes `amount_gl_items`, calls `updateTotal(form)`, then triggers display-logic recalc for `overpayment_action_display_logic`.

#### 2.6.3 `glItemAmountOnChange(item, view, form, grid)`

Implements mutual exclusion between `received_in` and `paid_out` for the same row, then cascades into `updateGLItemsTotal`, `updateActualExpected`, `updateDifference`.

### 2.7 Distribute, totals and difference

#### 2.7.1 `distributeAmount(view, form, onActualPaymentChange)`

Core auto-distribution algorithm.

Reads: `actual_payment`, `used_credit`, `amount_gl_items`, `issotrx`, `fin_payment_id`, the order/invoice grid's `data.localData`, `totalRows`, `cachedRows`.

Preference gate: skipped entirely when `OB.PropertyStore.get('APRM_AutoDistributeAmt')` returns `'N'` or `'"N"'`.

Partial-data handling: when `cachedRows < totalRows`:

- If `OB.PropertyStore.get('APRM_ShowNoDistributeMsg')` is not `'N'`/`'"N"'`, shows an info message in `orderInvoice.contentView.messageBar` built from labels `APRM_NoDistributeMsg` and `OBUIAPP_NeverShowMessageAgain`. The "never show again" anchor calls `OB.PropertyStore.set('APRM_ShowNoDistributeMsg', 'N')` and hides the bar.
- Otherwise, if the info message is currently visible, hides it.

Algorithm:

1. `amount = actual_payment − amount_gl_items + used_credit`.
2. Special case: when `issotrx && isMultiCurrency` and `amount === 0` and `expected_payment > 0`, use `expected_payment` as `amount`.
3. Pre-pass: `negativeamt = Σ |outstanding|` for rows with negative outstanding.
4. If `amount > −negativeamt && (onActualPaymentChange || payment)`, increases `amount += negativeamt` (negatives get paid first).
5. For each row (skipping empty objects, and skipping writeoff rows when `issotrx` after subtracting their amount from `amount`):
   - If `payment && !onActualPaymentChange && record.obSelected`: use the stored `amount` as the row's outstanding.
   - Otherwise, cap `outstandingAmount` at `min(outstanding, amount)` taking sign into account (negative-with-negative path uses `abs`).
   - Sets `preventDistributingOnSelectionChanged = true` while toggling selection to suppress re-entrant `selectionChanged`.
   - Three branches on `amount.signum()`:
     - `0`: if `outstanding < 0 && (onActualPaymentChange || payment)`, write the row's `amount = outstandingAmount` and select; else deselect and write `amount = 0`.
     - `+1`: write the row's `amount = outstandingAmount`, select, and decrement `amount` by `outstandingAmount` when `outstandingAmount >= 0 || amount <= 0`.
     - `−1`: when `outstanding < 0`, write `amount = outstandingAmount`, select, decrement; otherwise deselect and write `0`.
6. After the loop: calls `updateActualExpected(form)`.
7. If partial data remains and `amount !== 0`, calls `_requestNextOrderInvoicePage(grid)` to fetch more rows and continue distributing.
8. Otherwise clears `_aprmAutoDistributeInProgress`.
9. Always calls `updateInvOrderTotal(form, orderInvoice)` at the end.

#### 2.7.2 `updateInvOrderTotal(form, grid)`

Sums `amount` from edited cells across `selectedIds`, writes `amount_inv_ords`, calls `updateTotal(form)`.

#### 2.7.3 `updateTotal(form)`

`total = amount_inv_ords + amount_gl_items`. Then `updateDifference(form)`.

#### 2.7.4 `updateDifference(form)`

- `diffAmt = actual_payment + used_credit − total`.
- `expectedDiffAmt = expected_payment + used_credit − total + amount_gl_items`.
- Writes `difference = diffAmt`. Writes `expectedDifference = expectedDiffAmt`, falling back to `diffAmt` when `expectedDiffAmt === 0`.
- If `diffAmt !== 0`, calls `updateDifferenceActions(form)`.
- Always pushes `overpayment_action_display_logic` into `affectedParams` and triggers display-logic recalc.

#### 2.7.5 `updateDifferenceActions(form)`

Rebuilds the `overpayment_action` value map (Credit / Refund):

1. When `trxtype !== ''`, recomputes `isCreditAllowed = received_from is set`.
2. If `isCreditAllowed`:
   - Always allow `CR` (from `originalValueMap.CR`).
   - If `issotrx || actualPayment === 0`, also allow `RE` (refund).
   - Else, prefill `defaultValue = 'CR'`.
3. `setValueMap(newValueMap)` and `setValue(defaultValue)` (empty string when not allowed).

#### 2.7.6 `updateActualExpected(form)`

1. Sums `outstandingAmount` and `amount` from edited cells across selected order/invoice records.
2. Writes `expected_payment = sum(outstandingAmount)` when there is at least one selection, else `0`.
3. When `!issotrx`:
   - `actpayment = totalAmount + amount_gl_items + generateCredit`.
   - Writes `actual_payment = actpayment`.
   - If `used_credit > 0`: when `used_credit > actpayment`, write `actual_payment = 0`; otherwise `actual_payment = actpayment − used_credit`.
   - If `bslamount !== 0`: convert `|bslamount|` via `getConvertedAmount(..., false)`; when `actpayment <= |converted|`, override `actual_payment = |converted|`.
   - Calls `updateDifference(form)` and `updateConvertedAmount(null, form, false)`.
4. MC sync trigger (see §2.3.6).
5. Calls `form.redraw()` and `applyBankAmountToConverted(form)`.

#### 2.7.7 `checkSingleActionAvailable(form)`

Fetches the value map for `document_action`. When `totalRows === 1`, selects the only available value via `setValueFromRecord(data[0])`. Otherwise `clearValue()`.

### 2.8 Backend RPC calls

All calls go through `OB.RemoteCallManager.call(className, payload, {}, callback)`.

| ActionHandler classname | Request payload | Response keys consumed | Invoked from |
|---|---|---|---|
| `org.openbravo.advpaymentmngt.actionHandler.PaymentMethodMulticurrencyActionHandler` | `{ paymentMethodId, currencyId, isSOTrx, financialAccountId, paymentDate, orgId }` | `currencyId`, `currencyIdIdentifier`, `currencyToId`, `currencyToIdentifier`, `isPayIsMulticurrency`, `isWrongFinancialAccount`, `conversionrate`, `convertedamount` | `paymentMethodMulticurrency` (onLoad + onChanges) |
| `org.openbravo.advpaymentmngt.actionHandler.AddPaymentDocumentNoActionHandler` | `{ organization, issotrx }` | `payment_documentno` | `documentOnChange` |
| `org.openbravo.advpaymentmngt.actionHandler.AddPaymentOrganizationActionHandler` | `{ organization }` | `currency`, `currencyIdIdentifier` | `organizationOnChange` |
| `org.openbravo.advpaymentmngt.actionHandler.ReceivedFromPaymentMethodActionHandler` | `{ receivedFrom, isSOTrx, financialAccount }` | `paymentMethodId`, `paymentMethodName` | `receivedFromOnChange` |
| `org.openbravo.advpaymentmngt.actionHandler.AddPaymentDisplayLogicActionHandler` | `{ affectedParams, params }` where `params.context = form.paramWindow.getContextInfo()` with `order_invoice` / `credit_to_use` / `glitem` keys deleted, plus optional `inpwindowId` from `parentWindow.windowId` | `values` (map keyed by field `dBColumnName`; each value is a scalar or `{ value, identifier }`) | `recalcDisplayLogicOrReadOnlyLogic` |
| `org.openbravo.advpaymentmngt.actionHandler.AddPaymentReloadLabelsActionHandler` | Empty body; in the legacy classic API `params` is the third argument: `{ businessPartner: received_from.paramId, financialAccount: fin_financial_account_id.paramId, issotrx }` | `values.businessPartner`, `values.financialAccount` (used as new titles) | `reloadLabels` |
| `org.openbravo.advpaymentmngt.actionHandler.AddPaymentOnProcessActionHandler` | `{ issotrx, receivedFrom, currencyId, usesCredit (used_credit !== 0), generatesCredit (overpayment visible && action === 'CR'), selectedRecords, finFinancialAccount }` | `message.severity`, `message.title`, `message.text`, `writeofflimit` | `onProcess` (pre-submit guard) |

#### 2.8.1 `recalcDisplayLogicOrReadOnlyLogic(form, view, affectedParams)`

1. Builds `params.context = form.paramWindow.getContextInfo()` and deletes the three grid blobs (`order_invoice`, `credit_to_use`, `glitem`) before sending — they're huge and unused by the server-side display logic.
2. Adds `params.context.inpwindowId = parentWindow.windowId` when invoked from a child window.
3. Debounces via `view.fireOnPause('recalcDisplayLogicOrReadOnlyLogic' + affectedParams, ..., 200)`.
4. Callback iterates `data.values`: for scalar entries, writes typed value via `paramWindow.getTypeSafeValue(field.typeInstance, def)`; for `{ identifier, value }` entries, merges the identifier into the field's `valueMap` and writes the value. Then calls `view.handleReadOnlyLogic()`, redraws the form, and calls `view.handleButtonsStatus()`.
5. When `values.credit_to_use_display_logic === 'Y'`, fetches `credit_to_use` with a dummy criterion (cache-busting).

#### 2.8.2 `reloadLabels(form)`

Sends `params.businessPartner = received_from.paramId`, `params.financialAccount = fin_financial_account_id.paramId`, `params.issotrx`. On response, sets `received_from.title` and `fin_financial_account_id.title` and calls `form.markForRedraw()`.

### 2.9 Final submission — `onProcess(view, actionHandlerCall, clientSideValidationFail)`

Pre-checks run in this order; any failure shows a message-bar error and returns `clientSideValidationFail()`:

1. Compute `totalOustandingAmount = Σ outstanding(selectedRecords)` and `totalWriteOffAmount = Σ (outstanding − amount) for rows where writeoff === true` (using `getEditedRecord` for current values, falling back to `getRecord` for stored values).
2. If `overpayment_action` is set AND `received_from === null` → `APRM_CreditWithoutBPartner`.
3. If `total < 0` AND `used_credit !== 0` → `APRM_CreditWithNegativeAmt`.
4. If `actual_payment > total − used_credit` AND `totalOutstanding > amount_inv_ords + totalWriteOffAmount` → `APRM_JSNOTALLAMOUTALLOCATED` (not all amount distributed).
5. Else if `total > actual_payment + used_credit` → `APRM_JSMOREAMOUTALLOCATED` (over-distribution).
6. If `used_credit !== 0` AND `total < used_credit` AND `overpayment_action` field is visible AND `overpayment_action === 'CR'` → `APRM_MORECREDITAMOUNT`.
7. If `trxtype !== '' && trxtype !== null` AND (`actual_payment === 0` OR `totalOutstanding === 0`) AND `amount_gl_items === 0` AND `view.parentWindow.windowId` is set AND `!overpayment_action` → `APRM_ZEROAMOUNTPAYMENTTRANSACTION`.
8. For each GL item row: if `received_in === 0 && paid_out === 0` → `APRM_GLITEMSDIFFERENTZERO`.

After all pre-checks pass, the legacy calls `AddPaymentOnProcessActionHandler`. The callback:

- If `data.message.severity === 'error'`: shows the message in the bar and aborts.
- If `WriteOffLimitPreference === 'Y'` AND `totalWriteOffAmount > data.writeofflimit` → `APRM_NotAllowWriteOff` and aborts.
- Otherwise calls `actionHandlerCall()` — the standard process submission entry point that actually runs the Java handler.

### 2.10 Grid filtering / criteria logic

After any field change that affects the candidacy of orders/invoices (`trxtype`, `c_currency_id`, `ad_org_id`, `received_from`, `paymentMethodOnChange`), the code does:

1. Reads current criteria via `ordinvgrid.getCriteria()`.
2. Calls `ordinvgrid.addSelectedIDsToCriteria(criteria, true)` to keep previously selected records visible across refetches.
3. Appends `isc.OBRestDataSource.getDummyCriterion()` to force a fetch even when the criteria appear unchanged.
4. Calls `ordinvgrid.invalidateCache()` and `form.redraw()`.

`paymentMethodOnChange` additionally merges `{ paymentMethodName: <new>}` into the grid's filter editor via `setFilterEditorCriteria` + `filterByEditor`.

`transactionTypeOnChangeFunction` snapshots edited selected records into `grid.editedSelectedRecords` before refetching, so `ordInvTransformData` can redistribute the existing amounts across the new candidate rows.

### 2.11 Writeoff / overpayment / underpayment / credit / refund

- The `writeoff` flag lives per order/invoice row. Rows where `writeoff === true && issotrx` are skipped from the distributable pool inside `distributeAmount`: their amount is subtracted from `amount` first, but the row itself is not redistributed onto.
- Writeoff totals: `totalWriteOffAmount = Σ (outstanding − amount)` across all rows where `writeoff === true`. Used at submit time and for the limit check.
- `overpayment_action` value map (`CR` / `RE`):
  - Original value map saved at onLoad in `overpaymentAction.originalValueMap`.
  - `updateDifferenceActions` regenerates the available subset:
    - Only available when `isCreditAllowed` (i.e. `received_from` is set). For `trxtype !== ''`, the flag is recomputed live.
    - `RE` only when `issotrx || actual_payment === 0`. Otherwise the default action is `CR`.
- Credit lifecycle:
  - `used_credit` aggregates selected `credit_to_use` rows.
  - `generateCredit` is included in the `actpayment` math inside `updateActualExpected` when `!issotrx`.
  - `credit_to_use_display_logic` toggles visibility of the credit grid; when flipped to `'Y'` by the server, the grid is freshly fetched.
- Refund path is pure metadata — the server handles it. The JS only enforces eligibility via the message bar rules and the `RE` value-map slot.

### 2.12 Defaults and initial value injection

| Field | Source |
|---|---|
| `bankStatementLineId` | Dynamically added at onLoad when caller chain matches Match Statement → Add Transaction → Add Payment. |
| `payment_documentno` | `AddPaymentDocumentNoActionHandler` on `documentOnChange` (and onLoad indirectly when `trxtype` is initially set). |
| `c_currency_id` | `AddPaymentOrganizationActionHandler` on `organizationOnChange`. |
| `fin_paymentmethod_id` | `ReceivedFromPaymentMethodActionHandler` on `receivedFromOnChange` (only when `trxtype !== ''`). |
| `c_currency_to_id`, `conversion_rate`, `converted_amount` | `PaymentMethodMulticurrencyActionHandler`. |
| `document_action` | `checkSingleActionAvailable` (auto-select when a single value is available). |
| `overpayment_action` | Derived in `updateDifferenceActions` (CR when not `issotrx`, actual > 0, credit allowed). |
| Multi-currency reload at onLoad | Suppressed when `fin_payment_id` is already set (re-opening an existing payment). |
| Default value expressions in AD | The AD JSON expresses many defaults via `OB.getFilterExpression("...AddPaymentDefaultValuesExpression")`. Those expressions are server-resolved at parameter load. |

### 2.13 Utility helpers

- `orderAndRemoveDuplicates(val)` — trims spaces, splits by `,`, sorts, removes duplicates, rejoins with `", "`. Used to normalise composite `id`, `invoiceNo`, `salesOrderNo` cells that may contain multiple values.
- `getConvertedAmount(form, amount, directConversion)` — see §2.3.2.
- `isMultiCurrency(form)` — see §2.3.4.
- `hasBslAmount(form)` — see §2.3.7.
- `applyBankAmountToConverted(form)` — see §2.3.7.

### 2.14 Messages, dialogs, popups

The legacy "Add Payment" never opens dedicated dialogs. All messages render in one of three message bars:

- `view.messageBar` — the process modal bar (validations on submit, missing payment date, server errors).
- `orderInvoice.contentView.messageBar` — the info bar under the order/invoice grid (partial-cache distribute message).
- `item.grid.view.messageBar` — per-grid message bar used by cell validators.

The GL Items section auto-expands when the GL grid has preselected rows. The section id used by `expandSection` is `7B6B5F5475634E35A85CF7023165E50B`.

### 2.15 External references and runtime dependencies

| Dependency | Usage |
|---|---|
| `OB.RemoteCallManager.call(class, payload, {}, callback, ?clientContext)` | Generic JSON-RPC client. The new UI's `callAction` wrapper must include `inpwindowId` in the request context. |
| `OB.I18N.getLabel(key)` | Translation lookup. The new UI must load every key listed in §2.16. |
| `OB.PropertyStore.get(key, ?windowId)` / `OB.PropertyStore.set(key, value)` | User-scoped preferences. Used keys: `APRM_AutoDistributeAmt`, `APRM_ShowNoDistributeMsg`, `WriteOffLimitPreference`. |
| `BigDecimal` (SmartClient port) | All amount math. Rounding: `ROUND_HALF_UP`. Scale: `StdPrecision` (currency precision). Division for the rate (`converted ÷ actual`) uses scale **15**. The new UI must use an equivalent decimal library (`big.js`, `decimal.js`) to keep parity. |
| `isc.OBRestDataSource.getDummyCriterion()` | Forces a fetch even when criteria appear unchanged. The new UI's data-source layer needs an equivalent cache-bust strategy. |
| `OBTextItem`, `OBMessageBar`, `OBPopup`, `OBRestDataSource` | SmartClient classes fully replaced by React components. |
| SmartClient `ListGrid` overrides (`selectionChanged`, `userSelectAllRecords`, `deselectAllRecords`, `dataArrived`, `dataProperties.transformData`, `removeRecordClick`) | Translate into controlled React grid event handlers. |
| Caller-chain references `view.callerField...record.affinity / .matchingType` and `view.parentWindow.windowId` | The new UI must propagate caller context (parent window id, parent record affinity/matchingType) through props/context to support nested invocation (Match Statement → Add Transaction → Add Payment). |

### 2.16 Label keys to provision

Client-side message bar (must render in the new UI):

- `APRM_PAYMENTDATE_MISSING`
- `APRM_NoDistributeMsg`
- `OBUIAPP_NeverShowMessageAgain`
- `APRM_NotValidNumber`
- `APRM_MoreAmountThanOutstanding`
- `APRM_JSZEROUNDERPAYMENT`
- `APRM_ValueOutOfRange`
- `aprm_biggerthanzero`
- `APRM_CreditWithoutBPartner`
- `APRM_CreditWithNegativeAmt`
- `APRM_JSNOTALLAMOUTALLOCATED`
- `APRM_JSMOREAMOUTALLOCATED`
- `APRM_MORECREDITAMOUNT`
- `APRM_ZEROAMOUNTPAYMENTTRANSACTION`
- `APRM_GLITEMSDIFFERENTZERO`

Server-surfaced (returned from `AddPaymentOnProcessActionHandler` and shown via the same bar):

- `APRM_NotAllowWriteOff`
- `data.message.{severity,title,text}` (free-form, server-controlled — e.g. blocked business partner)

### 2.17 Edge cases the new UI must handle

1. Opening with `fin_payment_id` already set (editing) — multicurrency recalculation is suppressed.
2. `trxtype === ''` (called from Add Transaction) — field reordering, several handlers gated, `bankStatementLineId` may appear.
3. `trxtype === 'RCIN'` — forces `issotrx = true`.
4. `actual_payment === 0` with non-empty selection — must still allow refund / credit modes; `CR` forced when applicable.
5. Negative outstanding rows — negatives must be paid first when actual amount is large enough.
6. Mixed-sign selection (positive + negative outstanding) — cell validation rejects sign mismatch.
7. Multicurrency without rate — rate defaults to `1`, precision via `StdPrecision`.
8. Multicurrency visibility flip (became visible) — one-shot copy of `expected_payment` into `actual_payment`.
9. BSL flow — `bslamount` forces `converted_amount = |bslamount|`; drives `_pendingRecalcRateFromBSL` and `_bslApplying` guards.
10. Partial cached grid data during auto-distribute — paginate and continue distributing.
11. "Select all" cycles — defer recalcs to the last row.
12. Cache invalidation preserving previously-selected ids when filters change.
13. Writeoff limit (preference `WriteOffLimitPreference === 'Y'`) — blocks submit when exceeded (server-provided limit).
14. Preferences: `APRM_AutoDistributeAmt === 'N'` disables auto-distribute entirely; `APRM_ShowNoDistributeMsg === 'N'` suppresses the partial-cache info message.

---

## 3. Test checklist

This is the parity validation matrix. Every checkbox is a verifiable observation; QA executes them manually first, then the team can translate them into Cypress / Jest fixtures. Each group corresponds to one or more behavior sections in §2.

### 3.1 OnLoad lifecycle (§2.1)

- [ ] Opening the modal with no `fin_payment_id` triggers a fresh multicurrency recalculation (calls `PaymentMethodMulticurrencyActionHandler`).
- [ ] Opening the modal with `fin_payment_id` already set does NOT recalculate the conversion rate.
- [ ] When the caller chain is `Match Statement → Add Transaction → Add Payment`, a hidden `bankStatementLineId` field appears in the form and carries the parent record's id.
- [ ] When opened outside the BSL chain, `bankStatementLineId` is absent from the submission payload.
- [ ] `reloadLabels` updates the titles of `received_from` and `fin_financial_account_id` according to `issotrx` (different label for sales vs. purchase).
- [ ] Both `glitem` and `credit_to_use` grids are fetched on open.
- [ ] When `issotrx` is true at open time, `actual_payment` receives keyboard focus.
- [ ] When `trxtype === ''` at open time, the first three form items are displayed in the order: `trxtype`, `ad_org_id`, `bslamount`.
- [ ] `document_action` is auto-selected when its value map has exactly one entry; cleared when it has more than one.
- [ ] `tryToUpdateActualExpected` does not fire `updateActualExpected` until all three grids report ready.
- [ ] Reopening the modal with previously edited selections restores those edits in the order/invoice grid (`refreshEditedSelectedRecordsInGrid`).

### 3.2 Field reactivity (§2.2)

#### `organizationOnChange` (§2.2.1)
- [ ] Changing `ad_org_id` clears `fin_paymentmethod_id`, `received_from`, `fin_financial_account_id`.
- [ ] Changing `ad_org_id` calls `AddPaymentOrganizationActionHandler` and writes the returned `currency` into `c_currency_id` with the matching identifier.
- [ ] The `order_invoice` grid is invalidated and refetched, preserving filters and previously-selected ids.

#### `documentOnChange` (§2.2.2)
- [ ] Selecting `RCIN` forces `issotrx = true`; selecting any other value forces `issotrx = false`.
- [ ] Changing `trxtype` clears `fin_paymentmethod_id` and `received_from`.
- [ ] Changing `trxtype` clears `fin_financial_account_id` only when the modal is not nested under a parent window.
- [ ] Labels for `received_from` and `fin_financial_account_id` refresh after the change.
- [ ] `payment_documentno` is repopulated from `AddPaymentDocumentNoActionHandler` (only when `trxtype !== ''`).
- [ ] Display logic recalculates for `credit_to_use_display_logic` and `actual_payment_readonly_logic` (debounced).

#### `receivedFromOnChange` (§2.2.3)
- [ ] If the credit grid had selections, they are cleared.
- [ ] `ReceivedFromPaymentMethodActionHandler` is called and, if a `paymentMethodId` is returned, `fin_paymentmethod_id` is updated and `paymentMethodOnChange` cascades.
- [ ] `credit_to_use_display_logic` recalculation runs.

#### `paymentMethodOnChange` (§2.2.4)
- [ ] The `order_invoice` filter editor receives `paymentMethodName = <selected method name>`.
- [ ] Multicurrency recalc runs.
- [ ] When `trxtype !== ''`, the filter is applied to the grid (`setFilterEditorCriteria` + `filterByEditor`).
- [ ] `c_currency_id_readonly_logic` recalculation runs.

#### `financialAccountOnChange` (§2.2.5)
- [ ] Multicurrency recalc runs.
- [ ] `c_currency_id_readonly_logic` recalculation runs.

#### `paymentDateOnChange` (§2.2.6)
- [ ] Multicurrency recalc runs (rate depends on date).
- [ ] Emptying `payment_date` triggers the `APRM_PAYMENTDATE_MISSING` message in the modal's message bar and aborts the recalc.

#### `currencyOnChange` (§2.2.7)
- [ ] Changing `c_currency_id` triggers a multicurrency recalc only when `trxtype !== ''`.
- [ ] The `order_invoice` grid is invalidated and refetched.

#### `transactionTypeOnChangeFunction` (§2.2.8)
- [ ] Switching transaction type to the same value is a no-op (no fetch).
- [ ] Switching to a different value snapshots the current edited selections (with their `id` arrays) and refetches the order/invoice grid.
- [ ] After the fetch, previously-allocated amounts are redistributed across matching rows (writeoff propagated, `obSelected` set).

#### `actualPaymentOnChange` (§2.2.9)
- [ ] Editing `actual_payment` sets `_mcActualTouched = true`.
- [ ] When `issotrx`, editing `actual_payment` redistributes amounts across the order/invoice grid and updates `converted_amount`.
- [ ] When `_pendingRecalcRateFromBSL` is queued and the user enters a positive `actual_payment`, the rate is recomputed under the `_bslApplying` guard.

#### `conversionRateOnChange` (§2.2.10)
- [ ] Editing `conversion_rate` updates `converted_amount` as `actual × rate`.
- [ ] Editing `conversion_rate` while `_bslApplying` is set is a no-op.

#### `convertedAmountOnChange` (§2.2.11)
- [ ] Editing `converted_amount` updates `conversion_rate` as `converted / actual` (scale 15, `ROUND_HALF_UP`).

### 3.3 Multicurrency (§2.3)

- [ ] When source and target currencies match, MC fields (`conversion_rate`, `converted_amount`, `c_currency_to_id`) are hidden.
- [ ] When the response toggles MC visibility on for the first time, `_mcPendingSyncMC` becomes `true` and the one-shot expected → actual sync fires on the next `updateActualExpected`.
- [ ] When MC is active and the user has not touched `actual_payment`, the sync copies `expected_payment` into `actual_payment` exactly once per visibility cycle.
- [ ] When MC is active and `issotrx` and the distributable amount is zero but `expected_payment > 0`, `distributeAmount` falls back to using `expected_payment`.
- [ ] When `bslamount !== 0`, `converted_amount` is overridden with `|bslamount|`.
- [ ] When `bslamount` is set and `actual_payment > 0`, the rate is immediately recomputed from `converted / actual`.
- [ ] When `bslamount` is set and `actual_payment === 0`, the rate recalculation is queued (`_pendingRecalcRateFromBSL`) until the user enters an actual amount.
- [ ] When `data.isWrongFinancialAccount` is returned and `trxtype === ''`, `fin_financial_account_id` is cleared.
- [ ] When a payment date is empty during MC recalc, an `APRM_PAYMENTDATE_MISSING` error appears and the recalc aborts.

### 3.4 Order / invoice grid (§2.4)

- [ ] Cell validator rejects non-numeric amounts → message `APRM_NotValidNumber`.
- [ ] Cell validator rejects `|paid| > |outstanding|` → message `APRM_MoreAmountThanOutstanding`.
- [ ] Cell validator rejects `paid === 0 && !writeoff` → message `APRM_JSZEROUNDERPAYMENT`.
- [ ] Cell validator rejects sign mismatch between paid and outstanding → message `APRM_ValueOutOfRange`.
- [ ] Selecting a single row with non-zero remaining amount caps the row's amount at `min(outstanding, remaining)` taking sign into account.
- [ ] Selecting in purchase mode with `bslamount === 0` writes the row's `amount` directly to `outstandingAmount`.
- [ ] Selecting in purchase mode with `bslamount !== 0` caps `amount` at `min(outstanding, remaining)`.
- [ ] "Select all" recalculates totals only after the LAST row's per-row event (defers via `obaprmAllRecordsSelectedByUser`).
- [ ] After a transaction-type change, `ordInvTransformData` redistributes the previous selections across matching new rows; writeoff flags propagate.
- [ ] When `cachedRows < totalRows` during auto-distribute, `_requestNextOrderInvoicePage` fetches the next page and continues distributing.
- [ ] `id`, `invoiceNo`, `salesOrderNo` composite values are de-duplicated and joined with `", "` after a fetch.

### 3.5 Credit grid (§2.5)

- [ ] Selecting a row writes `paymentAmount = outstandingAmount`.
- [ ] Deselecting a row writes `paymentAmount = 0`.
- [ ] Cell validator rejects non-numeric paymentAmount → `APRM_NotValidNumber`.
- [ ] Cell validator rejects `|paid| > |outstanding|` → `APRM_MoreAmountThanOutstanding`.
- [ ] Cell validator rejects `paid === 0` → `aprm_biggerthanzero`.
- [ ] `used_credit` always equals the sum of `paymentAmount` across currently selected rows.
- [ ] After a credit selection change, when `issotrx`, the order/invoice distribution is rerun.
- [ ] Changing `received_from` while there is at least one selected credit row deselects all credits.

### 3.6 GL items grid (§2.6)

- [ ] Writing a non-zero `received_in` clears `paid_out` on the same row.
- [ ] Writing a non-zero `paid_out` clears `received_in` on the same row.
- [ ] When `issotrx`, `amount_gl_items` accumulates `received_in − paid_out` across rows.
- [ ] When `!issotrx`, `amount_gl_items` accumulates `paid_out − received_in`.
- [ ] Removing a row recalculates `amount_gl_items` without that row.
- [ ] When the GL Items section had preselected rows at open time, the section is auto-expanded.
- [ ] After any GL item change, `overpayment_action_display_logic` recalc is triggered (debounced).

### 3.7 Distribute, totals and difference (§2.7)

- [ ] When preference `APRM_AutoDistributeAmt === 'N'`, no auto-distribution happens.
- [ ] When `cachedRows < totalRows` and preference `APRM_ShowNoDistributeMsg` is on, the grid's info bar shows `APRM_NoDistributeMsg` plus the "never show again" link.
- [ ] Clicking the "never show again" link sets preference `APRM_ShowNoDistributeMsg = 'N'` and hides the bar.
- [ ] The pre-pass over rows with negative outstanding boosts `amount` by `negativeamt` only when `(actual change || existing payment)`.
- [ ] In `signum() === 1` branch (positive remaining), each row receives `amount = outstandingAmount` and is selected, and `amount` is decremented.
- [ ] In `signum() === −1` branch with negative outstanding, the row receives its full outstanding and is selected.
- [ ] Writeoff rows with `issotrx` reduce the distributable pool but are not redistributed onto.
- [ ] `amount_inv_ords` always equals the sum of edited amounts across selected order/invoice rows.
- [ ] `total === amount_inv_ords + amount_gl_items`.
- [ ] `difference === actual_payment + used_credit − total`.
- [ ] `expectedDifference === expected_payment + used_credit − total + amount_gl_items` and falls back to `difference` when zero.
- [ ] When `difference !== 0`, the `overpayment_action` value map is rebuilt with the right `CR` / `RE` slots.
- [ ] When `received_from` is empty, the overpayment value map is empty (no CR / RE).
- [ ] When `issotrx || actual_payment === 0`, both `CR` and `RE` are available; otherwise only `CR` with default = `CR`.
- [ ] After any change, `form.redraw()` runs so display logic re-evaluates against the new state.
- [ ] `expected_payment === Σ outstanding(selected)`; equals `0` when nothing is selected.
- [ ] In purchase mode (`!issotrx`), `actual_payment` is auto-populated as `totalAmount + amount_gl_items + generateCredit`, with credit subtraction and BSL override applied.

### 3.8 Display / read-only logic recalc (§2.8.1)

- [ ] Multiple onChange triggers within 200 ms collapse into a single backend call (debounced via `fireOnPause`).
- [ ] The request payload's `params.context` does not contain `order_invoice`, `credit_to_use` or `glitem`.
- [ ] When invoked from a child window, `params.context.inpwindowId === parentWindow.windowId`.
- [ ] Responses with `{ identifier, value }` entries merge the identifier into the field's `valueMap` and select the value.
- [ ] Scalar responses are typed via `getTypeSafeValue(field.typeInstance, def)`.
- [ ] When `values.credit_to_use_display_logic === 'Y'`, the credit grid is freshly fetched with a dummy criterion.
- [ ] After applying values, `view.handleReadOnlyLogic()`, `form.redraw()` and `view.handleButtonsStatus()` all run.

### 3.9 Backend ActionHandler contracts (§2.8)

For each handler, the migrated UI must send the documented payload and react to the documented response keys:

- [ ] `PaymentMethodMulticurrencyActionHandler` sends `paymentMethodId, currencyId, isSOTrx, financialAccountId, paymentDate, orgId`; consumes `currencyId`, `currencyIdIdentifier`, `currencyToId`, `currencyToIdentifier`, `isPayIsMulticurrency`, `isWrongFinancialAccount`, `conversionrate`, `convertedamount`.
- [ ] `AddPaymentDocumentNoActionHandler` sends `organization, issotrx`; writes `payment_documentno`.
- [ ] `AddPaymentOrganizationActionHandler` sends `organization`; writes `currency` (+ identifier) into `c_currency_id`.
- [ ] `ReceivedFromPaymentMethodActionHandler` sends `receivedFrom, isSOTrx, financialAccount`; writes `paymentMethodId` (+ identifier as `paymentMethodName`).
- [ ] `AddPaymentDisplayLogicActionHandler` sends `affectedParams, params` and applies `values` per §3.8.
- [ ] `AddPaymentReloadLabelsActionHandler` carries `businessPartner, financialAccount, issotrx` and applies `values.businessPartner` / `values.financialAccount` as field titles.
- [ ] `AddPaymentOnProcessActionHandler` sends `issotrx, receivedFrom, currencyId, usesCredit, generatesCredit, selectedRecords, finFinancialAccount`; consumes `message.{severity,title,text}` and `writeofflimit`.

### 3.10 Submission (OnProcess, §2.9)

All eight client-side validations run before contacting the server, in this order:

- [ ] Overpayment without business partner → `APRM_CreditWithoutBPartner`.
- [ ] Negative total with credit selected → `APRM_CreditWithNegativeAmt`.
- [ ] Actual payment exceeds total minus credit AND outstanding exceeds allocated + writeoff → `APRM_JSNOTALLAMOUTALLOCATED`.
- [ ] Total exceeds actual + credit → `APRM_JSMOREAMOUTALLOCATED`.
- [ ] Credit ≠ 0 AND total < credit AND overpayment field visible AND `overpayment_action === 'CR'` → `APRM_MORECREDITAMOUNT`.
- [ ] Zero-amount payment with `trxtype !== ''`, no GL items, inside a parent window, no overpayment → `APRM_ZEROAMOUNTPAYMENTTRANSACTION`.
- [ ] Any GL item row with both `received_in === 0` and `paid_out === 0` → `APRM_GLITEMSDIFFERENTZERO`.
- [ ] Server returns `message.severity === 'error'` → message shown, submission aborted.
- [ ] `WriteOffLimitPreference === 'Y'` and `totalWriteOffAmount > writeofflimit` → `APRM_NotAllowWriteOff`.
- [ ] After all validations pass, the Java action handler is invoked exactly once (no double-submission).

### 3.11 Caller-chain / nested flows (§2.15)

- [ ] When opened from `Match Statement → Add Transaction → Add Payment`, the BSL caller chain is detected and the runtime `bankStatementLineId` field appears in the form.
- [ ] When opened from a parent window, the display-logic request includes `inpwindowId = parentWindow.windowId`.
- [ ] When `trxtype === ''` at open time, the field reorder runs and `bslamount` becomes visible (subject to its display-logic flag).
- [ ] Inside the nested chain, clearing `trxtype` does NOT clear `fin_financial_account_id` (parent preserves it).

### 3.12 Preferences (§2.15)

- [ ] `APRM_AutoDistributeAmt === 'N'` disables auto-distribute entirely (no row is touched on `actual_payment` change).
- [ ] `APRM_ShowNoDistributeMsg === 'N'` keeps the partial-cache info message hidden.
- [ ] `WriteOffLimitPreference === 'Y'` activates the post-callback writeoff limit check.

### 3.13 Label keys (§2.16)

- [ ] Every label key listed in §2.16 renders in the user's language at runtime.
- [ ] Missing translations fall back to the key (or to a sensible default) without breaking the message bar.

### 3.14 Precision and rounding (§2.15)

- [ ] All amount math uses `ROUND_HALF_UP` rounding.
- [ ] `getConvertedAmount` rounds at scale `StdPrecision`.
- [ ] `updateConvertedAmount` divides converted / actual at scale **15**.
- [ ] Sample test vector (manual): `actual = 100`, `rate = 1.234567890123456`, `precision = 2` → `converted = 123.46` (half-up).
- [ ] Sample test vector (manual): `converted = 99.99`, `actual = 33.33` → `rate = 3.000000000000000`.
