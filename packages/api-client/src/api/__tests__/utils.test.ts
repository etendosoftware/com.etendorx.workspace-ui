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

import { getDecodedJsonResponse, joinUrl } from "../utils";

describe("api/utils", () => {
  describe("joinUrl", () => {
    it("should join base URL with path correctly", () => {
      expect(joinUrl("https://example.com", "/api/data")).toBe("https://example.com/api/data");
    });

    it("should handle base URL with trailing slash", () => {
      expect(joinUrl("https://example.com/", "/api/data")).toBe("https://example.com/api/data");
    });

    it("should handle path without leading slash", () => {
      expect(joinUrl("https://example.com", "api/data")).toBe("https://example.com/api/data");
    });

    it("should handle both base with trailing slash and path without leading slash", () => {
      expect(joinUrl("https://example.com/", "api/data")).toBe("https://example.com/api/data");
    });

    it("should return path when base URL is undefined", () => {
      expect(joinUrl(undefined, "/api/data")).toBe("/api/data");
    });

    it("should return path when base URL is empty string", () => {
      expect(joinUrl("", "/api/data")).toBe("/api/data");
    });
  });

  describe("getDecodedJsonResponse", () => {
    const createMockResponse = (body: string, contentType: string): Response => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(body);

      return {
        arrayBuffer: async () => buffer.buffer,
        headers: {
          get: (name: string) => (name === "content-type" ? contentType : null),
        },
      } as Response;
    };

    it("should decode JSON response with UTF-8 charset", async () => {
      const mockResponse = createMockResponse('{"success": true}', "application/json; charset=utf-8");
      const result = await getDecodedJsonResponse(mockResponse);
      expect(result).toEqual({ success: true });
    });

    it("should decode JSON response without explicit charset", async () => {
      const mockResponse = createMockResponse('{"success": true}', "application/json");
      const result = await getDecodedJsonResponse(mockResponse);
      expect(result).toEqual({ success: true });
    });

    it("should use default charset for non-JSON content type", async () => {
      const mockResponse = createMockResponse('{"success": true}', "text/html");
      const result = await getDecodedJsonResponse(mockResponse);
      expect(result).toEqual({ success: true });
    });

    it("should extract charset from content-type header", async () => {
      const mockResponse = createMockResponse('{"success": true}', "application/json; charset=iso-8859-1");
      const result = await getDecodedJsonResponse(mockResponse);
      expect(result).toEqual({ success: true });
    });

    it("should handle content-type with multiple parameters", async () => {
      const mockResponse = createMockResponse(
        '{"data": "test"}',
        "application/json; charset=utf-8; boundary=something"
      );
      const result = await getDecodedJsonResponse(mockResponse);
      expect(result).toEqual({ data: "test" });
    });

    it("should fallback to utf-8 if decoding with specified charset fails", async () => {
      const mockResponse = createMockResponse('{"success": true}', "application/json; charset=invalid-charset");

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await getDecodedJsonResponse(mockResponse);
      expect(result).toEqual({ success: true });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to decode with charset invalid-charset")
      );

      consoleWarnSpy.mockRestore();
    });

    it("should throw error if both primary and fallback decoding fail", async () => {
      const mockResponse = createMockResponse("invalid json", "application/json; charset=utf-8");

      await expect(getDecodedJsonResponse(mockResponse)).rejects.toThrow();
    });
  });
});
