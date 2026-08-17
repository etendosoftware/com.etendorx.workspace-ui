# Migration report — SII Invoice Modification

## Inputs

- **Classic file:** `/home/luciano/projects/etendo/erp/build/etendo/modules/org.openbravo.module.sii/web/org.openbravo.module.sii/js/ModDefinicionProceso.js`
- **Handler:** `OB.AEATSII.modify` (defined at line 129; shared helper `OB.AEATSII.execute` at line 14)
- **Process id:** `BAAECFDF9FF144E8A610E9F1EF3E5FBE`
- **Search key:** `SIIInvoiceModification`
- **uipattern:** `M` (Manual) · **Multi Record:** Y
- **Launching button column:** `C_Invoice.EM_Aeatsii_Modif`
- **Date:** 2026-08-10

## status: migrated

Manual archetype **AR-1** (confirm → action handler → message + grid refresh). Fully supported after
the Manual substrate landed; see `new-ui-js-migration-guide` Section 9.2.

> Seven SII processes are structural clones inside `ModDefinicionProceso.js`, differing only in the
> Java action handler and the confirmation label. Per the Babel contract each gets its own
> self-contained report and its own copy of the shared helper — `em_etmeta_payscript_logic` is
> per-process, so there is no cross-process sharing mechanism.

---

## Process wiring (verified in etendodev)

- `obuiapp_process`: `uipattern = 'M'`, `classname = 'OB.AEATSII.modify'`, `ismultirecord = 'Y'`.
- **Zero `obuiapp_parameter` rows** — no dialog, as with every Manual process.
- All `em_etmeta_*` columns empty before this migration; `em_etmeta_custom_component` is `NULL`.
- Launched from the button column `C_Invoice.EM_Aeatsii_Modif`.

## Coverage report

| Classic API / mechanism | Where | Classification | New-UI equivalent |
|---|---|---|---|
| `params.button.contextView.viewGrid.getSelectedRecords()` | :132 | supported | `view.hookData.selectedRecords` |
| `selection[i].id` → `ids`, `selection[0].organization` → `orgid` | :132 | supported | identical, read off `view.hookData.selectedRecords` |
| `isc.confirm(msg, { isModal, showModalMask, title }, cb)` | :129 | supported | `await confirm(text, { title })` — always modal, resolves to a boolean (Section 8.1) |
| `OB.I18N.getLabel('AEATSII_WARNING_SEND')` / `'AEATSII_TITLE_SEND'` | :129 | supported | identical on the `OB` shim (Section 8.6) |
| `OB.RemoteCallManager.call(actionHandler, { ids, orgid }, {}, cb)` | :41 | supported | `await callAction("org.openbravo.module.sii.process.MultiInvoiceSIIModification", { ids, orgid })` (Section 8.7) |
| `isc.showPrompt(...)` / `isc.clearPrompt()` loading prompt | :50, :16 | supported (no-op) | the modal owns its own pending state; the classic prompt has no counterpart and needs none |
| `view.view.messageBar.setMessage(isc.OBMessageBar.TYPE_*, title, text)` | :19-35 | supported | `return { message: { msgType, msgTitle, msgText } }` — the server already sends the severity, so the classic three-branch if/else collapses (see advisory 1) |
| `view.view.viewGrid.refreshGrid(null, params.ids)` | :38 | supported | `return { responseActions: [{ refreshGrid: {} }] }` |
| the click *is* the action (no parameter dialog) | — | supported | `em_etmeta_onload` → `{ type: "directExecute" }` (Section 9.2.1) |
| declined confirm → nothing runs, nothing shown | :83-87 | supported | `return { type: "closeModal" }` (Section 9.2.3) |

**No entry is best-effort or unsupported**, so the feasibility gate does not fire.

---

## Generated code per field

### `em_etmeta_onload` — `obuiapp_process`

```js
() => ({ type: "directExecute" })
```

### `em_etmeta_onprocess` — `obuiapp_process`

