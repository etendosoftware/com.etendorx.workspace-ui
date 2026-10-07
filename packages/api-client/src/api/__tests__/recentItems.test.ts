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

import { fetchRecentItems, RECENT_ITEMS_PATH, saveRecentItems } from "../recentItems";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
    },
  },
}));

const RESPONSE_DATA = { items: [{ id: "menu-1" }], size: 3 };

const mockResponse = (response: { ok: boolean; status?: number; data?: unknown }) =>
  (Metadata.client.request as jest.Mock).mockResolvedValue(response);

describe("api/recentItems", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches the recent items with a GET request", async () => {
    mockResponse({ ok: true, data: RESPONSE_DATA });

    await expect(fetchRecentItems()).resolves.toEqual(RESPONSE_DATA);
    expect(Metadata.client.request).toHaveBeenCalledWith(RECENT_ITEMS_PATH, { method: "GET" });
  });

  it("throws when fetching fails", async () => {
    mockResponse({ ok: false, status: 500 });

    await expect(fetchRecentItems()).rejects.toThrow("Failed to fetch recent items: 500");
  });

  it("saves the whole list with a POST request", async () => {
    mockResponse({ ok: true, data: RESPONSE_DATA });

    await expect(saveRecentItems(RESPONSE_DATA.items)).resolves.toEqual(RESPONSE_DATA);
    expect(Metadata.client.request).toHaveBeenCalledWith(RECENT_ITEMS_PATH, {
      method: "POST",
      body: JSON.stringify({ items: RESPONSE_DATA.items }),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("throws when saving fails", async () => {
    mockResponse({ ok: false, status: 400 });

    await expect(saveRecentItems([])).rejects.toThrow("Failed to save recent items: 400");
  });
});
