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
Like classic, which reads them again on every page load, the Next proxy never caches this request: a value
written during the session (e.g. "Never show this message again") is still there after a reload.

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
| `AllowMultiTab` | Yes | One tab per window | Opening a window that is already open replaces that tab with the new target (menu, favorites, recent items, process monitor, links to a record, the start page and the "go to" of a process), as classic. With Y every opening adds a new tab. If the replaced tab has unsaved changes, the user is asked about that tab alone: saving or discarding replaces it in place, cancelling keeps it. |
| `ForcedLoginURL` | No (system) | Empty | The login page redirects to this address when the browser opened the new UI at a different one (e.g. another host name). Read without a session through `meta/login-config`. |
| `ETRX_AllowSSOLogin` | No | Not shown | With Y the profile menu offers to link the account with the single sign-on provider (Auth0 or the Etendo middleware), with the classic text `ETRX_LinkSSOAccount`, and a manual logout also closes the session of the provider. It does not hide the single sign-on buttons of the login page, which follow the `sso.auth.type` server setting, nor block a single sign-on login, in both interfaces. |
| `ShowProductCharacteristicsParents` | No | 0 | The "Characteristic Description" field of the product form shows one line per characteristic, with as many parent levels before each value as the number set (1 shows "Botella / Vidrio" instead of "Vidrio"). Applied by the server, see below. |
| `RestrictErpAccessInStoreServer` | No (system) | Allowed | On a store server, a login, a role change or an SSO login with a role other than System is refused with `BACKEND_LOGIN_RESTRICTED`. Without a store server (`ServerController`) it has no effect. |

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
- **"Never show this message again" is stored as classic does.** Both interfaces call
  `Preferences.setPreferenceValue` with the session data, so the stored preference is the same row:
  - **Scope:** global (no window), so the message stops in every window. It is visible only for the user who
    chose it, with the role, client and organization of that session. With another role the message shows
    again until the user chooses it there too.
  - **Owner:** a new row always belongs to the System client and organization `*`; the visibility fields hold
    the session client, organization and role.
  - **Changing it later:** the method rewrites the existing row with the same visibility, so choosing it again
    from either interface never creates a second row.
  - **Showing the message again:** neither interface has an action for it. The value must be set to `Y`, or the
    row deleted, in the Preference window. Since the row belongs to the System client, a client role usually
    can see it but not edit it, so an administrator with the System Administrator role has to do it. This is a
    limitation of classic that the new UI keeps.
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

- **`AllowMultiTab` replaces instead of focusing.** Classic, with the preference not Y, reuses the open tab of
  the window and shows what was asked in it. The new UI does the same: the open tab keeps its position and
  takes the new target (`utils/window/showWindow.ts`, store action `replaceWindow`). External menu entries
  (pages that are not windows) keep focusing their open tab.
- **`ForcedLoginURL` only when it points to the new UI.** Classic uses it for its own login page. The new UI
  redirects only when the path of the value contains the current path, so a value with the classic login
  address (`/security/Login`) is ignored instead of sending the user out of the new UI.
- **`ShowProductCharacteristicsParents` is applied by the server.** As in Classic, the form initialization in
  edit mode (`CharacteristicsUIDefinition.getFieldProperties`) reads the preference and answers the field with
  `{dbValue, characteristics}`: the stored text and, per characteristic of the product (ordered by its type), the
  value with its parents. The client keeps the text in the field and the characteristics under
  `<field>$_characteristics` (`useFormInitialState`), and `ProductCharacteristicsSelector` shows one read-only line
  per characteristic. A missing or non-numeric preference means no parents, in both interfaces. The grid filter of
  the same column is documented in [Product characteristics filter](../product-characteristics-filter/README.md).
- **`RestrictErpAccessInStoreServer` only allows System**, as the classic login: the role of a login is the
  default role of the user (`LoginUtils.getLoginDefaults`), and a role change is checked with the chosen role.

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

- `ForcedLoginURL` is checked by the login page of the new UI, after it loads; classic checks it on the server.
- Linking an Auth0 account needs the address `<new UI>/sso/link-callback` allowed as a callback in the Auth0
  application, and closing the Auth0 session needs the login page allowed as logout return address. The
  provider logout is opened when the user confirms the logout; a browser that blocks pop-ups can stop it when
  the logout first waited for the unsaved-changes question.
- Product characteristics: a new product, a product without characteristics or with an empty description shows
  the stored text in a read-only box (the server sends no characteristics then), where Classic shows the text or
  hides the field when it is empty. The lines are a compact list inside the field, where Classic draws a section
  with one read-only text field per characteristic.
- A login refused by `RestrictErpAccessInStoreServer` shows the message of the server. A refused role change or
  SSO login shows the generic error of those flows.

## End-to-end tests

Two regression specs in `playwright-tests/e2e/regression/12_Session/` check the rows that depend on the real
login, session and preferences. See the [E2E suite](../../testing/playwright-e2e/README.md#feature-probes) for
the data they use.

- `PREFaClassicPreferencesTest.spec.ts`: accounting and translation tabs, audit section, Linked Items, notes in a
  read-only tab, page size and filling the grid height, window personalization, StartPage (record and new
  record), LogoutRedirectURL, the filter messages (closing, the funnel and "Never show this message again"
  after a reload and a new session) and the tree fetch limit (a broad filter on Account Tree is refused with
  `OBUIAPP_TooManyNodes`, with the limit of 200 the core ships) and `ShowProductCharacteristicsParents` (with 1, a
  grouped value of the product form shows its group, with a preference of the user without window, as the server
  reads it).
- `PREFbClassicSessionPreferencesTest.spec.ts`: one tab per window (`AllowMultiTab`, with the unsaved changes
  prompt and Y for one window), the SSO account link and provider logout (`ETRX_AllowSSOLogin`) and
  `ForcedLoginURL`. The core has no SSO and a real forced login address would reach every spec and the classic
  login, so both server answers are mocked for the page only.

Covered by unit tests only:

- The process context (`FinancialManagement`, `_ShowAcct`): no visible effect in the core.
- `APRM_ShowNoDistributeMsg`: the core sample data has no business partner with more pending documents than
  one page of Add Payment.
- `RestrictErpAccessInStoreServer`: there is no store server in the core (Java tests).

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

- `packages/MainUI/utils/window/showWindow.ts`, `stores/windowStore.ts` (`replaceWindow`),
  `utils/url/utils.ts` (`setWindowInUrl`): one tab per window.
- `packages/MainUI/utils/session/forcedLoginUrl.ts`, `app/api/auth/login-config/route.ts`; metadata
  `LoginConfigService`: forced login address.
- `packages/MainUI/utils/session/ssoProvider.ts`, `components/ProfileModal/SsoLinkSection.tsx`,
  `hooks/useSSO.ts` (`startAuth0Link`), `app/sso/link-callback/page.tsx`: SSO account link and provider logout.
- `packages/MainUI/utils/form/productCharacteristics.ts`, `hooks/useFormInitialState.ts` (`applyEntryValue`),
  `components/Form/FormView/selectors/ProductCharacteristicsSelector.tsx`: product characteristics in the form.
- `com.etendoerp.metadata`: `auth/StoreServerAccess.java`, used by `LoginGuardService`, `ChangeProfileService`
  and `SSOService`: store server restriction.

## Related documentation

- [Saved views](../saved-views/README.md)
- [Record notes](../record-notes/README.md)
- [Login and logout](../login-logout/README.md)
- [Process payload building](../process-payload-building.md)
- [Profile menu](../profile-menu/README.md)
- [Product characteristics filter](../product-characteristics-filter/README.md)
