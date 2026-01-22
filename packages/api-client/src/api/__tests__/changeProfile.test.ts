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

import { changeProfile } from "../changeProfile";
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

  it("throws error when no token is present in response data", async () => {
    (Metadata.loginClient.request as jest.Mock).mockResolvedValue({
      ok: true,
      data: { user: "no-token-user" },
    });

    await expect(changeProfile({ role: "fake" })).rejects.toThrow("Invalid server response");
  });

  it("logs error to console when request fails", async () => {
    const error = new Error("Network failure");
    (Metadata.loginClient.request as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(changeProfile({ role: "fake" })).rejects.toThrow("Network failure");
    expect(consoleSpy).toHaveBeenCalledWith("Profile change error:", error);

    consoleSpy.mockRestore();
  });
});
