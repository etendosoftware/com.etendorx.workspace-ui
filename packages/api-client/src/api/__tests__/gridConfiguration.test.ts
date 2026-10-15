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

import { fetchGridConfiguration, GRID_CONFIGURATION_PATH, saveGridConfiguration } from "../gridConfiguration";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
    },
  },
}));

const WINDOW_ID = "window-1";
const TAB_ID = "tab-1";
const TAB_CONFIGURATION = { version: 1, sizing: { name: 120 } };
const RESPONSE_DATA = { windowId: WINDOW_ID, configuration: { [TAB_ID]: TAB_CONFIGURATION } };

const mockResponse = (response: { ok: boolean; status?: number; data?: unknown }) =>
  (Metadata.client.request as jest.Mock).mockResolvedValue(response);

const expectPut = (configuration: unknown) =>
  expect(Metadata.client.request).toHaveBeenCalledWith(GRID_CONFIGURATION_PATH, {
    method: "PUT",
    body: JSON.stringify({ windowId: WINDOW_ID, tabId: TAB_ID, configuration }),
    headers: { "Content-Type": "application/json" },
  });

describe("api/gridConfiguration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches the configuration of a window with a GET request", async () => {
    mockResponse({ ok: true, data: RESPONSE_DATA });

    await expect(fetchGridConfiguration(WINDOW_ID)).resolves.toEqual(RESPONSE_DATA);
    expect(Metadata.client.request).toHaveBeenCalledWith(`${GRID_CONFIGURATION_PATH}?windowId=${WINDOW_ID}`, {
      method: "GET",
    });
  });

  it("throws when fetching fails", async () => {
    mockResponse({ ok: false, status: 404 });

    await expect(fetchGridConfiguration(WINDOW_ID)).rejects.toThrow("Failed to fetch grid configuration: 404");
  });

  it("stores the configuration of a tab with a PUT request", async () => {
    mockResponse({ ok: true, data: RESPONSE_DATA });

    await expect(saveGridConfiguration(WINDOW_ID, TAB_ID, TAB_CONFIGURATION)).resolves.toEqual(RESPONSE_DATA);
    expectPut(TAB_CONFIGURATION);
  });

  it("sends a null configuration to remove the tab", async () => {
    mockResponse({ ok: true, data: { windowId: WINDOW_ID, configuration: {} } });

    await saveGridConfiguration(WINDOW_ID, TAB_ID, null);
    expectPut(null);
  });

  it("throws when saving fails", async () => {
    mockResponse({ ok: false, status: 422 });

    await expect(saveGridConfiguration(WINDOW_ID, TAB_ID, null)).rejects.toThrow(
      "Failed to save grid configuration: 422"
    );
  });
});
