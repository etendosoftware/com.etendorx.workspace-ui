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

import {
  fetchProcessMonitorDetail,
  fetchProcessMonitorList,
  PROCESS_MONITOR_PATH,
  ProcessMonitorError,
} from "../processMonitor";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
    },
  },
}));

const request = Metadata.client.request as jest.Mock;
const mockResponse = (response: { ok: boolean; status?: number; data?: unknown }) =>
  request.mockResolvedValue(response);

describe("api/processMonitor", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists executions with a GET request and no filters by default", async () => {
    const data = { executions: [], cursor: null, hasMore: false, serverTime: 1, runningCount: 0 };
    mockResponse({ ok: true, data });

    await expect(fetchProcessMonitorList()).resolves.toEqual(data);

    const [path, options] = request.mock.calls[0];
    expect(path.startsWith(`${PROCESS_MONITOR_PATH}?`)).toBe(true);
    expect(options).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    expect(path).toContain("ignoreForSessionTimeout=1");
    expect(path).not.toContain("since=");
  });

  it("serializes every filter", async () => {
    mockResponse({ ok: true, data: {} });

    await fetchProcessMonitorList({
      status: ["RUNNING", "FAILED"],
      since: 1792000003000,
      limit: 20,
      background: false,
      processId: "PID",
    });

    const query = new URLSearchParams(request.mock.calls[0][0].split("?")[1]);
    expect(query.get("status")).toBe("RUNNING,FAILED");
    expect(query.get("since")).toBe("1792000003000");
    expect(query.get("limit")).toBe("20");
    expect(query.get("background")).toBe("false");
    expect(query.get("processId")).toBe("PID");
  });

  it("sends since=0 instead of dropping it", async () => {
    mockResponse({ ok: true, data: {} });

    await fetchProcessMonitorList({ since: 0 });

    expect(new URLSearchParams(request.mock.calls[0][0].split("?")[1]).get("since")).toBe("0");
  });

  it("throws a ProcessMonitorError carrying the status and the backend message", async () => {
    mockResponse({ ok: false, status: 403, data: { error: "No access", cid: "x" } });

    await expect(fetchProcessMonitorList()).rejects.toMatchObject({
      name: "ProcessMonitorError",
      status: 403,
      message: "No access",
    });
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    mockResponse({ ok: false, status: 500, data: "<html>" });

    const error = await fetchProcessMonitorList().catch((e) => e);

    expect(error).toBeInstanceOf(ProcessMonitorError);
    expect(error.message).toBe("Process monitor request failed: 500");
  });

  it("fetches the detail of an execution with an encoded id", async () => {
    const data = { id: "a/b", log: "boom" };
    mockResponse({ ok: true, data });

    await expect(fetchProcessMonitorDetail("a/b")).resolves.toEqual(data);
    expect(request.mock.calls[0][0]).toBe(`${PROCESS_MONITOR_PATH}/a%2Fb`);
  });

  it("throws when the detail does not exist", async () => {
    mockResponse({ ok: false, status: 404, data: { error: "Run not found" } });

    await expect(fetchProcessMonitorDetail("zzz")).rejects.toMatchObject({ status: 404 });
  });
});
