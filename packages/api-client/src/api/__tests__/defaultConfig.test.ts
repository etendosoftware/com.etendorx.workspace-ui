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

import { setDefaultConfiguration } from "../defaultConfig";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    kernelClient: {
      post: jest.fn(),
    },
  },
}));

describe("api/defaultConfig", () => {
  it("successfully sets default configuration with provided values", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: true,
      data: { success: true },
    });

    const config = {
      language: "en_US",
      defaultRole: "role-1",
      client: "client-1",
      organization: "org-1",
      defaultWarehouse: "wh-1",
    };

    await setDefaultConfiguration(config);

    expect(Metadata.kernelClient.post).toHaveBeenCalledWith(expect.stringContaining("UserInfoWidgetActionHandler"), {
      language: "en_US",
      role: "role-1",
      client: "client-1",
      organization: "org-1",
      warehouse: "wh-1",
      default: "true",
    });
  });

  it("uses default values when config properties are missing", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: true,
      data: {},
    });

    await setDefaultConfiguration({});

    expect(Metadata.kernelClient.post).toHaveBeenCalledWith(expect.any(String), {
      language: "192",
      role: "0",
      client: "0",
      organization: "0",
      warehouse: "0",
      default: "true",
    });
  });

  it("throws error when response is not ok", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(setDefaultConfiguration({})).rejects.toThrow("HTTP error! status: 500");
  });

  it("throws error when response data contains 'throw' string", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: true,
      data: "/* throw error */",
    });

    await expect(setDefaultConfiguration({})).rejects.toThrow("Server returned an error in JavaScript");
  });

  it("logs error and rethrows when post fails", async () => {
    const error = new Error("Request failed");
    (Metadata.kernelClient.post as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(setDefaultConfiguration({})).rejects.toThrow("Request failed");
    expect(consoleSpy).toHaveBeenCalledWith("Error setting default configuration:", error);

    consoleSpy.mockRestore();
  });
});
