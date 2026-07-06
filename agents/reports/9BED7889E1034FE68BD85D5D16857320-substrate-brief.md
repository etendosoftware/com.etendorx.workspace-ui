# Substrate fix brief — programmatic cell writes are dropped by a stale-value column validator

- **For:** the new-UI substrate / platform team (ETP-3748 frontend)
- **Reported by:** migration verifier (Add Payment migration QA)
- **Surfaced in:** Add Payment process `9BED7889E1034FE68BD85D5D16857320` (Window-Reference grids
  `order_invoice`, `credit_to_use`), but the bug is **generic** — see §7 (Scope).
- **File:** `client/packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx`
- **Severity:** blocker for any migrated Defined-Process that registers a grid cell validator
  (`setColumnValidator`) and also writes that cell programmatically (`setEditValue`).
- **Status of the migration:** `blocked` pending this fix. No JS change is required — the migrated process
  JS and the validator body are faithful to classic.

---

## 1. TL;DR

`WindowReferenceGrid.handleRecordChange` runs the registered per-column validator **before** persisting the
edit, and **returns early when the validator rejects**. But it passes the validator the **pre-write** cell
value (the row's current value) instead of the **new** value being written. So a programmatic
`grid.setEditValue(rowIndex, col, newValue)` is validated against the *old* cell value, and if that old
value fails the validator, the **new write is silently dropped** — it never reaches the persistence step.

In Add Payment this makes the auto-distribute / seeding code unable to ever set the editable `amount` /
`paymentAmount`: rows arrive with `amount = 0`, the validator rejects `0` (zero-amount underpayment), and
the legitimate write of the outstanding amount (e.g. `2.07`) is discarded. The rejection also raises the
user-facing error that is reported as a separate defect.

**Fix:** validate the **candidate post-write record** (`{ ...currentRowData, ...changes }`) and expose the
new value through the validator's `item.getValue()` / `value` argument, instead of the current cell value.

---

## 2. User-visible symptoms (current QA numbering)

1. **Problem #1** — On opening Add Payment (sales receipt on an invoice with outstanding `2.07`), the form
   shows **"A zero amount Payment cannot be left as an underpayment."** even though the user touched nothing.
2. **Problem #3 (root)** — The auto-selected Order/Invoice row's editable **`Amount` stays `0`**; classic
   initializes it to the row's outstanding (`2.07`).
3. **Problem #4** — The Credit To Use pre-selected row's editable **`Payment Amount` stays `0`** (same
   mechanism via the `paymentAmount` validator).

All three are the **same** substrate bug (see §6). Two earlier-reported issues — multicurrency fields
flashing, and a spurious "payment date is mandatory" on open — were already fixed by an earlier substrate
change ("Fix A", onLoad/validation deferred until after the async default/FIC seed) and are **not** part of
this brief.

---

## 3. Runtime evidence (instrumented `logs.txt`, 5th QA run)

The migrated process JS was temporarily instrumented (`AP_DEBUG`) to log each write and an immediate
read-back. Decisive lines:

```
[AP gridLoad:order_invoice] SETTLED; selectedCount= 0 rowCount= 10
[AP gridLoad:order_invoice] obSelectedCount= 0
[AP gridLoad:order_invoice] BRANCH= distribute
[AP distributeAmount] entry; actual_payment= 2.07 autoDistributeAmt= undefined rowCount= 10 ...
[AP distributeAmount] row i= 0 wrote amount= 2.07 readback= 0 outstanding= 2.07 selected= true   <-- wrote 2.07, read back 0
[AP updateActualExpected] selected row getEditedCell amount= 0 outstanding= 2.07                 <-- data store still 0
[AP updateActualExpected] result; expected_payment= 2.07 actual_payment= 0
```

Interpretation:
- `wrote amount= 2.07 readback= 0`: the script called `setEditValue(0, 'amount', 2.07)` and the **immediate,
  same-tick** `getEditValues(0).amount` returned `0`. The write did not take effect at the data layer.
- `getEditedCell` (which reads `gridApiRef.current.rows`) returns `0` → the value is missing from the data
  store, not merely from the display.
- `obSelectedCount= 0` → the delivered rows do not carry a pre-selection flag, so this is the normal
  auto-distribute open; the distribute branch is correct and computed the right value (`2.07`).

