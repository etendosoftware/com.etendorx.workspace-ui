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

import { fetchNotes, createNote, deleteNote } from "../notes";
import { Metadata } from "../metadata";

describe("Notes API", () => {
  const mockNote = {
    id: "1",
    note: "Test note",
    user: "user",
    creationDate: "2023-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchNotes", () => {
    it("should fetch notes successfully", async () => {
      const mockResponse = {
        ok: true,
        data: [mockNote],
      };
      const spyRequest = jest.spyOn(Metadata.client, "request").mockResolvedValue(mockResponse as any);

      const result = await fetchNotes({ tableId: "100", recordId: "200" });

      expect(spyRequest).toHaveBeenCalledWith(expect.stringContaining("table=100&record=200"), { method: "GET" });
      expect(result).toEqual([mockNote]);
    });

    it("should throw error when request fails", async () => {
      jest.spyOn(Metadata.client, "request").mockResolvedValue({ ok: false, status: 500 } as any);

      await expect(fetchNotes({ tableId: "100", recordId: "200" })).rejects.toThrow("Failed to fetch notes: 500");
    });

    it("should return an empty list when the servlet sends no data", async () => {
      jest.spyOn(Metadata.client, "request").mockResolvedValue({ ok: true } as any);

      await expect(fetchNotes({ tableId: "100", recordId: "200" })).resolves.toEqual([]);
    });

    it("should encode the table and record ids", async () => {
      const spyRequest = jest.spyOn(Metadata.client, "request").mockResolvedValue({ ok: true, data: [] } as any);

      await fetchNotes({ tableId: "table/1", recordId: "record 2" });

      expect(spyRequest).toHaveBeenCalledWith("/notes?table=table%2F1&record=record%202", { method: "GET" });
    });
  });

  describe("createNote", () => {
    it("should create a note successfully", async () => {
      const mockResponse = {
        ok: true,
        data: mockNote,
      };
      const spyPost = jest.spyOn(Metadata.client, "post").mockResolvedValue(mockResponse as any);

      const params = { tableId: "100", recordId: "200", content: "New note" };
      const result = await createNote(params);

      expect(spyPost).toHaveBeenCalledWith(
        "/notes",
        {
          table: "100",
          record: "200",
          note: "New note",
        },
        expect.any(Object)
      );
      expect(result).toEqual(mockNote);
    });

    it("should propagate the error reported by the servlet", async () => {
      jest.spyOn(Metadata.client, "post").mockResolvedValue({
        ok: false,
        status: 403,
        data: { error: "Insufficient permissions to access record: 200" },
      } as any);

      await expect(createNote({ tableId: "100", recordId: "200", content: "New note" })).rejects.toThrow(
        "Insufficient permissions to access record: 200"
      );
    });

    it("should fall back to the status code when the servlet sends no error", async () => {
      jest.spyOn(Metadata.client, "post").mockResolvedValue({ ok: false, status: 400 } as any);

      await expect(createNote({ tableId: "100", recordId: "200", content: "New note" })).rejects.toThrow(
        "Failed to create note: 400"
      );
    });
  });

  describe("deleteNote", () => {
    it("should delete a note successfully", async () => {
      const mockResponse = { ok: true };
      const spyRequest = jest.spyOn(Metadata.client, "request").mockResolvedValue(mockResponse as any);

      await deleteNote("note-id");

      expect(spyRequest).toHaveBeenCalledWith("/notes/note-id", { method: "DELETE" });
    });

    it("should throw error if deletion fails", async () => {
      jest.spyOn(Metadata.client, "request").mockResolvedValue({
        ok: false,
        status: 404,
        data: { error: "Note not found" },
      } as any);

      await expect(deleteNote("invalid-id")).rejects.toThrow("Note not found");
    });
  });
});
