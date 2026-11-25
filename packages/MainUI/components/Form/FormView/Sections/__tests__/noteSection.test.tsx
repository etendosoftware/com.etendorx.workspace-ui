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

import { act, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import NoteSection from "../noteSection";
import {
  fetchNotes,
  createNote,
  deleteNote,
  NoteDeleteError,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
} from "@workspaceui/api-client/src/api/notes";
import { formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { formatRelativeTime } from "../noteUtils";
import { DATE_DISPLAY, getDateDisplayStorageKey, useNotesPreferencesStore } from "@/stores/notesPreferencesStore";
import { renderWithTheme } from "../../../../../test-utils/test-theme-provider";

const CURRENT_USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
let mockCurrentUserId: string | undefined = CURRENT_USER_ID;

jest.mock("@workspaceui/api-client/src/api/notes", () => ({
  ...jest.requireActual("@workspaceui/api-client/src/api/notes"),
  fetchNotes: jest.fn(),
  createNote: jest.fn(),
  deleteNote: jest.fn(),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id?: string } }) => unknown) =>
    selector({ user: { id: mockCurrentUserId } }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({
    onClick,
    children,
    "data-testid": testId,
    disabled,
    ariaLabel,
  }: {
    onClick?: () => void;
    children?: React.ReactNode;
    "data-testid"?: string;
    disabled?: boolean;
    ariaLabel?: string;
  }) => (
    <button type="button" onClick={onClick} data-testid={testId} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

const RECORD_ID = "1EB8E3939BA84A41BFFB08D072CEF9B3";
const OTHER_RECORD_ID = "2FC9F4A4ACB95B52C00C19E183DF0AC4";
const TABLE_ID = "2608680639F246B4992EC2BDF88B09CB";
const EXISTING_NOTE_TEXT = "Existing note";
const NEW_NOTE_TEXT = "brand new note";
const OTHER_USER_NOTE_TEXT = "Note of another user";
const DELETE_LABEL = "forms.notes.deleteNote";
const EMPTY_STATE_ID = "Typography__a680f8_empty";
const INPUT_ID = "TextField__a680f8_input";
const SUBMIT_ID = "Button__a680f8_submit";

/** Builds a note as returned by the notes servlet. */
const buildApiNote = (id: string, note: string, createdBy: string, creationDate: string) => ({
  id,
  note,
  createdBy,
  createdBy$_identifier: `Name of ${createdBy}`,
  creationDate,
});

const existingNote = buildApiNote("note-1", EXISTING_NOTE_TEXT, CURRENT_USER_ID, "2026-07-30T10:00:00Z");
const createdNote = buildApiNote("note-2", NEW_NOTE_TEXT, CURRENT_USER_ID, "2026-07-30T11:00:00Z");
const otherUserNote = buildApiNote("note-3", OTHER_USER_NOTE_TEXT, OTHER_USER_ID, "2026-07-29T08:15:00Z");

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

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUserId = CURRENT_USER_ID;
    useNotesPreferencesStore.setState(useNotesPreferencesStore.getInitialState(), true);
    (fetchNotes as jest.Mock).mockResolvedValue([existingNote]);
    (createNote as jest.Mock).mockResolvedValue(createdNote);
    (deleteNote as jest.Mock).mockResolvedValue(undefined);
  });

  /** Renders the section and waits until the given note text is on screen. */
  const renderWithNote = async (text = EXISTING_NOTE_TEXT, props: Partial<typeof defaultProps> = {}) => {
    const view = renderWithTheme(<NoteSection {...defaultProps} {...props} />);
    await screen.findByText(text);
    return view;
  };

  const getInput = () => screen.getByTestId(INPUT_ID).querySelector("textarea") as HTMLTextAreaElement;

  /** Types the given content in the note input. */
  const typeNote = (content: string) => fireEvent.change(getInput(), { target: { value: content } });

  /** Opens the inline confirmation of the given note and confirms the deletion. */
  const deleteNoteFromList = (noteId: string) => {
    fireEvent.click(within(screen.getByTestId(`Card__a680f8_${noteId}`)).getByRole("button", { name: DELETE_LABEL }));
    fireEvent.click(screen.getByTestId(`Button__a680f8_confirm_${noteId}`));
  };

  describe("loading", () => {
    it("fetches the notes of the record and renders author, date and text", async () => {
      await renderWithNote();

      expect(fetchNotes).toHaveBeenCalledWith({ recordId: RECORD_ID, tableId: TABLE_ID });
      expect(screen.getByText(`Name of ${CURRENT_USER_ID}`)).toBeInTheDocument();
      expect(screen.getByTestId(`Typography__a680f8_date_${existingNote.id}`)).toBeInTheDocument();
    });

    it("shows the elapsed time in words, with the exact date and time in its tooltip", async () => {
      await renderWithNote();
      const date = screen.getByTestId(`Typography__a680f8_date_${existingNote.id}`);

      expect(date).toHaveTextContent(formatRelativeTime(existingNote.creationDate, Date.now(), "en-US"));
      expect(date).toHaveAttribute("title", formatClassicDate(existingNote.creationDate, true));
    });

    it("switches between the elapsed time and the exact date and time", async () => {
      await renderWithNote();
      const toggle = screen.getByTestId("Button__a680f8_date_display");
      const date = () => screen.getByTestId(`Typography__a680f8_date_${existingNote.id}`);

      expect(toggle).toHaveTextContent("forms.notes.showExactDates");
      fireEvent.click(toggle);

      expect(date()).toHaveTextContent(formatClassicDate(existingNote.creationDate, true));
      expect(date().textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(toggle).toHaveTextContent("forms.notes.showRelativeDates");

      fireEvent.click(toggle);
      expect(date()).toHaveTextContent(formatRelativeTime(existingNote.creationDate, Date.now(), "en-US"));
    });

    it("shows the mode the current user chose in a previous session", async () => {
      const getItem = window.localStorage.getItem as jest.Mock;
      getItem.mockImplementation((key: string) =>
        key === getDateDisplayStorageKey(CURRENT_USER_ID) ? DATE_DISPLAY.ABSOLUTE : null
      );
      try {
        await renderWithNote();

        expect(screen.getByTestId(`Typography__a680f8_date_${existingNote.id}`)).toHaveTextContent(
          formatClassicDate(existingNote.creationDate, true)
        );
      } finally {
        getItem.mockReset();
      }
    });

    it("shows the chosen mode in the notes of every window at once", async () => {
      renderWithTheme(
        <>
          <NoteSection {...defaultProps} />
          <NoteSection {...defaultProps} recordId={OTHER_RECORD_ID} />
        </>
      );
      await waitFor(() => expect(screen.getAllByText(EXISTING_NOTE_TEXT)).toHaveLength(2));

      fireEvent.click(screen.getAllByTestId("Button__a680f8_date_display")[0]);

      const exactDate = formatClassicDate(existingNote.creationDate, true);
      for (const date of screen.getAllByTestId(`Typography__a680f8_date_${existingNote.id}`)) {
        expect(date).toHaveTextContent(exactDate);
      }
    });

    it("refreshes the elapsed time every minute", async () => {
      jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick", "setImmediate"] });
      try {
        const justNow = new Date().toISOString();
        (fetchNotes as jest.Mock).mockResolvedValue([{ ...existingNote, creationDate: justNow }]);
        await renderWithNote();
        const date = screen.getByTestId(`Typography__a680f8_date_${existingNote.id}`);
        expect(date).toHaveTextContent("now");

        act(() => {
          jest.advanceTimersByTime(2 * 60_000);
        });

        expect(date).toHaveTextContent("2 minutes ago");
      } finally {
        jest.useRealTimers();
      }
    });

    it("hides the date when the server sends an invalid one", async () => {
      (fetchNotes as jest.Mock).mockResolvedValue([{ ...existingNote, creationDate: "not a date" }]);
      await renderWithNote();

      expect(screen.queryByTestId(`Typography__a680f8_date_${existingNote.id}`)).not.toBeInTheDocument();
    });

    it("names an author the server does not send as unknown", async () => {
      (fetchNotes as jest.Mock).mockResolvedValue([{ ...existingNote, createdBy$_identifier: "" }]);
      await renderWithNote();

      expect(screen.getByText("forms.notes.unknownAuthor")).toBeInTheDocument();
    });

    it("keeps the line breaks of the note", async () => {
      const multiline = "first line\nsecond line";
      (fetchNotes as jest.Mock).mockResolvedValue([{ ...existingNote, note: multiline }]);
      await renderWithTheme(<NoteSection {...defaultProps} />);

      const body = await screen.findByTestId(`Typography__a680f8_content_${existingNote.id}`);
      expect(body.textContent).toBe(multiline);
      expect(body).toHaveStyle({ whiteSpace: "pre-wrap" });
    });

    it("shows placeholders while the notes load", () => {
      (fetchNotes as jest.Mock).mockReturnValue(new Promise(() => {}));
      renderWithTheme(<NoteSection {...defaultProps} />);

      expect(screen.getByTestId("Box__a680f8_loading")).toBeInTheDocument();
      expect(screen.queryByTestId(EMPTY_STATE_ID)).not.toBeInTheDocument();
    });

    it("does not fetch and shows the empty message when the record has no notes", () => {
      renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

      expect(fetchNotes).not.toHaveBeenCalled();
      expect(screen.getByTestId(EMPTY_STATE_ID)).toBeInTheDocument();
    });

    it("renders nothing while the section is collapsed", () => {
      renderWithTheme(<NoteSection {...defaultProps} isSectionExpanded={false} />);

      expect(fetchNotes).not.toHaveBeenCalled();
      expect(screen.queryByTestId(INPUT_ID)).not.toBeInTheDocument();
    });

    it("surfaces the servlet error message when the notes cannot be fetched", async () => {
      const serverMessage = `Invalid table ID: ${TABLE_ID}`;
      (fetchNotes as jest.Mock).mockRejectedValue(new Error(serverMessage));

      renderWithTheme(<NoteSection {...defaultProps} />);

      await waitFor(() => expect(showErrorModal).toHaveBeenCalledWith(serverMessage));
      expect(await screen.findByTestId(EMPTY_STATE_ID)).toBeInTheDocument();
    });

    it("ignores the notes of a record the form no longer shows", async () => {
      let resolveFirstFetch: (notes: unknown[]) => void = () => {};
      (fetchNotes as jest.Mock)
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveFirstFetch = resolve;
          })
        )
        .mockResolvedValueOnce([otherUserNote]);
      const { rerender } = renderWithTheme(<NoteSection {...defaultProps} />);

      rerender(<NoteSection {...defaultProps} recordId={OTHER_RECORD_ID} />);
      await screen.findByText(OTHER_USER_NOTE_TEXT);
      resolveFirstFetch([existingNote]);

      await waitFor(() => expect(fetchNotes).toHaveBeenCalledTimes(2));
      expect(screen.queryByText(EXISTING_NOTE_TEXT)).not.toBeInTheDocument();
    });
  });

  describe("adding", () => {
    it("creates a note, puts it on top and clears the input", async () => {
      (fetchNotes as jest.Mock).mockResolvedValue([otherUserNote]);
      await renderWithNote(OTHER_USER_NOTE_TEXT);

      typeNote(NEW_NOTE_TEXT);
      fireEvent.click(screen.getByTestId(SUBMIT_ID));

      expect(await screen.findByText(NEW_NOTE_TEXT)).toBeInTheDocument();
      expect(createNote).toHaveBeenCalledWith({ recordId: RECORD_ID, tableId: TABLE_ID, content: NEW_NOTE_TEXT });
      expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(NEW_NOTE_TEXT);
      expect(getInput().value).toBe("");
      expect(onNotesChange).toHaveBeenCalled();
    });

    it("submits the note with Ctrl+Enter", async () => {
      renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

      typeNote(NEW_NOTE_TEXT);
      fireEvent.keyDown(getInput(), { key: "Enter", ctrlKey: true });

      expect(await screen.findByText(NEW_NOTE_TEXT)).toBeInTheDocument();
    });

    it("keeps the submit button disabled while the note is blank", () => {
      renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

      typeNote("   ");
      fireEvent.keyDown(getInput(), { key: "Enter", ctrlKey: true });

      expect(screen.getByTestId(SUBMIT_ID)).toBeDisabled();
      expect(createNote).not.toHaveBeenCalled();
    });

    it("keeps the text and surfaces the error when the note cannot be created", async () => {
      const serverMessage = `Insufficient permissions to access record: ${RECORD_ID}`;
      (createNote as jest.Mock).mockRejectedValue(new Error(serverMessage));
      renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

      typeNote(NEW_NOTE_TEXT);
      fireEvent.click(screen.getByTestId(SUBMIT_ID));

      await waitFor(() => expect(showErrorModal).toHaveBeenCalledWith(serverMessage));
      expect(getInput().value).toBe(NEW_NOTE_TEXT);
      expect(onNotesChange).not.toHaveBeenCalled();
    });

    it("shows the character counter limited to the maximum length", () => {
      renderWithTheme(<NoteSection {...defaultProps} initialNoteCount={0} />);

      typeNote(NEW_NOTE_TEXT);

      expect(screen.getByText(`${NEW_NOTE_TEXT.length}/2000`)).toBeInTheDocument();
      expect(getInput()).toHaveAttribute("maxLength", "2000");
    });
  });

  describe("read-only tab", () => {
    it("shows the notes without the composer nor the delete option", async () => {
      renderWithTheme(<NoteSection {...defaultProps} readOnly />);
      await screen.findByText(EXISTING_NOTE_TEXT);

      expect(screen.queryByTestId(INPUT_ID)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: DELETE_LABEL })).not.toBeInTheDocument();
      expect(screen.getByText("forms.notes.youLabel")).toBeInTheDocument();
    });
  });

  describe("deleting", () => {
    it("offers the delete option only on the notes of the current user", async () => {
      (fetchNotes as jest.Mock).mockResolvedValue([existingNote, otherUserNote]);
      await renderWithNote(OTHER_USER_NOTE_TEXT);

      expect(screen.getByTestId(`Box__a680f8_delete_${existingNote.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`Box__a680f8_delete_${otherUserNote.id}`)).not.toBeInTheDocument();
      expect(screen.getByText("forms.notes.youLabel")).toBeInTheDocument();
    });

    it("does not offer the delete option when the current user is unknown", async () => {
      mockCurrentUserId = undefined;
      await renderWithNote();

      expect(screen.queryByRole("button", { name: DELETE_LABEL })).not.toBeInTheDocument();
    });

    it("deletes the note after the inline confirmation", async () => {
      await renderWithNote();

      deleteNoteFromList(existingNote.id);

      await waitFor(() => expect(deleteNote).toHaveBeenCalledWith(existingNote.id));
      await waitFor(() => expect(screen.queryByText(EXISTING_NOTE_TEXT)).not.toBeInTheDocument());
      expect(onNotesChange).toHaveBeenCalled();
    });

    it("keeps the note when the confirmation is cancelled or closed with Escape", async () => {
      await renderWithNote();
      const confirmId = `Box__a680f8_confirm_${existingNote.id}`;
      const openConfirmation = () => fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));

      openConfirmation();
      fireEvent.click(screen.getByTestId(`Button__a680f8_cancel_${existingNote.id}`));
      expect(screen.queryByTestId(confirmId)).not.toBeInTheDocument();

      openConfirmation();
      fireEvent.keyDown(screen.getByTestId(confirmId), { key: "Escape" });
      expect(screen.queryByTestId(confirmId)).not.toBeInTheDocument();

      expect(deleteNote).not.toHaveBeenCalled();
      expect(screen.getByText(EXISTING_NOTE_TEXT)).toBeInTheDocument();
    });

    it("shows a translated message when the server forbids the deletion", async () => {
      (deleteNote as jest.Mock).mockRejectedValue(new NoteDeleteError(existingNote.id, HTTP_FORBIDDEN));
      await renderWithNote();

      deleteNoteFromList(existingNote.id);

      await waitFor(() => expect(showErrorModal).toHaveBeenCalledWith("forms.notes.deleteNoteNotAllowed"));
      expect(screen.getByText(EXISTING_NOTE_TEXT)).toBeInTheDocument();
      expect(onNotesChange).not.toHaveBeenCalled();
    });

    it("removes a note that was already deleted without showing an error", async () => {
      (deleteNote as jest.Mock).mockRejectedValue(new NoteDeleteError(existingNote.id, HTTP_NOT_FOUND));
      await renderWithNote();

      deleteNoteFromList(existingNote.id);

      await waitFor(() => expect(screen.queryByText(EXISTING_NOTE_TEXT)).not.toBeInTheDocument());
      expect(showErrorModal).not.toHaveBeenCalled();
      expect(onNotesChange).toHaveBeenCalled();
    });
  });

  describe("long notes", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("toggles between the cut and the full text when the note does not fit", async () => {
      jest.spyOn(Element.prototype, "scrollHeight", "get").mockReturnValue(500);
      await renderWithNote();
      const toggle = screen.getByTestId(`Button__a680f8_toggle_${existingNote.id}`);

      expect(toggle).toHaveTextContent("forms.notes.showMore");
      fireEvent.click(toggle);

      expect(toggle).toHaveTextContent("forms.notes.showLess");
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    });

    it("does not offer the toggle when the note fits", async () => {
      await renderWithNote();

      expect(screen.queryByTestId(`Button__a680f8_toggle_${existingNote.id}`)).not.toBeInTheDocument();
    });
  });
});
