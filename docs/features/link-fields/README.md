# Link Fields (URL validation and opening)

Fields with the **Link** reference (`FIELD_REFERENCE_CODES.LINK`, AD_Reference `800101`), e.g. *URL* in
Business Partner, hold a web address. This document describes how the New UI opens and validates them
so they behave like Classic's `OBLinkItem` (Jira ETP-5981).

## Behavior

### Opening the link
- The open-link icon of the form input and the read-only link both open the value as an **external
  address in a new tab** (`noopener,noreferrer`).
- When the value has no protocol (no `://`, e.g. `www.etendo.software`), `http://` is prepended, as
  Classic does. Values that already carry one (`https://…`, `http://…`, `ftp://…`) open unchanged.
- The icon is hidden, and the read-only link has no `href`, when the protocol is not one a Link field
  accepts (e.g. `javascript://…`), so such a value never reaches the browser.
- The stored value is never rewritten: `www.etendo.software` is saved as typed.

### Validation
- **On leaving the field**: the input shows *"Enter a valid URL, e.g. www.example.com"* under it
  (Classic's `validateOnExit`). Nothing is flagged while the user is still typing.
- **On save (form)**: after the required-field check, `useFormValidation.validateLinkFields()` checks
  every displayed, editable Link field. If any is invalid, the save is blocked, an error modal lists the
  fields (*"The following fields do not contain a valid URL: …"*) and the first one is revealed and
  focused through the same path as missing required fields
  (see [form-validation.md](../form-validation.md#revealing-missing-fields-in-collapsed-sections)).
- **Grid inline editing**: the cell is flagged with `"<field label> must be a valid URL"` when the user
  leaves it (not while typing), and saving the row is blocked. Both the row validation
  (`validateFieldValue`) and the real-time/final-save one (`validateFieldRealTime`) run the same check.
  The Column-to-Field conversion of `validationUtils` keeps `column`: metadata fields carry no `type`, so
  they are converted, and without it the Link reference was lost and nothing was flagged.
- An **empty value is valid**; whether it may be empty is decided by the required-field validation.

### Validation rules
The rules are those of Classic's `OB.Utilities.isValidURL`, checked on the value with `http://`
prepended when it has no protocol:
- protocol `http`, `https`, `ftp` or `file`;
- host: an IPv4 address, or at least two dot-separated labels made of letters, digits, `-`, `_` or
  `~` that start and end with a letter or digit, the last label (top-level domain) starting and ending
  with a letter. So `http://localhost` is rejected, as in Classic;
- no whitespace or `<>"{}|\^` characters anywhere.

| Value | Valid | Opens |
|-------|-------|-------|
| `www.etendo.software` | yes | `http://www.etendo.software` |
| `https://www.etendo.software/a?b=1` | yes | unchanged |
| `not a url` | no | — |
| `http://localhost` | no | `http://localhost` |
| *(empty)* | yes | — |

## Decisions

- **Normalize before validating.** Classic's validator requires a protocol, so it rejects
  `www.etendo.software` even though its open icon prepends `http://` to it. The New UI validates the
  value it would open, so a protocol-less address is accepted and saved as typed.
- **Classic's regular expression is not reused.** It backtracks exponentially: a ~60-character value
  such as `http://a.a.a.…a.-` takes seconds, and every extra label multiplies the time. Since the check
  runs on save over values loaded from the database, a stored value could freeze the tab of anyone
  saving the record. The same rules are applied with `new URL()` plus linear checks on the host.
- **Client-side only.** Classic has no server-side check either: the Link reference is a plain
  `StringDomainType`, so nothing changes in `com.etendoerp.metadata`.
- **No `react-hook-form` `validate` rule.** `handleSubmit` would block the save silently (no modal, no
  focus). The save is blocked in `FormActions.handleSave`, next to the required-field check.

## Differences with Classic

- `www.etendo.software` (no protocol) is a valid value; Classic flags it on exit.
- Values with a non-web protocol are not opened; Classic opens anything containing `://`.
- `new URL()` rejects a port above 65535, which Classic's expression accepts.
- The read-only grid cell shows the value as plain text, as in Classic.
- Process parameters with the Link reference are not covered (they render as a plain text input).

## Configuration

None. Any column with the Link reference gets this behavior.

## Main files

- `packages/MainUI/utils/form/linkUrl.ts`: `isLinkReference`, `toOpenableLinkUrl`, `isValidLinkUrl`.
- `packages/MainUI/components/Form/FormView/selectors/LinkSelector.tsx`: open icon, read-only link,
  on-exit error.
- `packages/MainUI/hooks/useFormValidation.ts`: `validateLinkFields`.
- `packages/MainUI/components/Form/FormView/FormActions.tsx`: save blocking.
- `packages/MainUI/components/Table/utils/validationUtils.ts`: grid inline editing.
- `packages/ComponentLibrary/src/locales/{en,es}.ts`: `form.link.*` messages.
- `http://` prefix and protocol separator constants are shared with External menu entries
  (`packages/MainUI/utils/menu/externalMenuEntry.ts`).
