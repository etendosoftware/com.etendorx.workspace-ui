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

import { Metadata } from "./metadata";
import type { Note, FetchNotesParams, CreateNoteParams } from "./types";

const NOTES_ENDPOINT = "/notes";

/**
 * Fetches the full list of notes for a given record using the custom notes servlet
 */
export async function fetchNotes(params: FetchNotesParams): Promise<Note[]> {
  const client = Metadata.client;

  try {
    const url = `${NOTES_ENDPOINT}?table=${encodeURIComponent(params.tableId)}&record=${encodeURIComponent(params.recordId)}`;

    const response = await client.request(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.status}`);
    }

    // The servlet returns a JSON array directly
    return (response.data || []) as Note[];
  } catch (error) {
    throw new Error(`Error fetching notes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new note for a given record using the custom notes servlet
 * @param params - The record context and the note content
 * @returns The newly created Note object from the server
 */
export async function createNote(params: CreateNoteParams): Promise<Note> {
  const client = Metadata.client;

  const requestBody = {
    table: params.tableId,
    record: params.recordId,
    note: params.content,
  };

  try {
    const response = await client.post(NOTES_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = response.data as { error?: string };
      throw new Error(errorData?.error || `Failed to create note: ${response.status}`);
    }

    return response.data as Note;
  } catch (error) {
    throw new Error(`Error creating note: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes a specific note by its ID using the custom notes servlet
 * @param noteId - The ID of the AD_Note record to delete
 */
export async function deleteNote(noteId: string): Promise<void> {
  const client = Metadata.client;

  try {
    const url = `${NOTES_ENDPOINT}/${noteId}`;

    const response = await client.request(url, { method: "DELETE" });

    if (!response.ok) {
      const errorData = response.data as { error?: string };
      throw new Error(errorData?.error || `Failed to delete note: ${response.status}`);
    }

    // Success response contains { success: true, id: noteId }
    // No need to return anything for void function
  } catch (error) {
    throw new Error(`Error deleting note: ${error instanceof Error ? error.message : String(error)}`);
  }
}
