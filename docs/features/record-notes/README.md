# Record Notes

The **Notes** section of a record's form lists the notes attached to the record (`OBUIAPP_Note`) and lets
the user add and delete them. This document covers the behavior of the section, who can delete a note,
how notes are stored and how the section differs from Classic (Jira ETP-5999).

## Behavior

### Viewing notes
- Notes are loaded the first time the section is expanded for a record that has notes, through the notes
  servlet of the metadata module (`GET /notes?table=…&record=…`, newest first). While they load the
  section shows placeholders; a record without notes shows *"No notes yet. Write the first one above."*
- Each note is a row of a vertical list with:
  - the author name (*"Unknown user"* when the server sends none) and, on own notes, a **You** badge;
  - the **creation date**, in one of two modes the user switches with the button above the list
    (*"Show exact dates"* / *"Show time elapsed"*, calendar and clock icons):
    - **time elapsed** (default): in words and in the user language through `Intl.RelativeTimeFormat`
      (*"5 minutes ago"*, *"yesterday"*, *"2 weeks ago"*, *"hace 5 minutos"*): minutes, hours, days, weeks,
      months and years; less than a minute (or a date ahead of the clock) reads as *"now"*. It is refreshed
      every minute while the section is open;
    - **exact date and time** (hours, minutes, seconds) in the browser locale, through
      `formatClassicDate(value, true)`, the same formatter used by the audit date columns of the grid (see
      [DATE_FORMATTING.md](../../../packages/MainUI/docs/DATE_FORMATTING.md)).

    The other format is always available as the tooltip of the date. The chosen mode is a **session
    preference** (`useNotesPreferencesStore`): every window of the application shows the same mode, and a
    change shows at once in the other open windows. It is kept in the session storage (key
    `notes-preferences`) so it survives a page reload, and it is reset on logout through `resetSessionState`,
    so the next user starts with time elapsed. An unknown stored value also falls back to time elapsed. The
    servlet sends an ISO UTC timestamp, so dates are shown in local time; an invalid date is not shown;
  - the **full text with its line breaks**. Notes longer than 6 lines are cut, with a **Show more /
    Show less** toggle that only appears when the text does not fit (re-measured when the note is resized).
- Own notes have a faint tint of the primary color (10% of `dynamicColor.main`); notes of other users keep
  the neutral surface. Every color comes from the theme palette, so the section is readable in the light and
  dark themes. Measured contrasts (WCAG): text over 12:1, dates over 7.5:1, **You** badge 9:1, own notes'
  delete icon at least 4:1 (light) and 5:1 (dark), note input border 3.9:1 (3:1 is the minimum for a control).
  The border of the notes (30%) is decorative: notes are not interactive controls.
- The content is only rendered while the section is expanded: the collapsible keeps its children mounted,
  and a hidden note input would otherwise still be reachable with Tab.

### Adding notes
- The section starts with an inline input (no modal). **Ctrl+Enter** (Cmd+Enter on macOS) or the
  **Add Note** button adds the note.
- The button is disabled while the note is blank or being saved, which also prevents duplicated notes from
  a double click. The counter shows the length against the 2000 character limit (the input does not accept
  more).
- When the note is added it is placed on top of the list, the input is cleared and keeps the focus to write
  the next one. When adding fails, the error is shown and **the text is kept**.

### Deleting notes
- The delete button (red trash icon with a faint red background on hover, like the destructive actions of
  the Attachments section; labelled *"Delete note"*, reachable with the keyboard) is rendered only on
  notes whose creator (`createdBy`) is the logged user (`useUserStore` → `user.id`, the `AD_User_ID`).
  Without a known current user no note offers it.
- Deleting asks for an **inline confirmation inside the note** (*"Delete this note?"*). The focus moves to
  **Cancel**, and **Escape** closes it.
