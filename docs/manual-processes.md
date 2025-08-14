# Manual Processes Mapping (data.json)

This document explains the purpose and use of `packages/MainUI/utils/processes/manual/data.json`, a mapping used to execute legacy/manual processes from Etendo Classic within the new UI.

## Purpose

Some buttons in windows trigger legacy UI processes that are not yet modeled as modern Process Definitions. For those, the Main UI opens the corresponding Classic page inside an iframe and forwards the required parameters. The mapping in `data.json` tells the UI which Classic page to open and how to identify the record.

## File Location

- `packages/MainUI/utils/processes/manual/data.json`

## Data Shape

The file is a JSON object keyed by “process button id” (as exposed by metadata). Each entry contains:

- `url`: string. Relative path to the Classic action page (forwarded via `/meta/forward`).
- `command`: string. Value for the `Command` parameter expected by the Classic page.
- `inpkeyColumnId`: string. Name of the primary key input parameter.
- `keyColumnName`: string. Database column name of the primary key.

Example:

```
{
  "8B59A07EB4C2475AE040007F010031CA": {
    "url": "/SalesInvoice/Header_Edition.html",
    "command": "BUTTONDocAction111",
    "inpkeyColumnId": "C_Invoice_ID",
    "keyColumnName": "C_Invoice_ID"
  },
  "1083": {
    "url": "/SalesOrder/Header_Edition.html",
    "command": "BUTTONDocAction104",
    "inpkeyColumnId": "C_Order_ID",
    "keyColumnName": "C_Order_ID"
  }
}
```

## How the Mapping Is Used

- Hook: `packages/MainUI/hooks/Toolbar/useProcessExecution.ts`
  - Detects if the clicked button id exists in `data.json`.
  - Builds a base URL combining the app’s API base and forward path: `API_BASE_URL + "/meta/forward" + url`.
  - Assembles the query string via `getParams()` from `packages/MainUI/utils/processes/manual/utils.ts`.
  - Sets this URL in an iframe (`ProcessModal/Iframe`) to show the Classic UI page.

- Params builder: `packages/MainUI/utils/processes/manual/utils.ts`
  - Reads values from the current record using defaults and key lists in `constants.ts` (document status, processing, client/org, business partner).
  - Fills required parameters (`IsPopUpCall`, `Command`, `inpKey`, `inpwindowId`, `inpTabId`, `inpTableId`, `inpcBpartnerId`, `inpadClientId`, `inpadOrgId`, `inpkeyColumnId`, `keyColumnName`, etc.).
  - Sets `inpdocaction` depending on whether the process is a “posted process” and includes a `token` if available.

## Required Parameter Keys

See `packages/MainUI/utils/processes/manual/constants.ts`:

- `REQUIRED_PARAMS_KEYS` enumerates all expected keys (e.g., `Command`, `inpwindowId`, `inpTableId`, `keyColumnName`).
- Default/fallback values and key aliases for record extraction are defined in:
  - `DEFAULT_DOCUMENTS_KEYS`, `DEFAULT_PROCESS_KEYS`, `DEFAULT_AD_CLIENT_ID_KEYS`, `DEFAULT_AD_ORG_ID_KEYS`, `DEFAULT_BUSINESS_PARTNER_ID_KEYS`.

## End-to-End Flow

1. User clicks a process button in toolbar.
2. `useProcessExecution` determines if it’s a manual process by checking `data.json`.
3. It composes the Classic URL: `API_BASE_URL + /meta/forward + <url from mapping>`.
4. It calls `getParams` to generate the query string using current record values.
5. It opens the Classic page in an iframe with the full URL.

## Adding a New Manual Process

1. Obtain the button id from metadata (the `ProcessActionButton` id received in `useProcessExecution`).
2. Add a new entry in `data.json`:
   - `url`: Classic page path (as used in legacy UI).
   - `command`: `Command` value expected by that page.
   - `inpkeyColumnId` and `keyColumnName`: PK input name and PK DB column name for the window entity.
3. Ensure the record has enough data for `constants.ts` to derive client/org/bpartner/docstatus/processing.
4. Validate by clicking the button and checking that the iframe opens and the Classic page receives expected params.

## Notes & Considerations

- The mapping is intentionally minimal to keep the bridge small and explicit.
- If a process graduates to a modern Process Definition, remove its entry from `data.json` and migrate to the new flow via `executeProcessDefinition`.
- “Posted process” detection in code currently toggles `inpdocaction` based on a heuristic; confirm command values and button ids when adding new entries.

## Debugging

You can enable verbose logs for manual processes (URL, context, and params) using either environment variables or localStorage:

- Env vars: set `NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES=true` (client) or `DEBUG_MANUAL_PROCESSES=true`.
- Local storage: set `localStorage.DEBUG_MANUAL_PROCESSES = 'true'` in the browser.

When enabled, the hook prints messages prefixed with `[MANUAL_PROCESS]` to the console.

## Related Files

- `packages/MainUI/hooks/Toolbar/useProcessExecution.ts`
- `packages/MainUI/utils/processes/manual/utils.ts`
- `packages/MainUI/utils/processes/manual/constants.ts`
- `packages/MainUI/components/ProcessModal/Iframe.tsx`
 - `packages/MainUI/utils/debug.ts` (flag readers)
