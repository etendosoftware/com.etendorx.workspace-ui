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

import { login, logout } from "../authentication";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    loginClient: {
      request: jest.fn(),
    },
  },
}));

describe("api/authentication", () => {
  describe("login", () => {
    it("successfully logs in and returns data when token exists", async () => {
      const mockResponse = {
        ok: true,
        data: { token: "fake-token", user: "test-user" },
      };
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue(mockResponse);

      const result = await login("user", "pass");

      expect(Metadata.loginClient.request).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "user", password: "pass" }),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("throws error when response is not ok", async () => {
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        data: { message: "Unauthorized" },
      });

      await expect(login("user", "pass")).rejects.toThrow("Unauthorized");
    });

    it("throws error when status code is returned instead of message", async () => {
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        data: {},
      });

      await expect(login("user", "pass")).rejects.toThrow("HTTP error! status: 500");
    });

    it("throws error when no token is present in data", async () => {
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
        ok: true,
        data: { user: "test-user" },
      });

      await expect(login("user", "pass")).rejects.toThrow("Invalid");
    });
  });

  describe("logout", () => {
    it("successfully logs out", async () => {
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({ ok: true });

      await logout();

      expect(Metadata.loginClient.request).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("throws error when logout response is not ok", async () => {
      (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(logout()).rejects.toThrow("HTTP error! status: 500");
    });
  });
});