The corresponding user-facing message **"APRM_JSZEROUNDERPAYMENT"** (problem #1) appearing on open is
independent corroboration that the validator both **ran** and **returned false** (it raises that message and
returns `false` in the same branch — see §5).

---

## 4. Code path (exact)

All line numbers are in `components/ProcessModal/WindowReferenceGrid.tsx` at the time of writing; treat them
as anchors, not literals.

### 4.1 How a programmatic write enters the grid

A migrated script calls `grid.setEditValue(rowIndex, colName, value)`. The grid proxy routes this to the
controller (`scriptProxies.ts` → `grid.setEditValue = (i, c, v) => controller.setEditValue(i, c, v)`), and
`createEmbeddedGridController.setEditValue` (`:1454`) is:

```js
setEditValue: (rowIndex, colName, value) => {
  const record = rows()[rowIndex];                 // rows() === getApi().rows === gridApiRef.current.rows
  if (record) getApi().handleRecordChange(record, { [colName]: value });
},
```

`getEditValues` / `getEditedCell` both read back from the same `gridApiRef.current.rows` (`:1458-1463`).

### 4.2 `handleRecordChange` — the ordering bug (`:2912`)

Simplified, in order:

```js
const handleRecordChange = useCallback((row, changes) => {
  const records = localRecordsRef.current;
  ...
  // (a) declarative field interactions; for `amount` there is no sibling rule, so
  //     mergedChanges === changes and row.original is NOT mutated here.
  const mergedChanges = applyFieldInteractions(processId, parameter.dBColumnName, row, changes); // :2923

  if (mergedChanges !== changes) setSiblingPatchVersion(v => v + 1);                              // :2929

  // (b) VALIDATOR GATE — runs BEFORE persistence and returns early on reject:
  if (!inColumnOnChangeRef.current && columnValidatorRef.current.size > 0) {                      // :2936
    if (rejectByColumnValidator(row, mergedChanges, records)) return;                            // :2937  <-- early return drops the write
  }

  // (c) PERSISTENCE ("Fix B") — only reached if not rejected:
  const updatedRecords = applyEditToReadStore(gridApiRef.current.rows, row.id, mergedChanges);   // :2946
  if (updatedRecords) {
    setLocalRecords(updatedRecords);
    gridApiRef.current.rows = updatedRecords;       // synchronous read-store update            // :2956
    ...
  }
  fireCellEditHooks(row, mergedChanges);                                                          // :2982
}, [...]);
```

Because step (b) returns before step (c), a rejected write never persists — `getEditValues` / the display
keep the old value.

### 4.3 `rejectByColumnValidator` — the value bug (`:2845`)

```js
const rejectByColumnValidator = useCallback((row, mergedChanges, records) => {
  ...
  const rowData = (row.original ?? row);                 // :2850  the CURRENT row data (pre-write)
  let rejected = false;
  for (const colName of Object.keys(mergedChanges ?? {})) {
    const validator = columnValidatorRef.current.get(colName);
    if (!validator) continue;
    const item = buildColumnItemProxy(gridLoadFormHandle, rowData, colName, grid, view);  // item.getValue = () => rowData[colName]  (:2832)
    if (validator(item, undefined, rowData[colName], rowData) === false) {                // :2856  passes the OLD value + OLD record
      const prior = records.find(r => String(r.id) === String(row.id));
      if (prior && colName in prior) rowData[colName] = prior[colName];                   // revert (no-op here, already old)
      rejected = true;
    }
  }
  if (rejected) setSiblingPatchVersion(v => v + 1);
  return rejected;
}, [...]);
```

The validator is invoked with `rowData[colName]` (the value arg) and `rowData` (the record arg), **both of
which hold the pre-write value**, never `mergedChanges[colName]`. For a programmatic `setEditValue`, `row`
is a plain `EntityData` from `gridApiRef.current.rows` (no `.original`), so `rowData = row` and
`rowData.amount` is the row's current `0`.

> Note: this is also wrong for **interactive** edits — a user typing a valid value into a cell whose prior
> value was invalid (or vice-versa) is validated against the prior value. The bug is just most visible for
> programmatic writes because they begin from the default `0`.

---

## 5. The migrated validator (faithful — for context, do NOT change it)

`em_etmeta_payscript_logic` registers, in the `order_invoice` `on_grid_load`:

```js
grid.setColumnValidator('amount', (item, validator, value, record) =>
  AP.orderInvoiceGridValidation(item, validator, value, record));
```

`AP.orderInvoiceGridValidation` reads `record.amount` and `record.outstandingAmount` (it does **not** use the
`value` arg), mirroring classic `ob-aprm-addPayment.js`:

```js
AP.orderInvoiceGridValidation = (item, validator, value, record) => {
  const outstanding = bd(record.outstandingAmount);
  const paidamount  = bd(record.amount);
  if (!isNum(record.amount)) { ...; return false; }
  if (outstanding.abs().compareTo(paidamount.abs()) < 0) { ...APRM_MoreAmountThanOutstanding; return false; }
  if (paidamount.signum() === 0 && record.writeoff === false) { ...APRM_JSZEROUNDERPAYMENT; return false; } // <-- fires on amount=0
  if ((paidamount.signum() < 0 && outstanding.signum() > 0) || ...) { ...APRM_ValueOutOfRange; return false; }
  return true;
};
```

With the bug, `record` = the pre-write row → `paidamount = 0` → the `APRM_JSZEROUNDERPAYMENT` branch returns
`false`. With the value fed correctly (`amount = 2.07`, `outstanding = 2.07`), every branch passes and it
returns `true`.

`credit_to_use` registers an analogous `setColumnValidator('paymentAmount', …)` → `AP.creditValidation`,
which is why problem #4 has the same root.

---

## 6. Why one bug = three symptoms

- **#3** — distribute/seed computes `amount = outstanding` and calls `setEditValue`; the validator rejects on
  the stale `0`; the write is dropped; the cell stays `0`. The row stays `0`, so the next write re-evaluates
  `0` and is rejected again — the value can **never** be set. Self-perpetuating.
- **#4** — identical, via the `paymentAmount` validator on the credit grid.
- **#1** — the user-facing **"A zero amount Payment cannot be left as an underpayment"** is exactly the
  `APRM_JSZEROUNDERPAYMENT` message raised by that rejecting validator while it (wrongly) evaluates the
  pre-write `0`. It is not a separate defect; it is a side effect of the same rejection.

---

## 7. Scope / generality (why this matters beyond Add Payment)

This is **not** Add-Payment-specific. Any migrated process that:
1. registers a grid cell validator with `setColumnValidator(col, fn)`, **and**
2. writes that column programmatically with `setEditValue` (distribution, seeding, cascades),

will have its programmatic writes validated against the **prior** cell value and dropped whenever the prior
value fails. It also mis-validates interactive edits (validates the previous value, not the typed one).

Classic SmartClient did **not** run the cell validator on programmatic `setEditValues`/distribute writes at
all (validators fire on interactive edits). So the strictly-faithful behavior would be to skip validation on
programmatic writes; but the **minimal correct** fix below (validate the new value) repairs both programmatic
and interactive paths and is lower-risk than threading a "programmatic" flag through the call.

---

## 8. Proposed fix

### 8.1 Minimal, recommended — validate the candidate post-write record

In `rejectByColumnValidator` (`:2845`), evaluate the value being written, not the current cell value:

```js
const rejectByColumnValidator = useCallback((row, mergedChanges, records) => {
  const proxies = buildCellHookProxies();
  if (!proxies || !gridLoadFormHandle) return false;
  const { grid, view } = proxies;
  const rowData = (row.original ?? row);
  // Validate the value(s) being written, not the stale cell value:
  const candidate = { ...rowData, ...mergedChanges };          // <-- new
  let rejected = false;
  for (const colName of Object.keys(mergedChanges ?? {})) {
    const validator = columnValidatorRef.current.get(colName);
    if (!validator) continue;
    const item = buildColumnItemProxy(gridLoadFormHandle, candidate, colName, grid, view); // item.getValue -> candidate[colName]
    if (validator(item, undefined, candidate[colName], candidate) === false) {             // <-- pass new value + candidate record
      const prior = records.find(r => String(r.id) === String(row.id));
      if (prior && colName in prior) rowData[colName] = prior[colName];
      rejected = true;
    }
  }
  if (rejected) setSiblingPatchVersion(v => v + 1);
  return rejected;
}, [...]);
```

Key points:
- `buildColumnItemProxy(... candidate ...)` makes `item.getValue()` return the new value (it is defined as
  `() => rowData?.[colName]` at `:2832`, so passing `candidate` fixes it automatically).
- Pass `candidate[colName]` as the `value` arg and `candidate` as the `record` arg, since validators may read
  either (Add Payment's validators read the `record`).
- The revert-on-reject still targets the real `rowData`/`records`, so genuine rejections of a truly invalid
  new value still revert correctly.

With this change, the distribute write of `2.07` is validated as `amount = 2.07, outstanding = 2.07` →
passes → reaches `applyEditToReadStore` (`:2946`) → persists → `readback = 2.07`, the cell displays it,
`expected/actual` reconcile, and the `APRM_JSZEROUNDERPAYMENT` message disappears.

### 8.2 Alternative / complementary — do not validate programmatic writes

If you prefer strict classic fidelity, also (or instead) skip the validator gate for programmatic
`setEditValue` writes — e.g. have the controller mark programmatic writes and let `handleRecordChange` bypass
`rejectByColumnValidator` for them (the existing `inColumnOnChangeRef` already bypasses the gate for
column-onChange re-entry; a similar `inProgrammaticWriteRef` would mirror that). This is more invasive than
§8.1 and does not fix interactive mis-validation, so §8.1 is recommended as the primary fix.

---

## 9. Assumptions and things to verify on your side

1. **`record.writeoff === false` on the delivered rows.** The `APRM_JSZEROUNDERPAYMENT` branch requires
   `writeoff === false` (strict). Its appearance in QA confirms the rows carry `writeoff: false`. If a row
   instead had `writeoff: undefined`, that branch would not fire and the write would persist — i.e. the bug
   manifests precisely when the row's pre-write state fails the validator, which is the common case.
2. **"Fix A" and "Fix B" are in the running build.** Problem #2 and the mandatory-date message being resolved
   confirms Fix A (deferred onLoad/validation) is live. Fix B (`applyEditToReadStore`, the synchronous
   read-store update) is in the same uncommitted working tree; it is correct but **moot** here because the
   write is dropped before reaching it. After §8.1, Fix B is what makes the now-accepted write visible.
3. **The migrated JS is faithful and must not change.** The validator body, the distribute logic, and the
   seeding helpers were verified against classic `ob-aprm-addPayment.js`. The defect is entirely in the
   substrate's validator invocation, not in the process JS.
4. **`row.original ?? row`.** For programmatic writes `row` is a plain `EntityData` (no `.original`); for
   interactive MRT edits `row.original` exists. `candidate = { ...rowData, ...mergedChanges }` is correct for
   both because `rowData` already resolves the right object.

---

## 10. Test guidance

**Unit (Jest, `WindowReferenceGrid` test suite):**
- Register a validator on `amount` that returns `false` when `record.amount === 0` and `true` otherwise.
  Programmatically `setEditValue(0, 'amount', 2.07)` on a row whose current `amount = 0` and assert that
  `getEditValues(0).amount === 2.07` (i.e. the write persisted). Before the fix this is `0`.
- Assert a genuinely invalid new value is still rejected and reverted (e.g. validator rejects `amount >
  outstanding`; write `outstanding + 1` and assert the cell reverts and `rejected` is `true`).
- Assert `item.getValue()` inside the validator returns the **new** value during validation.

**Manual QA (Add Payment, the scenario in this brief):**
- Open Add Payment as a sales receipt on an invoice with outstanding `2.07`.
- Expect: the Order/Invoice row's `Amount` shows `2.07`, `Expected`/`Actual` both `2.07`, and **no**
  "zero amount underpayment" message on open.
- Repeat for a Credit To Use pre-selected row → `Payment Amount` initialized.

---

## 11. Related prior substrate work

- **Fix A** (`ProcessDefinitionModal.tsx`): defers `onLoad` + mandatory validation until after the async
  default/FIC seed; resolves the multicurrency-flash and mandatory-date defects. Independent of this brief.
- **Fix B** (`WindowReferenceGrid.tsx`, `applyEditToReadStore` at `:1050`, wired at `:2946`): makes a
  persisted programmatic write synchronously visible to `getEditValues`/`getEditedCell`/the display. Correct
  and necessary, but only takes effect once the write is no longer dropped by §8 — i.e. it is downstream of
  this fix.
- Memory/inventory: process `9BED7889E1034FE68BD85D5D16857320`, report
  `client/agents/reports/9BED7889E1034FE68BD85D5D16857320.md` (§0.3-3 + the dated `## Updates` entries),
  inventory row 37 in `client/docs/process/definition/process-definition-js-testing.md`.
