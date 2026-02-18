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

import {
  fetchAttachments,
  createAttachment,
  editAttachment,
  deleteAttachment,
  downloadAttachment,
  downloadAllAttachments,
  deleteAllAttachments,
} from "../attachments";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
      post: jest.fn(),
    },
  },
}));

describe("api/attachments", () => {
  const tabId = "T1";
  const recordId = "R1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchAttachments", () => {
    it("successfully fetches and cleans descriptions", async () => {
      const mockAttachments = [
        { id: "att1", description: "Regular description" },
        { id: "att2", description: "Description: Prefixed description" },
      ];
      (Metadata.client.request as jest.Mock).mockResolvedValue({
        ok: true,
        data: { attachments: mockAttachments },
      });

      const result = await fetchAttachments({ tabId, recordId });

      expect(Metadata.client.request).toHaveBeenCalledWith(expect.stringContaining("command=LIST"), { method: "GET" });
      expect(result).toEqual([
        { id: "att1", description: "Regular description" },
        { id: "att2", description: "Prefixed description" },
      ]);
    });

    it("throws error when fetching fails", async () => {
      (Metadata.client.request as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchAttachments({ tabId, recordId })).rejects.toThrow("Failed to fetch attachments: 404");
    });
  });

  describe("createAttachment", () => {
    it("successfully uploads a file and returns the new attachment", async () => {
      const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
      const mockAttachmentsList = [{ id: "new-att", name: "test.txt" }];

      (Metadata.client.post as jest.Mock).mockResolvedValue({ ok: true });
      // Mock fetchAttachments call inside createAttachment
      (Metadata.client.request as jest.Mock).mockResolvedValue({
        ok: true,
        data: { attachments: mockAttachmentsList },
      });

      const result = await createAttachment({
        tabId,
        recordId,
        file: mockFile,
        inpDocumentOrg: "ORG1",
        description: "My Doc",
      });

      expect(Metadata.client.post).toHaveBeenCalledWith(expect.stringContaining("command=UPLOAD"), expect.any(Object));
      expect(result).toEqual(mockAttachmentsList[0]);
    });

    it("throws error when creation fails", async () => {
      (Metadata.client.post as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        data: { error: "Size limit exceeded" },
      });

      await expect(createAttachment({ tabId, recordId, file: {} as any, inpDocumentOrg: "O" })).rejects.toThrow(
        "Size limit exceeded"
      );
    });
  });

  describe("editAttachment", () => {
    it("successfully edits description", async () => {
      (Metadata.client.post as jest.Mock).mockResolvedValue({ ok: true });

      await editAttachment({ tabId, recordId, attachmentId: "att-id", description: "New Desc" });

      expect(Metadata.client.post).toHaveBeenCalledWith(expect.stringContaining("command=EDIT"), {});
      expect(Metadata.client.post).toHaveBeenCalledWith(expect.stringContaining("description=New%20Desc"), {});
    });
  });

  describe("deleteAttachment", () => {
    it("successfully deletes attachment", async () => {
      (Metadata.client.post as jest.Mock).mockResolvedValue({ ok: true });

      await deleteAttachment({ tabId, recordId, attachmentId: "att-id" });

      expect(Metadata.client.post).toHaveBeenCalledWith(expect.stringContaining("command=DELETE"), {});
    });
  });

  describe("download functionalities", () => {
    it("downloadAttachment returns a blob", async () => {
      const mockBlob = new Blob(["data"], { type: "application/pdf" });
      (Metadata.client.request as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockBlob,
      });

      const result = await downloadAttachment({ tabId, recordId, attachmentId: "att-id" });
      expect(result).toBe(mockBlob);
    });

    it("downloadAllAttachments returns a blob", async () => {
      const mockBlob = new Blob(["zip-data"], { type: "application/zip" });
      (Metadata.client.request as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockBlob,
      });

      const result = await downloadAllAttachments({ tabId, recordId });
      expect(result).toBe(mockBlob);
    });
  });

  describe("deleteAllAttachments", () => {
    it("successfully deletes all attachments", async () => {
      (Metadata.client.post as jest.Mock).mockResolvedValue({ ok: true });

      await deleteAllAttachments({ tabId, recordId });

      expect(Metadata.client.post).toHaveBeenCalledWith(expect.stringContaining("command=DELETE_ALL"), {});
    });
  });
});
