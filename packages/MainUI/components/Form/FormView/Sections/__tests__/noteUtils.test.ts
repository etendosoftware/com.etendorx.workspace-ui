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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { NoteDeleteForbiddenError } from "@workspaceui/api-client/src/api/notes";
import { getDeleteNoteErrorMessage, getNoteBackground, isOwnNote } from "../noteUtils";
import { noteColors } from "../../styles";
import type { Note } from "../../types";

const CURRENT_USER_ID = "user-1";
const OTHER_USER_COLOR = "#F5F6FA";

/** Builds a UI note created by the given user. */
const buildNote = (createdById: string): Note => ({
  id: "note-1",
  note: "Some note",
  createdBy: { id: createdById, identifier: "Some user" },
  creationDate: "2026-07-30T10:00:00Z",
});

describe("isOwnNote", () => {
  it("returns true when the note was created by the current user", () => {
    expect(isOwnNote(buildNote(CURRENT_USER_ID), CURRENT_USER_ID)).toBe(true);
  });

  it("returns false when the note was created by another user", () => {
    expect(isOwnNote(buildNote("user-2"), CURRENT_USER_ID)).toBe(false);
  });

  it("returns false when the current user is unknown", () => {
    expect(isOwnNote(buildNote(""), undefined)).toBe(false);
    expect(isOwnNote(buildNote(""), "")).toBe(false);
  });
});

describe("getNoteBackground", () => {
  it("rotates the palette for own notes", () => {
    expect(getNoteBackground(true, 0, OTHER_USER_COLOR)).toBe(noteColors[0]);
    expect(getNoteBackground(true, noteColors.length + 1, OTHER_USER_COLOR)).toBe(noteColors[1]);
  });

  it("uses the neutral color for notes of other users", () => {
    expect(getNoteBackground(false, 3, OTHER_USER_COLOR)).toBe(OTHER_USER_COLOR);
  });
});

describe("getDeleteNoteErrorMessage", () => {
  const t = jest.fn((key: string) => key) as unknown as Parameters<typeof getDeleteNoteErrorMessage>[1];

  it("returns the translated message when the deletion is forbidden", () => {
    expect(getDeleteNoteErrorMessage(new NoteDeleteForbiddenError("note-1"), t)).toBe(
      "forms.notes.deleteNoteNotAllowed"
    );
  });

  it("returns the error message for any other error", () => {
    expect(getDeleteNoteErrorMessage(new Error("Note not found"), t)).toBe("Note not found");
  });

  it("returns the generic translated message for non-error values", () => {
    expect(getDeleteNoteErrorMessage("unexpected", t)).toBe("forms.notes.errorDeletingNote");
  });
});
