# Record Notes

The **Notes** section of a record's form lists the notes attached to the record (`AD_Note`) and lets the
user add and delete them. This document covers who can delete a note and how each note is displayed
(Jira ETP-5999).

## Behavior

- Notes are loaded when the section is expanded and the record has at least one note, through the
  notes servlet of the metadata module (`GET /notes?table=…&record=…`, newest first).
- **Delete only own notes**: the delete button is rendered only on notes whose creator (`createdBy`) is
  the logged user (`useUserStore` → `user.id`, the `AD_User_ID`). Notes of other users have no delete
  option. When the current user is unknown, no note offers the option.
- **Own vs. other users' notes**: own notes keep the rotating card palette (`noteColors`); notes of other
  users share a neutral background (`theme.palette.baselineColor.neutral[10]`), so they are told apart
  at a glance.
- **Creation date and time**: each card shows `Created by: <user> - <date> <time>`, with the date and
  the time (hours, minutes, seconds) in the browser locale through `formatClassicDate(value, true)`, the
  same formatter used for audit date columns in the grid (see
  [DATE_FORMATTING.md](../../../packages/MainUI/docs/DATE_FORMATTING.md)). The servlet returns
  `creationDate` as an ISO UTC timestamp, so it is shown in the user's local time.
- Adding a note puts it on top of the list with the delete option (it belongs to the current user);
  adding and deleting call `onNotesChange()` so the note count in the section title stays correct.

## Decisions

- **The server check is kept.** `NotesServlet` still rejects deleting a note of another user
  (`403 Insufficient permissions to delete note`). Hiding the button is a usability fix, not the
  security boundary, so no backend change was needed: the servlet already returns `createdBy` and the
  full timestamp for both listed and newly created notes.
- **Absolute date and time instead of a relative interval.** Classic shows how long ago the note was
  written ("2 hours ago by …"); the task asks for the full creation date and time in the user's format,
  which is unambiguous and consistent with the audit fields of the New UI.

## Differences with Classic

| Aspect | Classic | New UI |
|---|---|---|
| Delete option | `[ delete ]` link only on own notes | Delete icon (on hover) only on own notes |
| Own vs. other notes | Different color bar per row | Rotating palette vs. neutral card background |
| Date | Relative interval ("2 hours ago") | Creation date and time in the browser locale |

## Main files

- `packages/MainUI/components/Form/FormView/Sections/noteSection.tsx`: Notes section component.
- `packages/MainUI/components/Form/FormView/Sections/noteUtils.ts`: `isOwnNote` and `getNoteBackground`.
- `packages/api-client/src/api/notes.ts`: fetch, create and delete requests.
- `com.etendoerp.metadata` `NotesServlet`: notes endpoint and server-side delete permission check.
