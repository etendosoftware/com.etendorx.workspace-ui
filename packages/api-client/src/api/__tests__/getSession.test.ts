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

import { getSession } from "../getSession";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
    },
  },
}));

describe("api/getSession", () => {
  it("successfully retrieves session data", async () => {
    const mockSession = { user: "test", role: "admin" };
    (Metadata.client.request as jest.Mock).mockResolvedValue({
      ok: true,
      data: mockSession,
    });

    const result = await getSession();

    expect(Metadata.client.request).toHaveBeenCalledWith("meta/session");
    expect(result).toEqual(mockSession);
  });

  it("throws error when response is not ok", async () => {
    (Metadata.client.request as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(getSession()).rejects.toThrow("HTTP error! status: 401");
  });
});
