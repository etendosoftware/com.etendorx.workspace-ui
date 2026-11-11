# Process File Upload Maximum Size

A process parameter with the **Upload File** reference lets the user attach a file to a process, for
example the *Certificado* of *Añadir Certificado Digital* (Organization, Spanish localization). The New UI
rejects a file larger than the configured maximum before sending anything, as Classic does.

Jira: ETP-5982.

## Behavior

- **Choosing the file.** The user can pick the file in the browser's dialog or drop it on the field. The field
  is highlighted while a file is dragged over it. A dropped file replaces the selected one, and when several
  files are dropped only the first is taken, as with the dialog. A disabled field ignores drops.
- **When the check runs.** It runs when the user clicks the process's execute button, before the
  `onProcess` script and before the request. Choosing the file does not trigger it, as in Classic.
- **A file above the limit.**
  - The in-modal message bar shows Classic's error `OBUIAPP_ProcessFileMaxSizeExceeded`: "File %0 cannot be
    uploaded as its size exceeds our limits. Max size allowed: %1 MB.", where `%0` is the file name and `%1`
    the limit.
  - Nothing is sent to the server, and the modal stays open so the user can pick another file.
- **A file within the limit.** It is sent as before, as a multipart request to the process's Java handler.
- **Size unit.** A megabyte is 1024 × 1024 bytes, as in Classic and in the server's own check. A file of
  exactly the maximum size is accepted.

## Configuration

The preference `OBUIAPP_ProcessFileUploadMaxSize` holds the maximum size in MB. The core ships it with the
value `10`. It reaches the client with the rest of the user's preferences (`/meta/preferences`), so
changing it takes effect at the next login.

| Preference value | Limit |
|---|---|
| A number of 0 or more | That number of MB |
| Not a number, or negative | No limit (Classic) |
| Not set | 10 MB, the server's default (`BaseProcessActionHandler`) |

## Decisions

- **Same message key as Classic.** The text comes from the ERP's translated messages through `getLabel`, so
  it is the same in both UIs and follows the user's language.
- **Only the standard execute button is guarded.** The other execution paths do not upload files:
  - *Report and Process* posts to `/api/process/report-and-process`;
  - direct execution runs without showing the dialog, so no file can have been selected.

## Differences with Classic

- **Dropping a file.** Classic's field is the browser's native file input, which accepts a dropped file. The
  New UI hides that input behind its own button, so the field handles the drop itself.
- **Preference not set.** Classic's client then reads the limit as `0` and rejects every file with
  "Max size allowed: null MB". The New UI applies the 10 MB the server applies in that case.
- **The server's own check is unchanged.** `BaseProcessActionHandler` looks the file up by the parameter's
  name, while the New UI sends it under its DB column name. When the two differ, only the client check
  applies.

## Main files

- [`utils/process/fileUploadMaxSize.ts`](../../../packages/MainUI/utils/process/fileUploadMaxSize.ts):
  `getProcessFileUploadMaxSize`, `findOversizedFile` and the preference and message keys.
- [`components/ProcessModal/ProcessDefinitionModal.tsx`](../../../packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx):
  `handleExecuteGuarded`, the guard in front of `handleExecute`.
- [`components/ProcessModal/selectors/UploadFileSelector.tsx`](../../../packages/MainUI/components/ProcessModal/selectors/UploadFileSelector.tsx)
  renders the parameter and takes the file from the dialog or from a drop.

The *Añadir Certificado Digital* button itself depends on how auxiliary inputs are read in display logic: see
[Process Button Read-Only Logic](../process-button-read-only/README.md).
