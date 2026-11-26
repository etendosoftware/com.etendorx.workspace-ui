# Profile Menu — Password Change Confirmation, Current Context, Password Panel and Role Switch Defaults (ETP-6004 / SEC-11, ETP-6332)

The profile menu (avatar at the top right of the navigation bar) lets users switch role,
organization, warehouse and language, and change their own password. This page covers the feedback
and context information it gives, aligned with the Classic user profile widget
(`ob-user-profile-widget.js`).

## Behavior

### Password change confirmation

After a successful voluntary change from the *Password* section, the menu closes and a success toast
is shown. When the change fails, the menu stays open and only the inline error is shown, as before;
no success toast.

The validations and the error messages are the ones documented in
[Expired Password](../expired-password/README.md) (`utils/password.ts`); this task only adds the
confirmation. The forced change at login is not affected and keeps its own toast.

### Current context on the profile button

Hovering the avatar shows a tooltip, one item per line:

```
<user name>
Role: <current role>
Client: <current client>
Organization: <current organization>
Warehouse: <current warehouse>
```

Items without a value are left out (for example, a session without warehouse). The tooltip reads the
session values from the user store, so it reflects a role or organization switch as soon as the
session is refreshed. It is hidden while the menu is open. The avatar also gets the user name as its
accessible label.

### Password panel

- Field labels use the Classic `AD_MESSAGE` keys `UINAVBA_CurrentPwd`, `UINAVBA_NewPwd` and
  `UINAVBA_ConfirmPwd`, with the local `navigation.profile.*PasswordLabel` translations as fallback.
  Each field has its own `name`/`id`, so its label is associated with the input.
- The show/hide password toggle is a real button: it is reachable with Tab, toggles with Enter or
  Space, announces *Show password* / *Hide password* and its pressed state (`aria-pressed`), and its
  icon inherits the button color, so it keeps its contrast on hover and in dark mode. It shows a focus
  ring on keyboard focus.
- The lock icons are decorative: they are no longer buttons and are left out of the tab sequence.
- The fields are spaced so a label does not touch the previous underline, and the error message is
  announced (`role="alert"`).
- The section tabs (*Profile* / *Password*) follow the user language. They used to show fixed Spanish
  texts coming from the navigation bar.

These come from `InputPassword` and `TextInputBase` in the component library. `TextInputBase` gained
optional `leftIconAriaLabel`, `rightIconAriaLabel` and `rightIconPressed` props, and an icon passed
without its click handler is now rendered as a decorative icon. Before, it was a focusable button that
did nothing; the only consumer passing icons is the password input.

### Single sign-on account link

With the preference `ETRX_AllowSSOLogin` set to Y, the profile menu shows a section to link the account with
the SSO provider: one button per provider of the Etendo middleware, or one button for Auth0 with the classic
text `ETRX_LinkSSOAccount` (read with `useServerLabels`). The provider answers at `/sso/link-callback`, which
links the account. The logout of this menu then also closes the session of the provider (`onBeforeSignOff`).
See [Classic interface preferences](../classic-preferences/README.md).
The preference does not change the login page: its single sign-on buttons follow the `sso.auth.type` setting
of the server, as in Classic.

### Role switch: organization, warehouse and list order (ETP-6332)

The organization and warehouse lists of the menu, and the values a change fills in, follow the
Classic widget:

- The organizations of a role and the warehouses of each organization are listed **sorted by name**.
  The roles keep the order of the server, as in Classic.
- Picking another role fills in the **first organization** of the sorted list and the **first
  warehouse** of that organization. The user's default organization and warehouse are not used, and
  neither is the selection of a previous session.
- Picking only another organization fills in its first warehouse.
- A role without organizations falls back to `*` and no warehouse, as before.

The order is Classic's: `user-info.js.ftl` sorts both lists with SmartClient
`sortByProperty('_identifier', true)`, which lowercases the names and compares them with
`localeCompare` in the browser locale. `compareClassicNames` does the same, so accents and lowercase
names land where Classic puts them (for example `*`, `F&B España - Región Norte`,
`F&B España - Región Sur`, `F&B España, S.A`, `F&B International Group`, `F&B US East Coast`).

The saved payload is unchanged: the displayed role, organization and warehouse are posted, as
described in `profileUpdates.ts` (ETP-4370). The rule of ETP-4370 that picked an organization and
warehouse configured for the role is no longer applied anywhere: the client always sends the
displayed values, and the session service reads no role defaults. The login defaults
([Login and logout](../login-logout/README.md)) and *Save as default* are not affected.

## Decisions

| Decision | Reason |
|---|---|
| Texts come from `AD_MESSAGE`: `UINAVBA_PasswordChanged`, `UINAVBA_Role`, `UINAVBA_Client`, `UINAVBA_Organization`, `UINAVBA_Warehouse` | They are the labels Classic uses, translated in the ERP. They belong to a non-core module, so `I18NComponent` already includes them in `/meta/labels`; no backend change was needed. |
| Local translations as fallback (`navigation.profile.passwordChangedSuccess`, `navigation.profile.context*`) | The labels endpoint can be empty (no language resolved yet); the UI must never show a raw message code. |
| One shared helper, `resolveCatalogLabel` | Same catalog-first rule as the password error messages, without duplicating it. |
| Tooltip only, the avatar is kept | Showing the name on the button, as Classic does, would change the width of the navigation bar. The name is the first line of the tooltip instead. |
| Organizations and warehouses sorted in the client, not in `/meta/session` | Classic sorts them in the browser (`toLowerCase` + `localeCompare`); a server-side collation would not match it, and the session tree, its cache and its other consumers stay as they are. The order of the session is not reliable: the organizations of a role came in a different order on each build of the tree. |
| The tree is sorted once in `ProfileModal` (`sortRoleTree`) and passed down | The selectors and the change handlers read the same ordered lists, so the value filled in is always the first one shown. |
| Opt-in `multiline` prop on `Tooltip` | The shared tooltip did not honor line breaks; the prop is additive and no other tooltip changes. |

