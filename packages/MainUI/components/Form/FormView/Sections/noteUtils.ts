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

import type { KeyboardEvent } from "react";
import { getNoteDeleteErrorStatus, HTTP_FORBIDDEN, HTTP_NOT_FOUND } from "@workspaceui/api-client/src/api/notes";
import type { Note as ApiNote } from "@workspaceui/api-client/src/api/types";
import type { TranslateFunction } from "@/hooks/types";
import type { Note } from "../types";

/** Maximum length of a note: the dictionary length of the note column, also enforced by the classic UI. */
export const NOTE_MAX_LENGTH = 2000;

const DELETE_NOTE_FALLBACK_MESSAGE = "Failed to delete note";
const UNKNOWN_INITIALS = "?";
const MAX_INITIALS = 2;

/**
 * Converts a note returned by the notes servlet into the shape the section renders.
 *
 * @param apiNote - The note as returned by the servlet
 * @returns The note for the UI; the author name is empty when the servlet sends none
 */
export const toUiNote = (apiNote: ApiNote): Note => ({
  id: apiNote.id,
  note: apiNote.note ?? "",
  createdBy: {
    id: apiNote.createdBy || "",
    identifier: apiNote.createdBy$_identifier || "",
  },
  creationDate: apiNote.creationDate,
});

/**
 * Tells whether the note was created by the current user, the only one allowed to delete it
 * (same rule as the classic notes grid and the server-side check of the notes servlet).
 * Without a known current user no note is considered own, so no delete option is offered.
 *
 * @param note - The note to check
 * @param currentUserId - The AD_User_ID of the logged user
 * @returns True when the note belongs to the current user
 */
export const isOwnNote = (note: Note, currentUserId?: string): boolean =>
  Boolean(currentUserId) && note.createdBy.id === currentUserId;

/**
 * Builds the initials shown in the author avatar: the first letter of up to two words of the name.
 *
 * @param name - The author name
 * @returns Up to two uppercase initials, or "?" when the name is empty
 */
export const getAuthorInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return initials || UNKNOWN_INITIALS;
};

/**
 * Tells whether a key press is the shortcut that submits a note (Ctrl+Enter, or Cmd+Enter on macOS).
 *
 * @param event - The keyboard event of the note input
 * @returns True when the note must be submitted
 */
export const isSubmitShortcut = (event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey">): boolean =>
  event.key === "Enter" && (event.ctrlKey || event.metaKey);

/**
 * Tells whether a failed deletion means the note no longer exists (it was already deleted, e.g. from
 * another session), in which case the section just removes it.
 *
 * @param error - The error thrown by the delete request
 * @returns True when the servlet answered that the note does not exist
 */
export const isNoteAlreadyDeleted = (error: unknown): boolean => getNoteDeleteErrorStatus(error) === HTTP_NOT_FOUND;

/**
 * Resolves the message of a failed notes request: the server message when there is one, else the
 * given translated fallback.
 *
 * @param error - The error thrown by the request
 * @param fallback - Message used when the error carries none
 * @returns The message to show to the user
 */
export const getRequestErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

/**
 * Combines the notes loaded from the server with the ones already on screen. A note the user added
 * while the list was loading is kept (on top) when the loaded list does not include it yet.
 *
 * @param fetched - Notes returned by the server, newest first
 * @param current - Notes currently shown
 * @returns The notes to show, without duplicates
 */
export const mergeFetchedNotes = (fetched: Note[], current: Note[]): Note[] => {
  const fetchedIds = new Set(fetched.map((note) => note.id));
  return [...current.filter((note) => !fetchedIds.has(note.id)), ...fetched];
};

/**
 * Puts a just created note on top of the list, replacing any copy of it already loaded.
 *
 * @param note - The created note
 * @param current - Notes currently shown
 * @returns The notes to show, newest first
 */
export const addNoteOnTop = (note: Note, current: Note[]): Note[] => [
  note,
  ...current.filter((currentNote) => currentNote.id !== note.id),
];

/**
 * Resolves the message shown when a note cannot be deleted. A permission rejection from the server
 * (the note belongs to another user) gets a translated message instead of the raw server response.
 *
 * @param error - The error thrown by the delete request
 * @param t - Translation function
 * @returns The message to show to the user
 */
export const getDeleteNoteErrorMessage = (error: unknown, t: TranslateFunction): string => {
  if (getNoteDeleteErrorStatus(error) === HTTP_FORBIDDEN) {
    return t("forms.notes.deleteNoteNotAllowed");
  }
  return getRequestErrorMessage(error, t("forms.notes.errorDeletingNote") || DELETE_NOTE_FALLBACK_MESSAGE);
};