```js
async (process, view) => {
  const records = view.hookData.selectedRecords ?? [];
  if (records.length === 0) {
    return { error: { msgText: OB.I18N.getLabel("OBUIAPP_NoSelectedRecords"), msgType: "error" } };
  }
  return await runSiiAction(records);
}
```

### `em_etmeta_payscript_logic` — `obuiapp_process`

```js
// @module-scope
// Shared helper mirroring the classic OB.AEATSII.execute (ModDefinicionProceso.js:14):
// one remote call, the server's own severity/title/text in the banner, then a grid
// refresh. Cloned per process because payscript module scope is per-process.
const ACTION_HANDLER = "org.openbravo.module.sii.process.MultiInvoiceSIIModification";
const WARNING_LABEL = "AEATSII_WARNING_SEND";
const TITLE_LABEL = "AEATSII_TITLE_SEND";

const runSiiAction = async (records) => {
  const confirmed = await confirm(OB.I18N.getLabel(WARNING_LABEL), {
    title: OB.I18N.getLabel(TITLE_LABEL),
  });
  // Classic closes the popup and runs nothing when the user declines.
  if (!confirmed) return { type: "closeModal" };

  const response = await callAction(ACTION_HANDLER, {
    ids: records.map((record) => record.id),
    orgid: records[0].organization,
  });

  const message = response?.data?.message ?? {};
  return {
    message: { msgType: message.severity, msgTitle: message.title, msgText: message.text },
    responseActions: [{ refreshGrid: {} }],
  };
};

return { runSiiAction };
```

### Remaining columns

LEAVE EMPTY — `em_etmeta_on_refresh`.
LEAVE EMPTY — `em_etmeta_custom_component` (keep `N`; this is not a custom-component process).
No `obuiapp_parameter` rows exist, so there is no `em_etmeta_on_parameter_change` /
`em_etmeta_on_grid_load` to fill.

---

## Advisories (non-blocking)

1. **Severity if/else collapsed.** Classic branches on `data.message.severity` to pick
   `TYPE_SUCCESS` / `TYPE_WARNING` / `TYPE_ERROR` and then passes the same title/text in every branch.
   The new UI takes the severity directly, so the branch is dead code (playbook Section 10.3). Behaviour
   is identical for the three severities the server emits.
2. **Loading prompt dropped.** `isc.showPrompt` / `isc.clearPrompt` framed the remote call; the process
   modal already shows its own pending state, so reproducing them would double the indicator.
3. **Empty-selection guard added.** Classic reads `selection[0].organization` without checking the
   length and would throw on an empty selection. The migrated code returns an error message instead.
   This is a deliberate, non-regressive deviation.
4. **`refreshGrid` is not row-scoped.** Classic passes `params.ids` to `refreshGrid`; the new-UI action
   refreshes the launching tab's grid as a whole. Same observable outcome, slightly broader refetch.

## Manual-test checklist

1. Open the window backing `C_Invoice.EM_Aeatsii_Modif` and select **one** invoice. Press **SII Invoice Modification**.
   → No empty dialog appears; the confirmation from `AEATSII_WARNING_SEND` shows immediately, titled with
   `AEATSII_TITLE_SEND`.
2. Press **Cancel** on the confirmation. → The dialog closes, **no** banner and **no** error appear, and
   nothing is sent (verify no new SII log entry).
3. Repeat and press **OK**. → A banner shows the server's message with the server's severity, and the
   grid refreshes so the changed status is visible without a manual reload.
4. Select **several** invoices and run it again. → All selected ids are sent in a single call
   (one server round-trip, not one per record).
5. Force a server error (e.g. a invoice in an invalid state). → The banner shows the error with
   error severity, and the modal stays open.
6. Run it with **no** selection. → An error message appears instead of a crash.

## References used

- `new-ui-js-migration-guide` Sections 8.1, 8.6, 8.7, 9.2 (Manual processes, archetype AR-1), 10.2, 10.3.
- Classic source `/home/luciano/projects/etendo/erp/build/etendo/modules/org.openbravo.module.sii/web/org.openbravo.module.sii/js/ModDefinicionProceso.js`.
- Sibling SII reports (same archetype, same helper).