## Differences with Classic

- Classic shows the user name as the button text; the new UI keeps the avatar and puts the name in the
  first line of the tooltip.
- The new UI also lists the warehouse, which Classic does not show in the prompt.
- Classic confirms the change with a modal dialog (`isc.say`); the new UI uses a toast, like the rest
  of its notifications. The text is the same `AD_MESSAGE`.
- Classic does not show the prompt to portal users; the new UI has no portal mode.
- When the selected organization has no warehouse, the new UI offers the warehouses of every
  organization of the role (sorted by name); this fallback predates ETP-6332 and was kept as is.
- The session service lists every organization linked to the role and assigns warehouses with the
  descendant tree of each organization; Classic skips inactive role-organization links and uses the
  natural tree. Neither was changed by ETP-6332.

## Configuration

None.

## Main files

| File | Role |
|---|---|
| `packages/MainUI/components/ProfileModal/ProfileModal.tsx` | Success toast and context tooltip |
| `packages/MainUI/components/ProfileModal/profileOrdering.ts` | Classic order of organizations and warehouses (`compareClassicNames`, `sortByName`, `sortRoleTree`) and `toOption` |
| `packages/MainUI/components/ProfileModal/profileContext.ts` | Builds the tooltip text (`buildProfileContextTooltip`, `PROFILE_CONTEXT_LINES`) |
| `packages/MainUI/components/ProfileModal/SsoLinkSection.tsx`, `packages/MainUI/utils/session/ssoProvider.ts` | SSO account link and provider logout |
| `packages/MainUI/utils/catalogLabel.ts` | `resolveCatalogLabel`: `AD_MESSAGE` first, local translation as fallback |
| `packages/MainUI/utils/password.ts` | `PASSWORD_CHANGED_MESSAGE_CODE`; error resolution now delegates to `resolveCatalogLabel` |
| `packages/ComponentLibrary/src/components/Tooltip/index.tsx` | `multiline` prop |
| `packages/MainUI/components/ProfileModal/ToggleSection/index.tsx` | Password panel: field labels, names and spacing |
| `packages/ComponentLibrary/src/components/Input/TextInput/TextInputBase/InputPassword/index.tsx` | Visibility toggle on the adornment button, accessible names |
| `packages/ComponentLibrary/src/components/Input/TextInput/TextInputBase/TextInputBase.tsx` | Adornment icons: button with name and pressed state, or decorative |
| `packages/ComponentLibrary/src/locales/{en,es}.ts` | `navigation.profile.context*` fallback labels |

## Testing

- Client: `utils/__tests__/catalogLabel.test.ts`,
  `components/ProfileModal/__tests__/profileContext.test.ts`,
  `components/ProfileModal/__tests__/ProfileModal.feedback.test.tsx` and the *multiline* cases in
  `ComponentLibrary/src/components/Tooltip/__tests__/Tooltip.test.tsx`. Shared props for the profile
  modal suites live in `components/ProfileModal/test-utils/profileModalProps.ts`.
- Role switch (ETP-6332): `components/ProfileModal/__tests__/profileOrdering.test.ts`,
  `ProfileModal.ordering.test.tsx` (values filled in on a role or organization change) and
  `ToggleSection.profile.test.tsx` (warehouse fallback order). The fixtures with the ETP-6332 example
  live in `test-utils/profileModalProps.ts`.
- End to end: the second test of `playwright-tests/e2e/smoke/12_Session/SESaProfileSwitchTest.spec.ts`
  switches to *F&B International Group Admin* and back to *QA Testing Admin* for the session only, and
  checks the values filled in, an organization-only change and both lists against the Classic order
  written down in the spec. The server sends the organizations of *QA Testing Admin* as
  `USA, Main, *, Spain`, so a list in the server order fails it.
- Password panel and toggle: `components/ProfileModal/__tests__/ToggleSection.password.test.tsx`,
  `ComponentLibrary/.../InputPassword/InputPassword.test.tsx` (click and Tab + Enter / Space) and the
  adornment cases in `TextInputBase.test.tsx`.

### Manual check

1. Avatar › *Password*: change the password of a test user. The toast shows
   *Your password has been changed!* (or its ERP translation). With a wrong current password only the
   inline error appears.
2. Hover the avatar: user name, role, client, organization and warehouse. Switch role or organization,
   hover again: the new values are shown.
3. In the *Password* tab, press Tab from a field: the focus goes to its eye button, never to the lock
   icon. Enter or Space shows/hides the password. Hover the eye button: the icon stays readable.
4. Log in with a user whose password has expired: the mandatory change works as before.
5. Without ticking *Save as default*: from *F&B International Group Admin* pick *QA Testing Admin*:
   organization `*`, warehouse *Spain East warehouse*. Save, then pick *F&B International Group
   Admin*: `*` and *España Región Norte*. Both lists show the same order as the Classic widget, and
   changing only the organization fills in the same warehouse as Classic.

## Layout

The Role selector has an icon like the other selectors, so all values start at the same position; the
disabled Client field has no grey fill; the password fields keep the side margin of the Profile tab.
See [UI Visual Consistency](../ui-visual-consistency/README.md).
