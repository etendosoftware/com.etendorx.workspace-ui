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

import { fetchAlertCount } from "../fetchAlertCount";
import { ALERT_ACTION_HANDLER } from "../constants";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { kernelClient: { post: jest.fn() } },
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn() },
}));

const mockPost = Metadata.kernelClient.post as jest.Mock;

const mockKernelResponse = (ok: boolean, data: unknown) => mockPost.mockResolvedValueOnce({ ok, data });

const getRequestParams = () => new URLSearchParams(String(mockPost.mock.calls[0][0]).slice(1));

describe("fetchAlertCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the classic AlertActionHandler flagged to not extend the session", async () => {
    mockKernelResponse(true, { cnt: 1, result: "success" });

    await fetchAlertCount();

    const params = getRequestParams();
    expect(params.get("_action")).toBe(ALERT_ACTION_HANDLER);
    expect(params.get("IsAjaxCall")).toBe("1");
    expect(params.get("ignoreForSessionTimeout")).toBe("1");
    expect(mockPost.mock.calls[0][1]).toEqual({});
  });

  it("returns the count of a successful response", async () => {
    mockKernelResponse(true, { cnt: 3, result: "success" });

    await expect(fetchAlertCount()).resolves.toBe(3);
  });

  it.each([
    ["the response is not ok", false, { cnt: 3 }],
    ["the count is not a number", true, { cnt: "3" }],
    ["the response has no body", true, undefined],
  ])("returns null when %s", async (_case, ok, data) => {
    mockKernelResponse(ok, data);

    await expect(fetchAlertCount()).resolves.toBeNull();
  });

  it("returns null and logs a warning when the request throws", async () => {
    mockPost.mockRejectedValueOnce(new Error("network"));

    await expect(fetchAlertCount()).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });
});
