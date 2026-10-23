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

## Match column

### Classic behavior

- The *Match* field is the Yes/No column `cleared`. The HQL table `aprm_matchstatement` computes it as
  `case when fat is null then false else true end`, so it is true when the line is matched.
- Its `clientclass` `APRMMatchStatGridButtonsComponent` replaces the cell content with three row buttons (Search,
  Add, Clear); the Yes/No value itself is not shown (`ob-grid.js`, `initWidget`).
- The column keeps the Yes/No filter (`OBYesNoItem`), sent as `cleared equals true|false`.
- `DefaultsProcessActionHandler` returns `filterExpressions: { match_statement: { cleared: "No" } }`
  (`MatchStatementFilterExpression`, handler for the Financial Account window). Classic puts it in the filter
  editor, so the grid opens with unmatched lines only and the user can clear or change the filter.

### Gap found and fix

| Gap | Fix |
|---|---|
| Every `clientclass` was treated as a navigation link, so the Yes/No tag was stringified into a clickable "[object Object]". | A Yes/No column is never a link (`isClientclassLinkColumn`); it renders its Yes/No tag. |
| The `No` default became a hidden `cleared iContains "No"` criterion, impossible to remove (this grid has no implicit-filter button), plus a column filter sent as `iContains "false"`. | Yes/No defaults are applied only as the column's Yes/No filter (`equals false`), removable as in Classic. |
| The defaults request did not send the launching tab's standard properties, so `MatchStatementFilterExpression` found no `inpwindowId` and returned no filter: the grid opened unfiltered. | The request now carries the launching tab context (`buildDefaultsRequestPayload`), as Classic does. See [process defaults: launching tab context](../process-defaults-integration/api-integration.md#launching-tab-context-process-definition-modal). |

