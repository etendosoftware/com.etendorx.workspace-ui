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

import { isNoteDeleteForbiddenError } from "@workspaceui/api-client/src/api/notes";
import type { TranslateFunction } from "@/hooks/types";
import type { Note } from "../types";
import { noteColors } from "../styles";

const DELETE_NOTE_FALLBACK_MESSAGE = "Failed to delete note";

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
 * Resolves the card background of a note. Own notes keep the rotating palette; notes of other
 * users share a neutral color so they are told apart, like the classic own/other note styles.
 *
 * @param isOwn - Whether the note belongs to the current user
 * @param index - Position of the note in the list, used to rotate the palette
 * @param otherUserColor - Background used for notes of other users
 * @returns The background color of the note card
 */
export const getNoteBackground = (isOwn: boolean, index: number, otherUserColor: string): string => {
  if (isOwn) {
    return noteColors[index % noteColors.length];
  }
  return otherUserColor;
};

/**
 * Resolves the message shown when a note cannot be deleted. A permission rejection from the server
 * (the note belongs to another user) gets a translated message instead of the raw server response.
 *
 * @param error - The error thrown by the delete request
 * @param t - Translation function
 * @returns The message to show to the user
 */
export const getDeleteNoteErrorMessage = (error: unknown, t: TranslateFunction): string => {
  if (isNoteDeleteForbiddenError(error)) {
    return t("forms.notes.deleteNoteNotAllowed");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return t("forms.notes.errorDeletingNote") || DELETE_NOTE_FALLBACK_MESSAGE;
};
