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

import { CopilotClient } from "../copilot/client";

describe("CopilotClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CopilotClient.setBaseUrl();
  });

  describe("setBaseUrl", () => {
    it("should set the base URL correctly", () => {
      CopilotClient.setBaseUrl();
      expect(CopilotClient.getCurrentBaseUrl()).toContain("/api/erp");
    });
  });

  describe("request handling", () => {
    it("should throw CopilotUnauthorizedError on 401", async () => {
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({
        ok: false,
        status: 401,
      } as any);

      await expect(CopilotClient.getLabels()).rejects.toThrow("Copilot: Unauthorized access to Copilot service");
    });

    it("should throw CopilotNotInstalledError on 404", async () => {
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      await expect(CopilotClient.getAssistants()).rejects.toThrow("Copilot: Copilot service not installed");
    });
  });

  describe("buildSSEUrl", () => {
    it("should build a valid SSE URL with query parameters", () => {
      const params = {
        question: "Hello",
        app_id: "test-app",
      };
      const url = CopilotClient.buildSSEUrl(params);
      expect(url).toContain("question=Hello");
      expect(url).toContain("app_id=test-app");
    });
  });

  describe("shouldCacheQuestion", () => {
    it("should return true for very long questions", () => {
      const longQuestion = "a".repeat(8000);
      expect(CopilotClient.shouldCacheQuestion(longQuestion)).toBe(true);
    });

    it("should return false for short questions", () => {
      expect(CopilotClient.shouldCacheQuestion("Hello")).toBe(false);
    });
  });

  describe("parseArrayResponse", () => {
    it("should parse JSON string array", () => {
      const result = (CopilotClient as any).parseArrayResponse('[{"id": 1}]', "test");
      expect(result).toEqual([{ id: 1 }]);
    });

    it("should return same array if input is already an array", () => {
      const input = [{ id: 1 }];
      const result = (CopilotClient as any).parseArrayResponse(input, "test");
      expect(result).toBe(input);
    });

    it("should return empty array on invalid JSON", () => {
      const result = (CopilotClient as any).parseArrayResponse("invalid", "test");
      expect(result).toEqual([]);
    });

    it("should return empty array if parsed JSON is not an array", () => {
      const result = (CopilotClient as any).parseArrayResponse('{"not": "an array"}', "test");
      expect(result).toEqual([]);
    });
  });

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
      const mockResponse = { ok: true, data: { id: "file-1" } };
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue(mockResponse as any);

      const result = await CopilotClient.uploadFile(mockFile);
      expect(result).toEqual({ id: "file-1" });
    });

    it("should throw error if upload fails", async () => {
      const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({ ok: false } as any);

      await expect(CopilotClient.uploadFile(mockFile)).rejects.toThrow("Failed to upload file");
    });
  });

  describe("getConversations", () => {
    it("should fetch conversations for an appId", async () => {
      const mockConversations = [{ id: "conv-1", title: "Test" }];
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({
        ok: true,
        data: mockConversations,
      } as any);

      const result = await CopilotClient.getConversations("app-123");
      expect(result).toEqual(mockConversations);
    });
  });

  describe("handleLargeQuestion", () => {
    it("should cache question if it exceeds threshold", async () => {
      const longQuestion = "a".repeat(8000);
      const params = { question: longQuestion, app_id: "test" };

      const spyCache = jest.spyOn(CopilotClient, "cacheQuestion").mockResolvedValue({});

      const result = await CopilotClient.handleLargeQuestion(params);

      expect(spyCache).toHaveBeenCalledWith(longQuestion);
      expect(result.question).toBeUndefined();
    });

    it("should not cache if below threshold", async () => {
      const params = { question: "short", app_id: "test" };
      const spyCache = jest.spyOn(CopilotClient, "cacheQuestion");

      const result = await CopilotClient.handleLargeQuestion(params);

      expect(spyCache).not.toHaveBeenCalled();
      expect(result.question).toBe("short");
    });
  });

  describe("getConversationMessages", () => {
    it("should fetch messages and format them", async () => {
      const mockBackendMessages = [{ id: "m1", role: "user", content: "hello", timestamp: "2023" }];
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({
        ok: true,
        data: mockBackendMessages,
      } as any);

      const result = await CopilotClient.getConversationMessages("conv-1");
      expect(result.id).toBe("conv-1");
      expect(result.messages[0].text).toBe("hello");
      expect(result.messages[0].sender).toBe("user");
    });
  });

  describe("generateTitle", () => {
    it("should generate title successfully", async () => {
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({
        ok: true,
        data: { title: "New Title" },
      } as any);

      const title = await CopilotClient.generateTitle("conv-1");
      expect(title).toBe("New Title");
    });

    it("should return default title on error", async () => {
      jest.spyOn(CopilotClient.client, "request").mockResolvedValue({ ok: false } as any);
      const title = await CopilotClient.generateTitle("conv-1");
      expect(title).toBe("Untitled Conversation");
    });
  });
});
