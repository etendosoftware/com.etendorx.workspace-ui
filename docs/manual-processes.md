# Legacy (Manual) Processes

This document explains how the new Etendo WorkspaceUI handles **legacy processes** — Classic ERP
processes that return an HTML document and must be displayed inside an iframe modal.

## Overview

Legacy processes include:
- **Section 2.B.1-2.B.5** — Button columns detected by column name:
  `DocAction`, `Posted`, `CreateFrom`, `ChangeProjectStatus`, `PaymentRule`.
- **Section 2.B.6** — Button columns whose linked `AD_Process` has `uipattern = 'M'` (Manual),
  identified by their Java class name (e.g. APRM, CopyFrom, ProcessGoods).

## Backend resolution (primary path)

The module `com.etendoerp.metadata` now resolves the parameters needed to open the iframe
directly from the Application Dictionary. When building the JSON for a Button field,
`LegacyProcessResolver` inspects the column and its linked `AD_Process` to produce:

| Key | Description | Example |
|-----|-------------|---------|
| `url` | Relative path to the Classic action page | `/SalesOrder/Header_Edition.html` |
| `command` | Value for the Classic `Command` parameter | `BUTTONDocAction104` |
| `keyColumnName` | DB column name of the table PK | `C_Order_ID` |
| `inpkeyColumnId` | Same as `keyColumnName` (Classic expects both) | `C_Order_ID` |

These four keys are injected into the `processAction` object of the field JSON alongside the
existing metadata (fieldId, columnId, buttonText, etc.). No manual registration is required.

**URL derivation rules:**

| Column / Process type | URL |
|----------------------|-----|
| `Posted` or `CreateFrom` (no `AD_Process`) | `/ad_actionButton/<columnName>.html` |
| `DocAction`, `ChangeProjectStatus`, `PaymentRule` | Tab Edition URL via `Utility.getTabURL()` |
| `AD_Process` with `uipattern = 'M'` | `/<javaPackage>/<ClassName>.html` from `process.javaClassName` |
| `AD_Process` with `uipattern = 'S'` (Standard tab button) | Tab Edition URL via `Utility.getTabURL()` |

**Command derivation rules:**

| Column / Process type | Command |
|----------------------|---------|
| `Posted` / `CreateFrom` without `AD_Process` | `BUTTON<columnName>` |
| `AD_Process` with `uipattern = 'M'` | `DEFAULT` |
| Any other button column with `AD_Process` | `BUTTON<columnName><processId>` |

## Frontend resolution chain

`useProcessExecution.executeProcessAction` calls `resolveLegacyProcessData(button, fallbackData)`
which follows this order:

1. **Backend** — if `button.processAction` contains all four keys (`url`, `command`,
   `keyColumnName`, `inpkeyColumnId`), use them directly.
2. **data.json lookup** — check `button.id` in
   `packages/MainUI/utils/processes/manual/data.json`.
3. **Column-name fallback** — search `data.json` for an entry whose `command` contains
   `button.columnName` (handles Header vs Lines tab variants of the same process).
4. **Unresolvable** — throws `LegacyProcessUnresolvedError`, which triggers an error modal
   and a `console.error` with the button ID and column name.

## Static fallback: data.json

`packages/MainUI/utils/processes/manual/data.json` contains only entries that the backend
cannot fully resolve automatically. Currently 6 entries remain:

| FieldId | Process | Reason kept |
|---------|---------|-------------|
| `4242` | GoodsShipment — CreateFrom | Uses `FIND_PO` command + direct popup URL instead of the standard tab-servlet path. Backend provides `BUTTONCreateFrom` via tab URL — behavior difference needs E2E verification before removing. |
| `57A2B365BDC69F57E040007F0100784A` | Reschedule Process | `/ad_process/` URL pattern — uncertain whether `javaClassName` in AD matches; keep until confirmed. |
| `573FEC1BC12D5E8EE040007F01017CC8` | Unschedule Process | Same as above. |
| `573FEC1BC12C5E8EE040007F01017CC8` | Schedule Process | Same as above. |
| `A0417A0E9256CA28E040007F01003C18` | Reconciliation | Has `additionalParameters` (`inpfinFinancialAccountId`); backend does not yet resolve those. |
| `E5569BAF22C644EF9B5D6846515883F9` | Financial Transaction Processing | Has `additionalParameters` (`inpprocessed: "N"`); backend does not yet resolve those. |

> **Note on `4242`:** the backend detects CreateFrom as a special column and sends its own
> params first (resolution step 1). The data.json entry is therefore only used if the
> backend detection is disabled or changes. The FIND_PO command specifically opens the
> Purchase-Order search grid inside CreateFrom.html — verify this works via the tab-servlet
> path (BUTTONCreateFrom) before removing.

If you discover a new legacy process that is not opened automatically:

If you discover a new legacy process that is not opened automatically:

1. Obtain the button id from the metadata response (`button.id`).
2. Add an entry in `data.json`:
   ```json
   "<buttonId>": {
     "url": "/path/to/Classic_Edition.html",
     "command": "BUTTONColumnNameProcessId",
     "inpkeyColumnId": "Table_ID",
     "keyColumnName": "Table_ID"
   }
   ```
3. Validate by clicking the button and confirming the iframe opens correctly.
4. File a follow-up task to implement backend resolution so the entry can later be removed.

## Params built at runtime

`getParams()` in `packages/MainUI/utils/processes/manual/utils.ts` builds the Classic
query string from the resolved `ProcessActionData` plus the current record/tab context:

| Parameter | Source |
|-----------|--------|
| `Command` | `processAction.command` |
| `inpKey` | current `recordId` |
| `inpwindowId` | current `windowId` |
| `inpTabId` | current `tab.id` |
| `inpTableId` | current `tab.table` |
| `inpkeyColumnId` | `processAction.inpkeyColumnId` |
| `keyColumnName` | `processAction.keyColumnName` |
| `inpdocstatus` | extracted from record |
| `inpprocessing` | extracted from record |
| `inpdocaction` | `"CO"` or `"P"` (Posted processes) |
| `token` | session token |

## Debugging

Enable verbose logs via:

- `NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES=true` (env var)
- `localStorage.DEBUG_MANUAL_PROCESSES = 'true'` (browser)

When enabled the hook logs messages prefixed `[MANUAL_PROCESS]` including the params source
(`backend` or `fallback data.json`), the full URL, and the parameter map.

## Related files

| File | Role |
|------|------|
| `erp/.../builders/LegacyProcessResolver.java` | Backend: decides if a field is legacy and resolves params |
| `erp/.../builders/LegacyProcessParams.java` | Backend: DTO for the four resolved params |
| `erp/.../builders/ProcessActionBuilder.java` | Backend: injects legacy params into `processAction` JSON |
| `packages/MainUI/utils/processes/manual/utils.ts` | `resolveLegacyProcessData` + `getParams` |
| `packages/MainUI/utils/processes/manual/errors.ts` | `LegacyProcessUnresolvedError` |
| `packages/MainUI/utils/processes/manual/data.json` | Static fallback mapping |
| `packages/MainUI/utils/processes/manual/constants.ts` | Classic param key names and defaults |
| `packages/MainUI/hooks/Toolbar/useProcessExecution.ts` | Orchestrates the full execution flow |
| `packages/MainUI/components/ProcessModal/Iframe.tsx` | Renders the iframe modal |