- The servlet answers are handled by status (`NoteDeleteError` of the API client):
  - `403` (the note is not the user's): the translated message *"You can only delete the notes you
    created."* is shown and the note stays;
  - `404` (already deleted, e.g. from another session): the note is just removed from the list;
  - any other failure shows its message.
- Adding and deleting call `onNotesChange()`, which refreshes the note count of the section title.

### Edge cases
- Responses of a record the form no longer shows (the user navigated while a request was running) are
  ignored, so notes never appear under the wrong record.
- A note added while the list is still loading is kept on top when the loaded list does not include it yet,
  and a note is never listed twice.

## Storage (metadata module)

`NotesServlet` (`POST /notes`) applies these rules when a note is created:
- **Organization**: the note takes the organization of the record it is attached to (the record itself
  when the record is an organization), as Classic does. The session organization is only the fallback,
  when the table has no runtime entity, the record does not exist or it has no organization.
- **Validation**: a blank note (only white space) is rejected with `400 Missing required parameter: note`,
  and a note longer than the dictionary length of the note column (2000) with `400 Note exceeds the
  maximum length of 2000 characters`. The text is stored as typed.
- The existing checks are kept: the table must exist, the user must be able to read the record, and only
  the creator can delete a note (`403 Insufficient permissions to delete note`).

## Decisions

- **Inline list instead of colored cards in a modal.** The previous two-column cards used a rotating
  pastel palette (the color of a note changed whenever a note was added, and the text was unreadable in the
  dark theme), cut long notes under their footer and lost line breaks. A list on theme surfaces matches the
  rest of the form and works in both themes.
- **Inline delete confirmation instead of the shared `ConfirmModal`.** The shared modal does not close with
  Escape and does not show which note is deleted; changing it would affect every confirmation of the
  application, so the section confirms inside the note instead.
- **Time elapsed by default, exact date on demand.** Classic shows how long ago the note was written
  ("2 hours ago by …"), which reads naturally; the task also asks for the full creation date and time. Both
  are offered: the elapsed time by default, the exact date with one click, and the other format in the
  tooltip.
- **Tint instead of an accent bar for own notes.** A colored side bar read as a generic decoration; a faint
  tint of the primary color, plus the **You** badge, tells own notes apart without an extra element.
- **No author avatar.** The initials repeated the author name next to them without adding information.
- **The server check is kept.** Hiding the delete button is a usability fix, not the security boundary.

## Differences with Classic

| Aspect | Classic | New UI |
|---|---|---|
| Delete option | `[ delete ]` link only on own notes | Trash button only on own notes, keyboard reachable |
| Delete confirmation | Modal dialog | Inline, inside the note; Escape cancels |
| Own vs. other notes | Different color bar per row | Primary color tint, **You** badge |
| Date | Relative interval ("2 hours ago") | Time elapsed in words or exact date and time, switchable |
| Long notes | Full text in the grid row | Cut after 6 lines with Show more / Show less |
| Note organization | Organization of the record | Same (previously the session organization) |

## Main files

- `packages/MainUI/components/Form/FormView/Sections/noteSection.tsx`: section container (loading, adding,
  deleting, stale responses).
- `packages/MainUI/components/Form/FormView/Sections/NoteComposer.tsx`: inline input.
- `packages/MainUI/components/Form/FormView/Sections/NoteItem.tsx`: one note, Show more toggle, inline
  delete confirmation.
- `packages/MainUI/components/Form/FormView/Sections/noteUtils.ts` and `noteStyles.ts`: pure helpers and
  theme-based styles.
- `packages/MainUI/stores/notesPreferencesStore.ts`: session preference of the date mode.
- `packages/api-client/src/api/notes.ts`: fetch, create and delete requests; `NoteDeleteError`.
- `com.etendoerp.metadata` `NotesServlet`: notes endpoint, validation, organization and delete permission.
- `playwright-tests/e2e/regression/09_Form/FRMdNotesAndAttachmentsTest.spec.ts`: add and delete flow.
