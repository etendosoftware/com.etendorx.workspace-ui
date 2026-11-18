# Profile Menu — Password Change Confirmation and Current Context (ETP-6004 / SEC-11)

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

## Decisions

| Decision | Reason |
|---|---|
| Texts come from `AD_MESSAGE`: `UINAVBA_PasswordChanged`, `UINAVBA_Role`, `UINAVBA_Client`, `UINAVBA_Organization`, `UINAVBA_Warehouse` | They are the labels Classic uses, translated in the ERP. They belong to a non-core module, so `I18NComponent` already includes them in `/meta/labels`; no backend change was needed. |
| Local translations as fallback (`navigation.profile.passwordChangedSuccess`, `navigation.profile.context*`) | The labels endpoint can be empty (no language resolved yet); the UI must never show a raw message code. |
| One shared helper, `resolveCatalogLabel` | Same catalog-first rule as the password error messages, without duplicating it. |
| Tooltip only, the avatar is kept | Showing the name on the button, as Classic does, would change the width of the navigation bar. The name is the first line of the tooltip instead. |
| Opt-in `multiline` prop on `Tooltip` | The shared tooltip did not honor line breaks; the prop is additive and no other tooltip changes. |

## Differences with Classic

- Classic shows the user name as the button text; the new UI keeps the avatar and puts the name in the
  first line of the tooltip.
- The new UI also lists the warehouse, which Classic does not show in the prompt.
- Classic confirms the change with a modal dialog (`isc.say`); the new UI uses a toast, like the rest
  of its notifications. The text is the same `AD_MESSAGE`.
- Classic does not show the prompt to portal users; the new UI has no portal mode.

## Configuration

None.

## Main files

| File | Role |
|---|---|
| `packages/MainUI/components/ProfileModal/ProfileModal.tsx` | Success toast and context tooltip |
| `packages/MainUI/components/ProfileModal/profileContext.ts` | Builds the tooltip text (`buildProfileContextTooltip`, `PROFILE_CONTEXT_LINES`) |
| `packages/MainUI/utils/catalogLabel.ts` | `resolveCatalogLabel`: `AD_MESSAGE` first, local translation as fallback |
| `packages/MainUI/utils/password.ts` | `PASSWORD_CHANGED_MESSAGE_CODE`; error resolution now delegates to `resolveCatalogLabel` |
| `packages/ComponentLibrary/src/components/Tooltip/index.tsx` | `multiline` prop |
| `packages/ComponentLibrary/src/locales/{en,es}.ts` | `navigation.profile.context*` fallback labels |

## Testing

- Client: `utils/__tests__/catalogLabel.test.ts`,
  `components/ProfileModal/__tests__/profileContext.test.ts`,
  `components/ProfileModal/__tests__/ProfileModal.feedback.test.tsx` and the *multiline* cases in
  `ComponentLibrary/src/components/Tooltip/__tests__/Tooltip.test.tsx`. Shared props for the profile
  modal suites live in `components/ProfileModal/test-utils/profileModalProps.ts`.

### Manual check

1. Avatar › *Password*: change the password of a test user. The toast shows
   *Your password has been changed!* (or its ERP translation). With a wrong current password only the
   inline error appears.
2. Hover the avatar: user name, role, client, organization and warehouse. Switch role or organization,
   hover again: the new values are shown.
3. Log in with a user whose password has expired: the mandatory change works as before.
