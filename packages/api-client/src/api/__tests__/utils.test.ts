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
    it.each([
      ["https://example.com", "/api/data", "https://example.com/api/data"],
      ["https://example.com/", "/api/data", "https://example.com/api/data"],
      ["https://example.com", "api/data", "https://example.com/api/data"],
      ["https://example.com/", "api/data", "https://example.com/api/data"],
      [undefined, "/api/data", "/api/data"],
      ["", "/api/data", "/api/data"],
    ])("joins URLs: %s + %s = %s", (base, path, expected) => {
      expect(joinUrl(base, path)).toBe(expected);
    });
  });

  describe("getDecodedJsonResponse", () => {
    const mockResponse = (body: string, contentType: string): Response => ({
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
      headers: { get: (name: string) => (name === "content-type" ? contentType : null) },
    } as Response);

    it.each([
      ["application/json; charset=utf-8", '{"success": true}', { success: true }],
      ["application/json", '{"success": true}', { success: true }],
      ["text/html", '{"success": true}', { success: true }],
      ["application/json; charset=iso-8859-1", '{"success": true}', { success: true }],
      ["application/json; charset=utf-8; boundary=something", '{"data": "test"}', { data: "test" }],
    ])("decodes JSON with content-type %s", async (contentType, body, expected) => {
      expect(await getDecodedJsonResponse(mockResponse(body, contentType))).toEqual(expected);
    });

    it("falls back to utf-8 on invalid charset", async () => {
      const spy = jest.spyOn(console, "warn").mockImplementation();
      const result = await getDecodedJsonResponse(mockResponse('{"success": true}', "charset=invalid-charset"));

      expect(result).toEqual({ success: true });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Failed to decode"));
      spy.mockRestore();
    });

    it("throws on invalid JSON", async () => {
      await expect(getDecodedJsonResponse(mockResponse("invalid", "application/json"))).rejects.toThrow();
    });
  });
});
