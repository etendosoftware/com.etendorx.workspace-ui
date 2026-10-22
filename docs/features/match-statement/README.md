# Match Statement

Process **Match Statement** (`86F0B1EBE2BC48E3ACF458768D14CC99`, Pick & Execute, launched from the
*Financial Account* header tab). It matches imported bank statement lines with financial account
transactions. The goal (ETP-5877) is functional parity with Classic UI, which is the specification.

The process JavaScript is the migrated Classic code stored in `obuiapp_process.em_etmeta_onload`,
`em_etmeta_on_refresh` and `em_etmeta_onprocess`, and in the `Match Statement` parameter's
`em_etmeta_on_grid_load`. The migration report is
[`agents/reports/86F0B1EBE2BC48E3ACF458768D14CC99.md`](../../../agents/reports/86F0B1EBE2BC48E3ACF458768D14CC99.md).
Every fix described here is in the generic script substrate, not in the stored JavaScript.

## Initial Confirm dialog (onLoad)

### Classic behavior

Entry point: `OB.APRM.MatchStatement.onLoad` (`on_load_function`) in
`org.openbravo.advpaymentmngt/web/org.openbravo.advpaymentmngt/js/ob-aprm-matchStatement.js`.

1. `isc.confirm(OB.I18N.getLabel('APRM_AlgorithmConfirm'), execute)`.
2. `execute(ok)` runs on **both** buttons. Confirm passes `true` and Cancel passes `false`:
   ```js
   params.context = grid.view.sourceView.getContextInfo();
   params.executeMatching = ok;
   OB.RemoteCallManager.call('…MatchStatementOnLoadActionHandler', {}, params, callback);
   ```
   `params` is the 3rd argument, so Classic sends it as URL query parameters. Non-string values are
   JSON-encoded (`context={…}`, `executeMatching=true|false`).
3. `MatchStatementOnLoadActionHandler` reads `parameters.get("context")` and its
   `Fin_Financial_Account_ID` key. It always creates or refreshes the draft reconciliation. Only when
   `executeMatching` is `"true"` does it run the matching algorithm.
4. The handler answers with `responseActions` → `showMsgInProcessView`. The text is translated
   server-side:
   - success: `APRM_AutomaticMatchedLines`, with the matched line count;
   - warning: `APRM_NoAutomaticMatchedLines` or `APRM_NoStatementsToMatch`;
   - error: the exception message.

   The callback dispatches the actions with `OB.Utilities.Action.executeJSON`, which shows the message
   in the process message bar, and then loads the grid.

Cancel therefore does **not** run the algorithm, but it still calls the handler so that the draft
reconciliation exists. The new UI keeps this behavior.

### Gap found and fix

Pressing Confirm failed with ``Cannot invoke "String.length()" because "this.mySource" is null``. The
handler received `context = null`, and `new JSONObject(null)` threw. There were two generic causes:

| Gap | Fix |
|---|---|
| `OB.RemoteCallManager.call` dropped its 3rd argument, so neither `context` nor `executeMatching` was sent. | `requestParams` is now sent as query parameters, encoded as in Classic. See [Section 8.7](../../process/definition/new-javascript-code.md#87-obremotecallmanagercall--callbackpromise-adapter). |
| `view.sourceView` was the bare tab metadata, without `getContextInfo()`, so the stored script's guard skipped `context`. | `view.sourceView.getContextInfo()` now returns the Classic context of the launching record: record values by input name, the tab's standard properties, and the key column by DB column name. See [Section 7.2](../../process/definition/new-javascript-code.md#72-the-view-proxy). |

Both fixes apply to every migrated process. A script that passes `{}` as the 3rd argument (the common
case) sends exactly the same request as before.

### Differences with Classic

- The button labels of the confirm dialog come from the new UI translations (`common.confirm` /
  `common.cancel`).

## Footer `OK` button

Classic: `OK` submits to `MatchStatementActionHandler`, which returns no message for `OK`
(`{ "refreshParent": true }`). The popup closes, the parent refreshes and no message is shown. The new UI
showed the generic "Process completed successfully" toast. It now follows the Classic rule for every
standard Java handler response: no message in the response, no toast. Responses with a message are unchanged.
See [Pick & Execute §10.5](../../process/pickAndExecute/README.md#105-success-toast-on-close--server-gated-as-well).

## Main files

- `packages/MainUI/utils/ob/remoteCallManager.ts`: `OB.RemoteCallManager.call`, `encodeRequestParams`.
- `packages/MainUI/utils/processes/definition/utils.ts`: `remoteCall` → `callAction` with `queryParams`.
- `packages/MainUI/utils/processes/definition/sourceView.ts`: `buildSourceView`. It reuses
  `buildProcessPayload` from `packages/MainUI/utils/index.ts`.
- `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx`: wires `viewData.sourceView`.
- `packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts`: `handleJavaProcessResult`, toast only
  when the response carries a message.
- `packages/MainUI/utils/processes/definition/dialogs.ts` and
  `components/ProcessModal/ProcessDialogHost.tsx`: `isc.confirm`, which resolves `true` on Confirm and
  `false` on Cancel or close.
