# Multi-Record Processes

A multi-record process (`OBUIAPP_Process.IsMultiRecord = Y`) can run on several selected records at once, for example:
- *Bulk Completion* in Sales Invoice, Sales Order and Goods Shipment;
- *Post*.

When it runs on several records, the user gets **one** result message that covers all of them, as in Classic.

Jira: ETP-5983.

## Behavior

- **One request.** The process modal sends a single request to the process's Java handler. `recordIds` holds every selected record id.
- **Combined message.** The handler builds the result. The `com.smf.jobs` processes (`ProcessInvoices`, `ProcessOrders`, `ProcessShipment`, `Post`) use `ProcessUtils.massiveMessageHandler` with the message `DJOBS_PostUnpostMessage`: "PROCESS EXECUTED: X registers successfully processed and Y registers failed."

  | Outcome | Message type | New UI |
  | --- | --- | --- |
  | Every record processed | success | Success toast, the modal closes |
  | Some records failed | warning | Warning toast, the modal closes |
  | Every record failed | error | Error shown in the modal, which stays open |

- **One refresh.** The grid is refreshed once, after the single response, so it shows the new status of every selected record.
- **One selected record.** The handler returns that record's own detailed message, as before.

The response is handled by the usual Java process flow; see [ProcessDefinitionModal](./process-definition-modal.md).

## Decisions

- **No per-record execution.** ETP-3766 ran the process once per selected record, believing that was Classic's behavior. Classic `ob-parameter-window-view.js` (`doProcess`) actually sends all ids in one call. The per-record loop caused two problems:
  - only the last record's message was shown, so a failure could be hidden behind a success;
  - each request also carried the current record (`inpKeyName`), which `com.smf.jobs` `Data` adds when it is not in `recordIds`. That record was therefore processed in every request.
- **No client-side combination of results.** Every multi-record handler receives one request in Classic, so the handler always builds the combined message. A client fallback would be dead code.
- **The record context is still sent.** Classic sends only `recordIds` for a multi-record button. The New UI keeps the context of the tab's current record, which it already sent before, so no handler loses fields it reads today. That record belongs to the selection, so `Data` does not process it twice.

## Differences with Classic

- Classic shows the combined success or warning in the message bar of the window. The New UI shows it as a toast, like every other process result.

## Configuration

None.

## Main files

| File | Role |
| --- | --- |
| `packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts` | `handleDirectJavaProcessExecute`: single request to the Java handler |
| `packages/MainUI/components/ProcessModal/hooks/useProcessPayload.ts` | `getRecordIds`: every selected record id |
| `packages/MainUI/components/ProcessModal/hooks/__tests__/useProcessExecution.responseFlags.test.ts` | Single request and combined success / warning / error tests |
