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

import { fetchServerLabel, GET_LABEL_ACTION } from "../serverLabel";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    kernelClient: {
      request: jest.fn(),
    },
  },
}));

const KEY = "OBUIAPP_ClearFilters";

const mockResponse = (response: { ok: boolean; status?: number; data?: unknown }) =>
  (Metadata.kernelClient.request as jest.Mock).mockResolvedValue(response);

describe("api/serverLabel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("asks the classic label handler for the message", async () => {
    mockResponse({ ok: true, data: { label: "Click the funnel icon" } });

    await expect(fetchServerLabel(KEY)).resolves.toBe("Click the funnel icon");
    expect(Metadata.kernelClient.request).toHaveBeenCalledWith(`?_action=${GET_LABEL_ACTION}&key=${KEY}`, {
      method: "GET",
    });
  });

  it("answers undefined for an unknown message", async () => {
    mockResponse({ ok: true, data: {} });

    await expect(fetchServerLabel(KEY)).resolves.toBeUndefined();
  });

  it("throws when the request fails", async () => {
    mockResponse({ ok: false, status: 500 });

    await expect(fetchServerLabel(KEY)).rejects.toThrow(`Failed to fetch label ${KEY}: HTTP 500`);
  });
});
