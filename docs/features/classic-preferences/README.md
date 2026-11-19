# Classic interface preferences

Etendo preferences (`AD_Preference`) let an administrator change how the application behaves, without
programming, for the whole system or for a client, organization, role, user or window. Classic applies part
of them in its own interface. This document covers the ones the new UI applies in the same way (ETP-6356).

Preferences applied by the server (business rules, reports, data security), by display logic, and the ones
documented elsewhere (delete, attachments and export permissions, refresh after deletion, keyboard shortcuts,
recent items, saved views, autosave) are not repeated here.

## How a preference is read

The client loads every preference once per session from `GET meta/preferences` (`PreferencesService` in
`com.etendoerp.metadata`), which resolves the priority (system, client, organization, role, user) with the
classic `Preferences.getAllPreferences`. A preference set for a window is published as `KEY_<windowId>`.

`utils/propertyStore.ts` → `resolvePreference(key, windowId)` reads it as classic
`OB.PropertyStore.get(key, windowId)`: the value of the window first, the global value second.
`utils/preferences/classicPreferences.ts` holds the preference names and small helpers over it
(`isPreferenceYes`, `isPreferenceDisabled`, `getNumericPreference`) so each feature keeps the classic rule
without repeating it. Reading preferences from process scripts is described in
[process-scripts/preferences.md](../process-scripts/preferences.md).

## Behaviour

| Preference | Window scope | Default | Behaviour |
| --- | --- | --- | --- |
| `ShowAcct` | Yes | Hidden | Accounting tabs (`AD_Tab.IsAccountingTab`) and their child tabs are shown only with Y. |
| `ShowTrl` | Yes | Hidden | Translation tabs (`AD_Tab.IsTranslationTab`) and their child tabs are shown only with Y. |
| `FinancialManagement` | Yes | Empty | Value of `@FinancialManagement@` in the display logic of process parameters. |
| `ShowAcct` (processes) | No | Empty | Value of `@#ShowAcct@` in processes. Global only, as the classic session value set at login. |
| `StartPage` | No | Home | After login, opens what `/?tabId=<AD_Tab_ID>[&recordId=<id>][&command=NEW]` names, as classic `OB.Utilities.openDirectTab`: the window of the tab as from the menu, the record in the form of that tab, or a new record in the top tab of the window. |
| `LogoutRedirectURL` | No | Login page | After a manual logout the browser goes to this address, and a notice tells the user where they are being redirected while the session closes. Empty or `Default` keeps the login page. |
| `ShowAuditDefault` | Yes | Collapsed | With Y the audit section of the form opens expanded. |
| `DisableNotesForReadOnlyTabs` | Yes | Allowed | With Y, a read-only tab shows its notes but does not let the user add or delete them. |
| `OBUIAPP_WindowPersonalization_Override` | Yes | Allowed | With `N` or `false`, a user who is not a client or system administrator can only pick and reset saved views: saving, deleting and setting the default view are hidden, and Personalize Form is disabled. |
| `OBUIAPP_DisableLinkedItemsSection` | Yes | Shown | With Y the Linked Items section is not shown. |
| `dataPageSize` | Yes | 100 | Records requested per grid page. A value that is not a positive number keeps 100. |

Already applied without client changes:

- `BypassAccessLevelEntityCheck`: every request to `/sws/*` fills the session through
  `LoginUtils.fillSessionArguments`, which applies it as classic does at login.

## Decisions

- **Classic defaults, even where the new UI showed more before.** Accounting and translation tabs were always
  shown; now they follow classic and are hidden unless the preference is Y. Only user 100 ships with both
  preferences set to Y.
- **Tab filtering on the client.** The window metadata is cached per window and shared by every user, so the
  rule is applied in `shouldShowTab`, never in the backend window response.
- **Only a manual logout follows `LogoutRedirectURL`.** The logouts caused by an expired session or password
  keep the login page with their message, as classic only redirects from the logout action.
- **`StartPage` only on a real login.** A page reload, a role change or a token renewal load the session too,
  and do not open it.
- **`ShowAuditDefault` only seeds the section, as in classic.** Classic reads it once, when the window view is
  created, and reuses the form for every record, so a section the user collapses stays collapsed while the
  window is open. The new UI applies it the first time the tab's form opens in that window and then keeps
  the user's choice (in memory, per window and tab). Opening the window again or reloading the page applies
  the preference again, in both interfaces.
- **Administrators keep personalizing.** Administrators are the roles with user level Client or System, the
  same ones that may save shared views. No license restriction is applied.

## Differences with Classic

- `StartPage`:
  - **Supported as in classic:** `tabId`, `recordId` (the parent tabs of a sub-tab get their records, as
    with a link) and `command=NEW`, which, as in classic, always creates the record in the top tab.
  - **Not supported:** a value that is not a `?tabId=` address, such as a classic servlet or form
    (`/ad_forms/...`). Classic navigates to it; the new UI has no equivalent page and stays on the home page.
  - **A tab without `recordId`** opens its window as from the menu, on the top tab. Classic selects the
    named sub-tab.
  - **Conflicting values** (two preferences with the same priority): classic logs the conflict and shows the
    normal page; the new UI opens the value that `meta/preferences` publishes first.
  - **When it opens:** classic redirects on the server before the application loads. The new UI opens the
    window once the session is loaded, so the home page can show for a moment, and the windows restored
    from the URL of a previous session stay open next to it.
- Classic goes to the `LogoutRedirectURL` address without any notice. The new UI shows "Logging out.
  Redirecting to ..." first, a client text (`login.logoutRedirect`), since classic has no message to reuse.
- In classic, `DisableNotesForReadOnlyTabs` only locks the note input and the server rejects a deletion. The
  new UI hides both the input and the delete action.
- Classic disables Personalize Form for every user, administrators included, and administrators personalize
  from the Window Personalization window. The new UI has no such window, so the button stays enabled for
  administrators.
- With the personalization blocked, going back to the standard view does not clear the stored default view,
  which would be a change to the views.

## Public documentation

The differences above, and the preferences not supported yet, are documented for users and partners on the
Etendo documentation site (https://docs.etendo.software/), in the "Differences with Classic" entry of the New
UI section. That work belongs to task ETP-6355; this page only records the technical behaviour.

## Main files

- `packages/MainUI/utils/preferences/classicPreferences.ts`: names and helpers.
- `packages/MainUI/utils/tabUtils.ts` (`isTabHiddenByPreference`, `shouldShowTab`): accounting and
  translation tabs.
- `packages/MainUI/utils/index.ts` (`buildProcessPayload`): process context.
- `packages/MainUI/utils/session/startPage.ts` and `packages/MainUI/contexts/user.tsx`: start page and logout.
- `packages/MainUI/utils/window/recordWindowData.ts`: window state of a record, shared by the start page and
  the links that open a record (`useRedirect`).
- `packages/MainUI/utils/form/expandedSections.ts`: audit section.
- `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx`, `Sections/noteSection.tsx`: notes and
  linked items.
- `packages/MainUI/components/Toolbar/Menus/SaveViewMenu.tsx`, `utils/toolbar/utils.tsx`: saved views and
  form personalization.
- `packages/MainUI/hooks/table/useTableData.tsx`: page size.

## Related documentation

- [Saved views](../saved-views/README.md)
- [Record notes](../record-notes/README.md)
- [Login and logout](../login-logout/README.md)
- [Process payload building](../process-payload-building.md)
