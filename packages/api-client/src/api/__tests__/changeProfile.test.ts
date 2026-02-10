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

import handler, { changeProfile } from "../changeProfile";
import { Metadata } from "../metadata";
import { API_LOGIN_URL } from "../constants";

jest.mock("../metadata", () => ({
  Metadata: {
    loginClient: {
      request: jest.fn(),
    },
  },
}));

describe("api/changeProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("changeProfile function", () => {
    it("successfully changes profile with role and warehouse", async () => {
      const mockResponse = {
        ok: true,
        data: { token: "new-token", user: "test-user" },
      };
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue(mockResponse);

      const params = { role: "admin-role", warehouse: "main-wh" };
      const result = await changeProfile(params);

      expect(Metadata.loginClient.request).toHaveBeenCalledWith(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("throws error when response is not ok", async () => {
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(changeProfile({ role: "fake" })).rejects.toThrow("HTTP error! Status: 403");
    });
  });

  describe("API handler", () => {
    it("returns 405 if method is not POST", async () => {
      const req = { method: "GET" };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("Not Allowed") })
      );
    });

    it("returns 401 if no authorization token is provided", async () => {
      const req = { method: "POST", headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("Unauthorized") })
      );
    });

    it("returns 200 and data on success", async () => {
      const mockData = { token: "abc", user: "user" };
      const req = {
        method: "POST",
        headers: { authorization: "Bearer token123" },
        body: { role: "admin" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock changeProfile indirectly by mocking Metadata response
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockData,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });
});
