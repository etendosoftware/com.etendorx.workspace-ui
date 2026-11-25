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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { getPreferences, PREFERENCES_PATH, savePreference } from "../getPreferences";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
    },
  },
}));

const PROPERTY = "OBUIAPP_ShowImplicitFilterMsg";
const WINDOW_ID = "143";

const mockResponse = (response: { ok: boolean; status?: number; data?: unknown }) =>
  (Metadata.client.request as jest.Mock).mockResolvedValue(response);

describe("api/getPreferences", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the preference map of the session", async () => {
    mockResponse({ ok: true, data: { preferences: { ShowAcct: "Y" } } });

    await expect(getPreferences()).resolves.toEqual({ ShowAcct: "Y" });
    expect(Metadata.client.request).toHaveBeenCalledWith(PREFERENCES_PATH);
  });

  it("throws when the preferences cannot be read", async () => {
    mockResponse({ ok: false, status: 500 });

    await expect(getPreferences()).rejects.toThrow("Failed to fetch preferences: HTTP 500");
  });

  it("stores a preference for a window with a POST request", async () => {
    mockResponse({ ok: true, data: {} });

    await savePreference(PROPERTY, "N", WINDOW_ID);

    expect(Metadata.client.request).toHaveBeenCalledWith(PREFERENCES_PATH, {
      method: "POST",
      body: JSON.stringify({ property: PROPERTY, value: "N", windowId: WINDOW_ID }),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("throws when the preference is not stored", async () => {
    mockResponse({ ok: false, status: 422 });

    await expect(savePreference(PROPERTY, "N")).rejects.toThrow(`Failed to save preference ${PROPERTY}: HTTP 422`);
  });
});
