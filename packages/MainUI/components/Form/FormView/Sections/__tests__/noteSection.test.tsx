/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NoteSection from "../noteSection";
import { fetchNotes, createNote, deleteNote } from "@workspaceui/api-client/src/api/notes";
import { formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { renderWithTheme } from "../../../../../test-utils/test-theme-provider";

jest.mock("@workspaceui/api-client/src/api/notes", () => ({
  fetchNotes: jest.fn(),
  createNote: jest.fn(),
  deleteNote: jest.fn(),
}));

const CURRENT_USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
let mockCurrentUserId: string | undefined = CURRENT_USER_ID;

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id?: string } }) => unknown) =>
    selector({ user: { id: mockCurrentUserId } }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({ onClick, children, "data-testid": testId, disabled }: any) => (
    <button type="button" onClick={onClick} data-testid={testId} disabled={disabled}>
      {children}
    </button>
  ),
}));

// The add-note form lives inside the modal, so the trigger and the content are always rendered
jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => ({
  __esModule: true,
  default: ({ customTrigger, children }: any) => (
    <div data-testid="mock-add-note-modal">
      {customTrigger}
      {children}
    </div>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal", () => ({
  __esModule: true,
  default: ({ open, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid="mock-confirm-modal">
        <button type="button" onClick={onConfirm} data-testid="confirm-button">
          Confirm
        </button>
        <button type="button" onClick={onCancel} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    ) : null,
}));

const RECORD_ID = "1EB8E3939BA84A41BFFB08D072CEF9B3";
const TABLE_ID = "2608680639F246B4992EC2BDF88B09CB";
const EXISTING_NOTE_TEXT = "Existing note";
const NEW_NOTE_TEXT = "brand new note";
const OTHER_USER_NOTE_TEXT = "Note of another user";
const DELETE_BUTTON_ID = "IconButton__a680f8";

/** Builds a note as returned by the notes servlet. */
const buildApiNote = (id: string, note: string, createdBy: string, creationDate: string) => ({
  id,
  note,
  createdBy,
  createdBy$_identifier: `Name of ${createdBy}`,
  creationDate,
});

describe("NoteSection", () => {
  const showErrorModal = jest.fn();
  const onNotesChange = jest.fn();

  const defaultProps = {
    recordId: RECORD_ID,
    tableId: TABLE_ID,
    initialNoteCount: 1,
    isSectionExpanded: true,
    onNotesChange,
    showErrorModal,
    sectionId: "notes",
    addNoteButtonText: undefined,
    modalTitleText: undefined,
    modalDescriptionText: undefined,
    noteInputPlaceholder: undefined,
    addNoteSubmitText: undefined,
  };

  const existingNote = buildApiNote("note-1", EXISTING_NOTE_TEXT, CURRENT_USER_ID, "2026-07-30T10:00:00Z");
  const createdNote = buildApiNote("note-2", NEW_NOTE_TEXT, CURRENT_USER_ID, "2026-07-30T11:00:00Z");
  const otherUserNote = buildApiNote("note-3", OTHER_USER_NOTE_TEXT, OTHER_USER_ID, "2026-07-29T08:15:00Z");

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUserId = CURRENT_USER_ID;
    (fetchNotes as jest.Mock).mockResolvedValue([existingNote]);
    (createNote as jest.Mock).mockResolvedValue(createdNote);
    (deleteNote as jest.Mock).mockResolvedValue(undefined);
  });

  /** Types the given content in the note input and submits the add-note form. */
  const submitNote = (content: string) => {
    fireEvent.change(screen.getByTestId("TextField__a680f8_input").querySelector("textarea") as HTMLTextAreaElement, {
      target: { value: content },
    });
    fireEvent.click(screen.getByTestId("Button__a680f8_submit"));
  };

  it("fetches the notes of the record and renders them", async () => {
    renderWithTheme(<NoteSection {...defaultProps} />);

    expect(fetchNotes).toHaveBeenCalledWith({ recordId: RECORD_ID, tableId: TABLE_ID });
    expect(await screen.findByText(EXISTING_NOTE_TEXT)).toBeInTheDocument();
  });

  it("does not fetch when the record has no notes", () => {
    renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

    expect(fetchNotes).not.toHaveBeenCalled();
  });

  it("creates a note and adds it on top of the list", async () => {
    renderWithTheme(<NoteSection {...defaultProps} />);
    await screen.findByText(EXISTING_NOTE_TEXT);

    submitNote(NEW_NOTE_TEXT);

    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith({
        recordId: RECORD_ID,
        tableId: TABLE_ID,
        content: NEW_NOTE_TEXT,
      });
    });
    expect(await screen.findByText(NEW_NOTE_TEXT)).toBeInTheDocument();
    expect(onNotesChange).toHaveBeenCalled();
  });

  it("does not call the API when the note is blank", () => {
    renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

    submitNote("   ");

    expect(createNote).not.toHaveBeenCalled();
  });

  it("surfaces the servlet error message when the note cannot be created", async () => {
    const serverMessage = `Insufficient permissions to access record: ${RECORD_ID}`;
    (createNote as jest.Mock).mockRejectedValue(new Error(serverMessage));

    renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

    submitNote(NEW_NOTE_TEXT);

    await waitFor(() => {
      expect(showErrorModal).toHaveBeenCalledWith(serverMessage);
    });
    expect(onNotesChange).not.toHaveBeenCalled();
  });

  it("surfaces the servlet error message when the notes cannot be fetched", async () => {
    const serverMessage = `Invalid table ID: ${TABLE_ID}`;
    (fetchNotes as jest.Mock).mockRejectedValue(new Error(serverMessage));

    renderWithTheme(<NoteSection {...defaultProps} />);

    await waitFor(() => {
      expect(showErrorModal).toHaveBeenCalledWith(serverMessage);
    });
  });

  it("asks for confirmation and deletes the note", async () => {
    renderWithTheme(<NoteSection {...defaultProps} />);
    await screen.findByText(EXISTING_NOTE_TEXT);

    fireEvent.click(screen.getByTestId(DELETE_BUTTON_ID));
    expect(screen.getByTestId("mock-confirm-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("confirm-button"));

    await waitFor(() => {
      expect(deleteNote).toHaveBeenCalledWith(existingNote.id);
    });
    expect(screen.queryByText(EXISTING_NOTE_TEXT)).not.toBeInTheDocument();
    expect(onNotesChange).toHaveBeenCalled();
  });

  it("keeps the note when the deletion is cancelled", async () => {
    renderWithTheme(<NoteSection {...defaultProps} />);
    await screen.findByText(EXISTING_NOTE_TEXT);

    fireEvent.click(screen.getByTestId(DELETE_BUTTON_ID));
    fireEvent.click(screen.getByTestId("cancel-button"));

    expect(deleteNote).not.toHaveBeenCalled();
    expect(screen.getByText(EXISTING_NOTE_TEXT)).toBeInTheDocument();
    expect(screen.queryByTestId("mock-confirm-modal")).not.toBeInTheDocument();
  });

  it("offers the delete option only on the notes of the current user", async () => {
    (fetchNotes as jest.Mock).mockResolvedValue([existingNote, otherUserNote]);
    renderWithTheme(<NoteSection {...defaultProps} />);
    await screen.findByText(OTHER_USER_NOTE_TEXT);

    expect(screen.getByTestId(`Box__a680f8_delete_${existingNote.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`Box__a680f8_delete_${otherUserNote.id}`)).not.toBeInTheDocument();
  });

  it("does not offer the delete option when the current user is unknown", async () => {
    mockCurrentUserId = undefined;
    renderWithTheme(<NoteSection {...defaultProps} />);
    await screen.findByText(EXISTING_NOTE_TEXT);

    expect(screen.queryByTestId(DELETE_BUTTON_ID)).not.toBeInTheDocument();
  });

  it("offers the delete option on a note just created by the current user", async () => {
    renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

    submitNote(NEW_NOTE_TEXT);

    expect(await screen.findByTestId(`Box__a680f8_delete_${createdNote.id}`)).toBeInTheDocument();
  });

  it("shows the creation date with time", async () => {
    renderWithTheme(<NoteSection {...defaultProps} />);
    await screen.findByText(EXISTING_NOTE_TEXT);

    const expectedDateTime = formatClassicDate(existingNote.creationDate, true);
    expect(expectedDateTime).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(screen.getByTestId(`Typography__a680f8_date_${existingNote.id}`)).toHaveTextContent(expectedDateTime);
  });
});
