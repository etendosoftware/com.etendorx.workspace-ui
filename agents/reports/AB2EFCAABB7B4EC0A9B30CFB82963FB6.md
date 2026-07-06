# Migration report — Create Lines From Order

## Inputs

- **Original file:** `erp/WebContent/web/org.openbravo.client.application/js/procurement/ob-procurement.js`
- **Process id:** `AB2EFCAABB7B4EC0A9B30CFB82963FB6`
- **Process name:** Create Lines From Order
- **Date:** 2026-06-11

## status: migrated

(Code generated and handed off for manual pasting; manual QA not yet confirmed.)

---

## Binding verification (etendodev, this process only)

The DB bindings for THIS process were read directly; nothing was assumed from the file or from other
processes:

- `obuiapp_process.on_load_function` = `OB.PROC.CLFROnload` — **the only in-scope hook.**
- `obuiapp_process.clientsidevalidation` = (empty)
- `obuiapp_process.on_refresh_function` = (empty)
- Single parameter `Pick/Edit Lines` (`2B1B644767DB40F98A230DC7C64C7F57`, reference
  `FF80818132D8F0F30132D9BC395D0038` = Window Reference / grid): `onchangefunction` = (empty),
  `ongridloadfunction` = (empty).

The file also defines `OB.PROC.CreateLinesOnChangeQuantityAum`, `OB.PROC.CreateLinesOnChangeQuantity`
and `OB.PROC.CreateLinesOnChangeAum`. A namespace search across `obuiapp_parameter.onchangefunction`
found **zero** bindings to these functions for any process. They are not reachable from any in-scope
hook of this process and are dropped per the dead-code rule.

All `em_etmeta_*` columns for this process were empty before this migration.

---

## Coverage report (Phase 4)

In-scope code = `OB.PROC.CLFROnload` only.

| Classic API (in-scope) | Classification | New-UI equivalent / note |
|---|---|---|
| `on_load_function` hook | supported | `em_etmeta_onload`: `async (process, view) => {…}` |
| `item.messageBar` / `view.messageBar` | supported | `view.messageBar` (and the `messageBar` global) |
| `messageBar.setMessage(severity, title, text)` | supported | identical signature (sanitized text) |
| `isc.OBMessageBar.TYPE_INFO` | supported | `isc.OBMessageBar.TYPE_INFO` → `"info"` (severity constant) |
| `OB.I18N.getLabel('CreateFromMatchPOQtys')` | supported | identical (label `CreateFromMatchPOQtys` confirmed present in `ad_message`) |

All in-scope entries are **supported** → the feasibility gate passes. No `best-effort` / `unsupported`
APIs in scope.

### Out-of-scope APIs (in the file but not bound to this process — informational only)

These belong to the three unbound `onChange` functions; they were NOT migrated. Had they been in scope,
they all map to supported equivalents (`OB.RemoteCallManager.call` → 8.7, `grid.setEditValue` /
`grid.getColNum` / `grid.getEditValues` → 7.3, `grid.getSelectionObject().lastSelectionItem`,
`item.pickList.getSelection()`). No gate impact.

---

## Generated code per field

### `em_etmeta_onload` — entity `obuiapp_process`

```js
async (process, view) => {
  view.messageBar.setMessage(
    isc.OBMessageBar.TYPE_INFO,
    null,
    OB.I18N.getLabel('CreateFromMatchPOQtys')
  );
}
```

Compile-check: OK (bare arrow function).

### `em_etmeta_onprocess` — entity `obuiapp_process`

LEAVE EMPTY.

### `em_etmeta_on_refresh` — entity `obuiapp_process`

LEAVE EMPTY.

### `em_etmeta_payscript_logic` — entity `obuiapp_process`

LEAVE EMPTY (no shared helpers/constants/state for the single in-scope hook).

### `em_etmeta_custom_component` — entity `obuiapp_process`

LEAVE EMPTY / unchanged (standard parameter form; no custom component).

### `em_etmeta_on_parameter_change` — parameter `Pick/Edit Lines`

LEAVE EMPTY (no `onchangefunction` bound to this parameter).

### `em_etmeta_on_grid_load` — parameter `Pick/Edit Lines`

LEAVE EMPTY (no `ongridloadfunction` bound to this parameter).

---

## Advisories (non-blocking)

1. **Dead code dropped.** The three `OB.PROC.CreateLinesOnChange*` functions in the file are not bound to
   any parameter of this process (verified in `etendodev`), so they were intentionally not migrated. If
   future metadata binds one of them to a parameter, re-run the migration for that hook.
2. **Receiver change.** Classic calls `item.messageBar` (the message bar reached via the onLoad's first
   argument). The migrated onLoad uses the canonical `view.messageBar`, which is the same in-dialog
   banner handle in the new UI. Behavior is identical.
3. **Single banner.** The onLoad only displays an informational banner; it seeds no field values and
   returns nothing (a falsy return is a no-op), matching the classic behavior.

---

## Manual-test checklist

1. Open the **Create Lines From Order** process (the Pick & Execute modal that shows the
   **Pick/Edit Lines** grid).
2. On open, confirm an **info** (blue) message bar appears at the top of the dialog with the text of the
   label **`CreateFromMatchPOQtys`** (the "create from match PO quantities" guidance message), in the
   active UI language.
3. Confirm the banner shows **exactly once** per open and has **no title** (text only).
4. Confirm the rest of the dialog behaves normally: the Pick/Edit Lines grid loads and rows can be
   selected/edited; no errors in the console (in particular, no `is not implemented yet`).
5. Re-open the modal and confirm the banner reappears (state does not leak/duplicate across opens).

---

## References used

None. The inventory currently contains **no `qa-passed`** process, so no migrated process qualifies as a
trusted reference. This migration relies solely on the architecture doc
(`client/docs/process/definition/new-javascript-code.md`): message bar (§8.2), severity constants
(§8.2), `OB.I18N.getLabel` (§8.6), and the `em_etmeta_onload` contract (§5.1).