Details: [Pick & Execute §8.5 and §8.16](../../process/pickAndExecute/README.md#85-cell-rendering-architecture).

### Differences with Classic

- Until the row buttons are implemented, the cell shows the read-only Yes/No tag instead of the buttons.
- The default filter is visible as the selected value of the column filter. In Classic the `No` value is set in
  the filter editor too, but it may display empty.

## Affinity column

### Classic behavior

- *Affinity* is the String column `affinity` (`bsl.matchingtype`), with
  `clientclass = 'OBLevelImg {"valuesList":["NO", "dummy1", "dummy2", "AP", "AU"]}'`.
- `OBGrid.createRecordComponent` splits the class name from its JSON properties
  (`OB.Utilities.clientClassSplitProps`) and renders `isc.OBLevelImg` (`ob-formitem-canvas.js`). It shows
  `levelImg_<index>_<len-1>.png`, a signal-style image with `index` filled bars, where `index` is the value's
  position in `valuesList`. An empty value or one missing from the list shows nothing.

| `matchingtype` | Meaning | Shown |
|---|---|---|
| `AU` | Strong automatic match | 4 of 4 bars |
| `AP` | Weak match | 3 of 4 bars |
| `NO` | No match | 4 empty bars |
| `MA`, `AD`, empty | Manual / added / unmatched line | nothing |

The column keeps the text filter (`OBLevelImg` does not override it).

### Gap found and fix

The new UI treated the `clientclass` as a navigation link and showed the raw code (`AU`) as a link that did not
navigate. `OBLevelImg` columns now render `LevelIndicatorCell`, drawn as SVG bars, with the level resolved exactly
as Classic does (`splitClientclass`, `readLevelValues`, `resolveLevel`). Links and Yes/No columns are unchanged.

### Differences with Classic

- The bars are drawn (SVG, theme color `--color-success-main`) instead of the PNG images, so any `valuesList`
  length works.
- Clicking the indicator does not select the row; selection follows the grid's own row behavior.

## Row buttons (Search, Add, Clear)

### Classic behavior

`APRMMatchStatGridButtonsComponent` (the *Match* column's `clientclass`) replaces the cell with three buttons.
Search and Add are enabled when the line is not matched; Clear is enabled when it is.

| Button | Calls | Then |
|---|---|---|
| Search | `CheckRecordChangedActionHandler` | `view.onRefreshFunction(view)`. On error, shows the message; otherwise opens *Find Transactions to Match* (`154CB4F9…`) with `externalParams { bankStatementLineId, transactionDate }` |
| Add | `CheckRecordChangedActionHandler` | Same, opening *Add Transaction* (`E68790A7…`) with `externalParams { bankStatementLineId }` |
| Clear | `UnMatchTransactionActionHandler` `{ bankStatementLineId, updated }` | `view.onRefreshFunction(view)`. On error, shows the message; on success, no message |

### Gaps found and fixes

| Gap | Fix |
|---|---|
| The buttons rendered in a generic leading "Actions" column. | They render inside the *Match* column, the column whose `clientclass` is a component the new UI does not render (`findRowActionsHostColumnId`). The leading column is no longer shown for them. |
| `view.onRefreshFunction` was `undefined` in the grid's script views, so every row-action callback threw on its first line. For Clear the unmatch ran but nothing refreshed; Search and Add never opened their process. | The grid receives the process `onRefresh` hook and exposes it on every grid script view (`createGridScriptView`). |

**Clear works** with these fixes and no change to the stored JavaScript: it unmatches, refreshes the grid (the
buttons switch state) and shows an error in the message bar if any.

### Search: *Find Transactions to Match*

Classic opens `154CB4F9…` with the Financial Account header as `buttonOwnerView`, `callerField = me` (the row and
the Match Statement view) and `externalParams { bankStatementLineId, transactionDate }`.

- **Grid.** It lists the account's processed, unreconciled transactions dated up to the line's date. The request
  carries `@FIN_Financial_Account.id@` and `bankStatementLineId`, read by `TransactionsToMatchTransformer`.
- **Done.** `OB.APRM.FindTransactions.onProcess` requires a selection. If the selected amount differs from the
  line's amount, it asks to split the line (skipped when the `APRM_MATCHSTATEMENT_HIDE_PARTIALMATCH_POPUP`
  preference is `Y`), then submits.
- **Result.** Success matches the line (`MA`), closes the popup and refreshes the Match Statement grid.
  Cancel closes without refreshing.

The new UI did none of it. The fixes are generic, in the nested-process substrate:

| Gap | Fix |
|---|---|
| The nested modal had no tab or record, so no context reached its defaults, grid or submit. | It runs in its owner's tab and record (`ownerTab` / `ownerRecord`, `buildNestedLaunch`). |
| `isPE` was computed from the stub button, so the defaults were never requested and Done did nothing. | `isPE` reads the loaded process definition. |
| `externalParams` were dropped. | They reach the defaults context, the grid datasource (`applyExternalParams`) and `_params`. |
| `onLoad` / `onProcess` never ran in a nested modal. | They run, since the modal now has a tab. |
| The migrated `onProcess` calls `view.executeProcess()`, which double-submitted, and a declined split confirm showed an empty error banner. | `executeProcess()` is the submit (Classic `actionHandlerCall()`); an error without text aborts silently. |
| `view.getContextInfo()` had no grid selection. | It carries `{ findtransactiontomatch: { _selection, _allRows } }`. |
| The parent refresh ran twice, also on cancel, with an invalid view; the split confirm was drawn twice. | Only success refreshes the caller view, once; only the topmost modal renders dialogs. |

**Stored JavaScript change** (Match Statement `onGridLoad`, the `Match Statement` parameter): the migration had
dropped Classic's `callerField: me`. The child reads `view.callerField.record.amount` (the line), so
`openMatchProcess` now passes `callerField: { record: record, view: view }`. See the migration report.

### Add: *Add Transaction*

Classic opens `E68790A7…` (Pick & Execute with form parameters only) with `callerField = me` and
`externalParams { bankStatementLineId }`.

- **Defaults.** `AddTransactionFilterExpression` reads `bankStatementLineId` from the defaults context.
- **`onLoad`.** Adds a hidden `bankStatementLineId` field from `callerField.record.id` and mirrors the organization
  into `ad_org_id_process`.
- **`onProcess`.** Runs only for a Match Statement launch (`callerField.record.match`):
  - a deposit or withdrawal without payment or GL item is an error (`APRM_INVALID_TRANSACTION`);
  - an amount different from the line's asks to split it (unless the preference is `Y`);
  - otherwise it submits.
- **Handler.** `AddTransactionActionHandler` reads `_params` (`bankStatementLineId`, `trxtype`, `trxdate`, amounts,
  `fin_payment_id`, `c_glitem_id`, `ad_org_id`) and the top-level `inpTabId` / `Fin_Financial_Account_ID`. It
  creates and processes the transaction, then matches the line (`AD`).

**No Add-specific change was needed.** The nested-process fixes made for Search cover all of it:
- the owner context gives the top-level keys;
- `externalParams` reach the defaults and `_params`;
- `onLoad` / `onProcess` run in the nested modal;
- `callerField.record` is the row, including the HQL `match` alias, which the grid rows carry;
- a declined split confirm aborts silently;
- only success refreshes the Match Statement grid.

The stored `onProcess` already follows the Pick & Execute validation contract (`undefined` to proceed, an error to
abort).

**Form fixes found while testing it** (generic, ETP-5877):

| Problem | Cause | Fix |
|---|---|---|
| Execute was enabled with empty mandatory dates; the server answered "Unparseable date: null". | A mandatory parameter with a default *expression* counted as filled, even when the default resolved empty. | Pick & Execute processes require an actual value in every visible mandatory parameter, as Classic `allRequiredParametersSet` (grid and Yes/No parameters exempt). |
| Only *Currency* was pre-filled. | The defaults request (`useProcessInitialization`) did not send `externalParams`, so `AddTransactionFilterExpression` found no `bankStatementLineId`. | `externalParams` are added to that request's context. |
| Two empty "Dimensions" sections. | Two field groups share the name (`BB8B7EB2…`, `800000`), and a section was drawn even with no visible field. | A section with no visible parameter is hidden (kept mounted), as Classic `OBSectionItem.showIf`. |
| No dimension field was shown. | `@ACCT_DIMENSION_DISPLAY@` is a server-expanded token; evaluated raw it was empty. | Parameters using it evaluate the server's `displayLogicExpression` (`resolveParameterDisplayLogic`). |
| Dimensions hidden for clients that do not maintain them centrally, and Campaign / Activity / Sales Region always hidden. | The session lacked Classic's `$Element_<elementtype>` values. | `com.etendoerp.metadata` `SessionBuilder` now emits them (see its technical reference). |

With F&B the "Dimensions" section shows Organization, Business Partner and Project, as Classic.

**Fixes found while testing the "+"** (ETP-5877):

| Problem | Cause | Fix |
|---|---|---|
| Opening or closing Add Payment on top reset Add Transaction, losing its values and the payment just written. | The nested-process host built a new button object for every entry on each render; the modal re-initializes when its button changes. | One button per stack entry (`getButtonStub`). |
| Add Payment opened from the "+" had no title. | A nested launch is titled by its `windowTitle`, which the "+" did not send. | Titled as Classic `OBUISEL_AddNewRecord` ("Add Payment"). |
| Picking a payment (from the combo or the "+") left the amounts empty. | With an empty description the stored Payment onChange omitted `strDescription` (`undefined` is dropped from the JSON); `AddTransactionOnChangePaymentActionHandler` reads it with `getString` and answered `{}`. | The stored onChange sends `''` (exported to `com.etendoerp.metadata.template`). |

**Search and add buttons.** As in Classic, Organization, Business Partner, Project, Product, Payment and the
dimensions show a magnifier (their selectors have grid fields); G/L Item and the currencies do not. Payment also
shows a "+" that opens **Add Payment** on top. Add Payment receives the transaction values (type, amounts, business
partner, organization, date) in its defaults context. Run from the Financial Account window,
`AddPaymentActionHandler` answers `setSelectorValueFromRecord`, and the created payment is written into Payment.
This is generic for process selectors: see
[process parameter selector](../../components/process-parameter-selector.md#selector-search-and-add-buttons).

### Differences with Classic

- The split confirm uses the new UI dialog.
- The Match Statement script also sends `transactionDate` in Add's `externalParams` (Classic sends only
  `bankStatementLineId`). The value is `undefined`, so it is not sent.

## Footer buttons

The `Actions` parameter (Button List) defines three buttons. The Classic onLoad also hides Cancel and the close X.

| Button | Visible | Does (Classic) | New UI |
|---|---|---|---|
| OK | Always | Posts `_buttonValue: OK`; the handler returns `{}`. The popup closes without a message. | Same (no generic toast for a response without message). |
| Reconcile All (`RE`) | Always | Posts `_buttonValue: RE`. The handler updates the draft reconciliation dates and balance and **processes** it (`FIN_ReconciliationProcess`, action `P`: `CO`). Answers "Success" or an error (e.g. a closed period, `APRM_PeriodNotAvailableClearedItem`). | Same request; the success message is a toast on close, and an error is shown in the modal (Classic shows it in the Financial Account window). |
| Unmatch Selected (`UN`) | Hidden; shown while at least one selected row is matched (`cleared`) | The onLoad overrides its action: `UnMatchSelectedTransactionsActionHandler` with the selected records, then refresh and the handler's message. | See below. |

### Unmatch Selected

It never showed in the new UI, and pressing it would have failed:

| Gap | Fix |
|---|---|
| onLoad stores `view.unmatchButton` on its view; onGridLoad, which shows / hides it on selection changes, receives another view. | Script-assigned view properties are shared by the modal's views (`withScriptScope`). |
| After the unmatch refresh the selected records keep their old values (`cleared`, `bslUpdated`), and a line filtered out is still selected, so the button stayed visible. | As Classic `selectionChanged`, the stored scripts read each selected line from the rows the grid holds now (`grid.getEditedRecord(grid.getRecordIndex(selected))`): a line no longer matched, or no longer loaded, does not count for the visibility and is not sent. The selection itself is not rewritten, so user edits in other processes (e.g. Add Payment amounts) are untouched. |
| Visibility was only recomputed on selection changes; Classic also recomputes it when the rows are drawn. | Stored onGridLoad calls `refreshUnmatchVisibility()` after every load. |
| The selected records were sent with `bslUpdated` as a string with an offset; the handler compares it as UTC and answered `APRM_StaleDate` on servers outside UTC. | Stored onLoad sends `bslUpdated` as a `Date` (`toUnmatchRecord`), as Classic did. |
| Each onGridLoad run added another selection subscription. | onGridLoad subscriptions are replaced per execution (`runWithScopedSubscriptions`). |

The stored JavaScript changes are exported to `com.etendoerp.metadata.template` (`configScript.xml`).

### Pending

- Selecting the row when a button is clicked (Classic `selectSingleRecord`).

## End-to-end tests

`playwright-tests/e2e/smoke/05_Financial/FINeMatchStatementTest.spec.ts` (project `suite-04-financial`) covers the
flows above on Spain Bank. Its `beforeAll` creates a statement with three lines through the datasource: two with a
matching transaction each (same G/L item, date and amount), and one with no G/L item and no transaction, so Add
Transaction offers its Payment field. It runs the Classic "Process" of the statement and of the transactions. The
tests run in order on that statement:

| Test | Checks |
|---|---|
| Cancel in the algorithm prompt | The line stays unmatched; Search, Add and Clear render in the Match column and there is no Actions column. |
| Search | Find Transactions matches the line with the picked transaction. |
| Clear | The line is unmatched; Search and Add are enabled again. |
| Add | Add Transaction opens with the transaction type, G/L item and amount of the line; closing it creates nothing. |
| Magnifying glass of an Add Transaction selector | The Business Partner popup filters by commercial name and the picked partner is set. |
| "+" of Payment | Add Payment opens on top (deposit to the account), creates the payment, and the payment comes back to Add Transaction with its amount; executing Add Transaction matches the line. |
| Confirm in the algorithm prompt | The prompt text is translated (no `APRM_` key) and the algorithm matches the other line. |
| Unmatch Selected | Shown only for a selected matched line; unmatches it and shows the handler message. |

Classic only processes a statement whose lines are later than every line of the processed statements of the account,
so the spec dates the new lines the day after the last one (today on a fresh database). The lines are found by their
amount, unique to each run. The support pieces are `support/components/MatchStatement.ts` (row buttons, algorithm
prompt, nested processes by stack level), `support/components/SelectorModal.ts` (magnifying glass, popup, "+"),
`Grid.clearFilter` and `ApiData.fetch`.

## Main files

- `packages/MainUI/utils/ob/remoteCallManager.ts`: `OB.RemoteCallManager.call`, `encodeRequestParams`.
- `packages/MainUI/utils/processes/definition/utils.ts`: `remoteCall` → `callAction` with `queryParams`.
- `packages/MainUI/utils/processes/definition/sourceView.ts`: `buildSourceView`. It reuses
  `buildProcessPayload` from `packages/MainUI/utils/index.ts`.
- `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx`: wires `viewData.sourceView`.
- `packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts`: `handleJavaProcessResult`, toast only
  when the response carries a message.
- `packages/MainUI/utils/table/clientclassLink.ts`: `isClientclassLinkColumn`, `hasClientclassCell`,
  `splitClientclass`, `isLevelImgColumn`, `readLevelValues`, `resolveLevel`; used by `hooks/table/useColumns.tsx`
  and `WindowReferenceGrid.tsx`.
- `packages/MainUI/components/Table/Cells/LevelIndicatorCell.tsx`: the level indicator.
- `packages/MainUI/utils/processes/definition/nestedLaunch.ts`, `processStack.ts` and
  `components/ProcessModal/ProcessStackHost.tsx`: nested launches (owner context, `callerField`, refresh on success).
- `packages/MainUI/components/ProcessModal/selectors/ProcessSelectorActions.tsx`: the magnifier and "+" of process
  selectors; `hooks/useActionDispatchContext.ts` and `utils/processes/definition/actionDispatcherStore.ts`:
  `setSelectorValueFromRecord` and the stack of action handlers.
- `packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts` and `utils/preSubmitOutcome.ts`: the P&E
  `onProcess` outcome (`executeProcess()` as the submit, silent abort).
- `packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx`: `applyExternalParams`, `createGridScriptView`,
  `findRowActionsHostColumnId` (with `isClientclassComponentColumn` in `utils/table/clientclassLink.ts`).
- `packages/MainUI/components/ProcessModal/utils/defaultsRequestPayload.ts` and `buildTabStandardContext`
  (`packages/MainUI/utils/index.ts`): the context sent to `DefaultsProcessActionHandler`.
- `packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx`: `buildGridCriteria`, `findFilterColumn`,
  `toBooleanFilterValue`, `toColumnFilterSeedValue`, `collectBooleanFilterFields`.
- `packages/MainUI/utils/processes/definition/dialogs.ts` and
  `components/ProcessModal/ProcessDialogHost.tsx`: `isc.confirm`, which resolves `true` on Confirm and
  `false` on Cancel or close.
