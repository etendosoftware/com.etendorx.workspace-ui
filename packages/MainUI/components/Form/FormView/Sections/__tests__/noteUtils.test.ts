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

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND, NoteDeleteError } from "@workspaceui/api-client/src/api/notes";
import {
  addNoteOnTop,
  formatRelativeTime,
  getDeleteNoteErrorMessage,
  getRequestErrorMessage,
  isNoteAlreadyDeleted,
  isOwnNote,
  isSubmitShortcut,
  mergeFetchedNotes,
  toUiNote,
} from "../noteUtils";
import type { Note } from "../../types";

const CURRENT_USER_ID = "user-1";
const NOTE_ID = "note-1";
const FALLBACK = "fallback";

/** Builds a UI note created by the given user. */
const buildNote = (createdById: string, id = NOTE_ID): Note => ({
  id,
  note: "Some note",
  createdBy: { id: createdById, identifier: "Some user" },
  creationDate: "2026-07-30T10:00:00Z",
});

describe("toUiNote", () => {
  it("maps the servlet note to the UI shape", () => {
    const apiNote = {
      id: NOTE_ID,
      note: "text",
      createdBy: CURRENT_USER_ID,
      createdBy$_identifier: "Admin",
      creationDate: "2026-07-30T10:00:00Z",
    };

    expect(toUiNote(apiNote)).toEqual({
      id: NOTE_ID,
      note: "text",
      createdBy: { id: CURRENT_USER_ID, identifier: "Admin" },
      creationDate: apiNote.creationDate,
    });
  });

  it("defaults missing text and author to empty values", () => {
    const apiNote = { id: NOTE_ID, creationDate: "" } as unknown as Parameters<typeof toUiNote>[0];

    expect(toUiNote(apiNote)).toMatchObject({ note: "", createdBy: { id: "", identifier: "" } });
  });
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

describe("formatRelativeTime", () => {
  const NOW = Date.parse("2026-07-30T12:00:00Z");
  const MINUTE = 60_000;
  const DAY = 24 * 60 * MINUTE;
  const isoAgo = (ms: number) => new Date(NOW - ms).toISOString();

  it.each([
    [30_000, "now"],
    [5 * MINUTE, "5 minutes ago"],
    [3 * 60 * MINUTE, "3 hours ago"],
    [DAY, "yesterday"],
    [3 * DAY, "3 days ago"],
    [14 * DAY, "2 weeks ago"],
    [60 * DAY, "2 months ago"],
    [800 * DAY, "2 years ago"],
  ])("describes %i ms ago as '%s'", (elapsed, expected) => {
    expect(formatRelativeTime(isoAgo(elapsed), NOW, "en-US")).toBe(expected);
  });

  it("uses the language of the user", () => {
    expect(formatRelativeTime(isoAgo(5 * MINUTE), NOW, "es-ES")).toBe("hace 5 minutos");
  });

  it("reads a date ahead of the clock as now and an invalid date as empty", () => {
    expect(formatRelativeTime(new Date(NOW + DAY).toISOString(), NOW, "en-US")).toBe("now");
    expect(formatRelativeTime("not a date", NOW, "en-US")).toBe("");
  });
});

describe("isSubmitShortcut", () => {
  it("accepts Enter with Ctrl or Cmd only", () => {
    expect(isSubmitShortcut({ key: "Enter", ctrlKey: true, metaKey: false })).toBe(true);
    expect(isSubmitShortcut({ key: "Enter", ctrlKey: false, metaKey: true })).toBe(true);
    expect(isSubmitShortcut({ key: "Enter", ctrlKey: false, metaKey: false })).toBe(false);
    expect(isSubmitShortcut({ key: "a", ctrlKey: true, metaKey: false })).toBe(false);
  });
});

describe("isNoteAlreadyDeleted", () => {
  it("only detects a not found deletion", () => {
    expect(isNoteAlreadyDeleted(new NoteDeleteError(NOTE_ID, HTTP_NOT_FOUND))).toBe(true);
    expect(isNoteAlreadyDeleted(new NoteDeleteError(NOTE_ID, HTTP_FORBIDDEN))).toBe(false);
    expect(isNoteAlreadyDeleted(new Error("other"))).toBe(false);
  });
});

describe("getRequestErrorMessage", () => {
  it("uses the error message when there is one, else the fallback", () => {
    expect(getRequestErrorMessage(new Error("server says"), FALLBACK)).toBe("server says");
    expect(getRequestErrorMessage(new Error(""), FALLBACK)).toBe(FALLBACK);
    expect(getRequestErrorMessage("unexpected", FALLBACK)).toBe(FALLBACK);
  });
});

describe("mergeFetchedNotes", () => {
  it("keeps the notes added while loading on top, without duplicates", () => {
    const fetched = [buildNote(CURRENT_USER_ID, "a"), buildNote(CURRENT_USER_ID, "b")];
    const current = [buildNote(CURRENT_USER_ID, "new"), buildNote(CURRENT_USER_ID, "a")];

    expect(mergeFetchedNotes(fetched, current).map((note) => note.id)).toEqual(["new", "a", "b"]);
  });
});

describe("addNoteOnTop", () => {
  it("puts the created note first and drops a previous copy of it", () => {
    const current = [buildNote(CURRENT_USER_ID, "a"), buildNote(CURRENT_USER_ID, "new")];

    expect(addNoteOnTop(buildNote(CURRENT_USER_ID, "new"), current).map((note) => note.id)).toEqual(["new", "a"]);
  });
});

describe("getDeleteNoteErrorMessage", () => {
  const t = jest.fn((key: string) => key) as unknown as Parameters<typeof getDeleteNoteErrorMessage>[1];

  it("returns the translated message when the deletion is forbidden", () => {
    expect(getDeleteNoteErrorMessage(new NoteDeleteError(NOTE_ID, HTTP_FORBIDDEN), t)).toBe(
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
