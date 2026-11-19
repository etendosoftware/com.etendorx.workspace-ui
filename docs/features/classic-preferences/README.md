# Classic interface preferences

Etendo preferences (`AD_Preference`) let an administrator change how the application behaves, without
programming, for the whole system or for a client, organization, role, user or window. Classic applies part
of them in its own interface. This document covers the ones the new UI applies in the same way (ETP-6356).

Preferences applied by the server (business rules, reports, data security), by display logic, and the ones
documented elsewhere (delete, attachments and export permissions, refresh after deletion, keyboard shortcuts,
recent items, saved views, autosave) are not repeated here.

## How a preference is read and written

The client loads every preference once per session from `GET meta/preferences` (`PreferencesService` in
`com.etendoerp.metadata`), which resolves the priority (system, client, organization, role, user) with the
classic `Preferences.getAllPreferences`. A preference set for a window is published as `KEY_<windowId>`.

`utils/propertyStore.ts` → `resolvePreference(key, windowId)` reads it as classic
`OB.PropertyStore.get(key, windowId)`: the value of the window first, the global value second.
`utils/preferences/classicPreferences.ts` holds the preference names and small helpers over it
(`isPreferenceYes`, `isPreferenceDisabled`, `getNumericPreference`) so each feature keeps the classic rule
without repeating it.

Writing works as classic `OB.PropertyStore.set(name, value, windowId)`: `persistPreference`
(`utils/preferences/persistPreference.ts`) stores the value at once for the session (under `name_windowId`
for a window) and posts it to `meta/preferences`, which stores it for the current client, organization, user
and role as classic `StorePropertyActionHandler`. The endpoint only accepts values of the Property List
("Property Configuration" reference), so it cannot write free attributes, and it never stores a System-level
preference. The `OB.PropertyStore.set` shim of process scripts uses it, honouring `noSetInServer`. Reading
preferences from process scripts is described in
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
| `OBUIAPP_ShowImplicitFilterMsg` | No | Shown | While the default filter of a tab (its HQL filter clause and/or the transactional filter of a top tab) is applied, an information message over the grid says so ("This grid is filtered using an implicit filter ... Click the funnel icon ..."), with "Never show this message again". |
| `OBUIAPP_ShowSingleRecordFilterMsg` | No | Shown | A grid opened from a link, filtered by that record, shows `OBUIAPP_SingleRecordFilterMsg` with the same options. |
| `APRM_ShowNoDistributeMsg` | No | Shown | Add Payment warns (`APRM_NoDistributeMsg`) when it distributes the amount while the order/invoice grid still has records to load. |
| `TreeDatasourceFetchLimit` | No | 200 | A tree asks for at most this number of nodes, root and children, as classic. When the server answers that the request is over the limit, the tree stays empty, the filters stay on screen and `OBUIAPP_TooManyNodes` is shown. |
| `dataPageSize` | Yes | 100 | Records requested per grid page. A value that is not a positive number keeps 100. When a page does not fill the height of the grid, the next one is requested without waiting for a scroll. |

Already applied without client changes:

- `BypassAccessLevelEntityCheck`: every request to `/sws/*` fills the session through
  `LoginUtils.fillSessionArguments`, which applies it as classic does at login.

## Texts of classic messages

Texts in the classic label catalog (`meta/labels`, the I18N labels) are read with `getLabel`, e.g.
`OBUIAPP_TooManyNodes`. Classic reads the other messages on demand with `OB.I18N.getLabelFromServer`
(`GetLabelActionHandler`); the new UI does the same through `utils/serverLabels.ts`, once per session and
language: `useServerLabels` for components and `OB.I18N.getLabelFromServer` for process scripts (same
signature as classic, it also returns a promise). The text of the implicit filter is built by the metadata
adapter as classic `OBViewGridComponent.getFilterName` (`ImplicitFilterMessage`), sent as
`tab.implicitFilterMessage`.

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
- **Filter messages are dismissed per window.** Closing the message hides it while the window stays open. Classic
  shows it again after the next load of the grid; "Never show this message again" is the way to stop it in both.
- **No new-record message.** Classic shows `OBUIAPP_NewRecordFilterMsg` only when a window opened with
  `command=NEW` goes back to the grid without loading it (a deferred load the new UI does not have), so
  `OBUIAPP_ShowNewRecordFilterMsg` has no effect.
- **Partial data in process grids.** A process grid pages its records while scrolling. `grid.data.cachedRows` is
  the number of loaded rows and `grid.data.totalRows` is one more while records are left to load, so scripts can
  check `cachedRows < totalRows` as classic does; the server total is not known until every page is loaded.
- **The tree message is a notification.** Classic writes it in the message bar of the tab; the new UI shows it
  as an error notification, so the grid and its filters stay usable.
- **The grid fills its height by itself.** The next page is requested when the grid is scrolled to the
  bottom, so a small `dataPageSize` on a tall screen left no scroll bar and the rest of the records could not
  be reached. Like the classic grid, which loads the rows its visible area needs, the grid now requests pages
  after each load and when it is resized until a scroll bar appears or there are no more records
  (`hooks/table/useFillGridViewport.ts`). Only one request is in flight at a time and a failed load is not
  retried. This applies to every grid, but with 100 records per page it rarely triggers.
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

## End-to-end tests

`playwright-tests/e2e/regression/12_Session/PREFaClassicPreferencesTest.spec.ts` (regression tier) checks the
rows that depend on the real login, session and preferences: accounting and translation tabs, audit section,
Linked Items, notes in a read-only tab, page size and filling the grid height, window personalization,
StartPage (record and new record) and LogoutRedirectURL. See the
[E2E suite](../../testing/playwright-e2e/README.md#feature-probes) for the data it uses. The process context
(`FinancialManagement`, `_ShowAcct`) has no visible effect in the core and is covered by unit tests.

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
- `com.etendoerp.metadata`: `PreferencesService` (POST), `builders/ImplicitFilterMessage.java` (filter text).
- `com.etendoerp.metadata.template`: `AP.showNoDistributeMessage` in the Add Payment PayScript logic.
- `packages/MainUI/utils/preferences/persistPreference.ts`, `utils/ob/obShim.ts`, `utils/ob/i18n.ts`,
  `utils/serverLabels.ts`, `hooks/useServerLabels.ts`: writing preferences and reading classic messages.
- `packages/MainUI/components/Table/GridFilterMessage.tsx`, `utils/table/filterMessage.ts`,
  `components/MessageBanner.tsx`: filter messages.
- `packages/MainUI/utils/table/treeMode.ts`, `hooks/useDatasource.ts`: tree fetch limit.
- `packages/MainUI/utils/processes/definition/scriptProxies.ts` (`readGridData`): partial data of process grids.
- `packages/MainUI/hooks/table/useTableData.tsx`: page size; `hooks/table/useFillGridViewport.ts` and
  `components/Table/utils/viewportFill.ts`: filling the height of the grid.

## Related documentation

- [Saved views](../saved-views/README.md)
- [Record notes](../record-notes/README.md)
- [Login and logout](../login-logout/README.md)
- [Process payload building](../process-payload-building.md)
