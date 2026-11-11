# Process Button Read-Only Logic

A process button can have two conditions:
- **Display logic** (`AD_Field.DisplayLogic`) decides whether the button is shown.
- **Read-only logic** (`AD_Column.ReadOnlyLogic`) keeps the button shown but disabled.

The New UI applies both conditions to the entries of the toolbar process menu, the same way Classic does. A disabled entry cannot be clicked, triggered from the keyboard or run.

Jira: ETP-5995. Examples:
- *Sync Tool Structure* (Copilot › Skill/Tool) and *Check Hosts* (Copilot › Agent) have the logic `@AD_ROLE_ID@!'0'`: only the System role can run them.
- *Send to SII* is disabled once the invoice has been sent and accepted.

## Behavior

- **Evaluation.** The read-only logic is evaluated for the buttons that pass the display logic. Both conditions use the same evaluation context:
  - the selected record;
  - the form values the logic reads;
  - the parent record;
  - the auxiliary inputs and session attributes of the record;
  - the user session and preferences.
- **Several records selected.** Only multi-record processes stay visible. Such a button is disabled when its read-only logic is true for **any** selected record, as in Classic's `OBToolbarActionButton.updateState`.
- **Record context.** When a button's display or read-only logic reads `context.*`, the toolbar requests the FormInitialization of the **last selected record** in table view. The response's auxiliary inputs and `sessionAttributes` feed the context shared by every selected record. Classic's `refreshCustomButtons` does the same, at any tab level. The session attributes are where tokens such as `@AD_ROLE_ID@` are resolved: the server resolves them with `Utility.getContext`, and the client session does not hold them. In form view, the form's own initialization provides the context, so nothing extra is requested.
- **Pending context.** Until the record's context arrives, an unresolved `context.*` token reads `''`, the Classic fallback. With `@AD_ROLE_ID@!'0'` the button shows disabled until the role is known.
- **Re-evaluation.** The conditions are re-evaluated when any of the following changes:
  - the selection;
  - the record context;
  - the session;
  - a form field read by either logic.
- **Execution guard.** The menu ignores clicks and Enter/Space on a disabled entry. As a safety net, the toolbar's process handler also refuses to run a button that is disabled by role access or by its read-only logic.

## Decisions

- **Disable, not hide.** Classic keeps a read-only button visible and disabled. The same disabled state is used for processes the role cannot run ([Role Access Restrictions](../role-access-restrictions/README.md)), so one rule (`isProcessButtonEnabled`) serves the menu and the execution guard.
- **Session attributes join the toolbar context for both logics.** Classic's context contains `viewForm.sessionAttributes` for display and read-only logic alike. Display logic therefore now also reads the record's fresh session attributes instead of only the global session.
- **A logic that cannot be evaluated disables the button.** This matches read-only form fields: a failure never enables a process Classic could block. The error is logged.
- **The static `AD_Field.IsReadOnly` flag does not disable buttons**, as in Classic, where only the column's read-only logic does.

## Configuration

None. The backend already serves `readOnlyLogicExpression` for every field with a column, buttons included. It is built from `AD_Column.ReadOnlyLogic` with Classic's `DynamicExpressionParser`.

## Differences with Classic

- Classic refreshes the toolbar with a FormInitialization in `SETSESSION` mode. The New UI's toolbar uses its existing `EDIT` request: the context it returns is the same, and the grid's own `SETSESSION` sync is unchanged.
- The "Processes" toolbar trigger stays enabled even when every entry is disabled. The disabled entries show why nothing can be run.

## Main files

- [`hooks/Toolbar/useToolbar.ts`](../../../packages/MainUI/hooks/Toolbar/useToolbar.ts) does two things:
  - builds the record context: last selected record, auxiliary inputs and session attributes;
  - returns `readOnlyProcessButtonIds` alongside `processButtons`.
- [`utils/toolbar/process-button/readOnlyLogic.ts`](../../../packages/MainUI/utils/toolbar/process-button/readOnlyLogic.ts): `isProcessButtonReadOnly`, `collectReadOnlyButtonIds`.
- [`utils/toolbar/process-button/utils.tsx`](../../../packages/MainUI/utils/toolbar/process-button/utils.tsx): `buttonNeedsContext`, `isProcessButtonEnabled`.
- [`components/Toolbar/Menus/ProcessMenu.tsx`](../../../packages/MainUI/components/Toolbar/Menus/ProcessMenu.tsx) shows the disabled entries.
- [`components/Toolbar/Toolbar.tsx`](../../../packages/MainUI/components/Toolbar/Toolbar.tsx) holds the execution guard.

E2E: the smoke probe PRCf injects a read-only logic on Sales Invoice "Add Payment" (the core has no button
that can be shown read-only) and checks the disabled entry with one and several records selected; see
[Playwright E2E](../../testing/playwright-e2e/README.md).

Related: [Toolbar](../../components/toolbar.md), [Display logic expression parsing](../display-logic-expression-parsing.md).
