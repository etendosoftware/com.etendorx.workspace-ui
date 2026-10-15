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

import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import {
  fetchProcessMonitorList,
  ProcessMonitorError,
  type ProcessExecution,
  type ProcessMonitorListResponse,
} from "@workspaceui/api-client/src/api/processMonitor";
import { getNextDelay, useProcessMonitorPolling } from "../useProcessMonitorPolling";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import {
  CURSOR_SAFETY_MARGIN_MS,
  INITIAL_LIMIT,
  POLL_INTERVAL_MS,
  POLL_MAX_BACKOFF_MS,
} from "@/utils/processMonitor/constants";

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));
jest.mock("@workspaceui/api-client/src/api/processMonitor", () => {
  const actual = jest.requireActual("@workspaceui/api-client/src/api/processMonitor");
  return { ...actual, fetchProcessMonitorList: jest.fn() };
});

const fetchList = fetchProcessMonitorList as jest.Mock;

const build = (id: string, status: ProcessExecution["status"], updatedMs: number): ProcessExecution => ({
  id,
  processRequestId: null,
  processId: null,
  processName: `Process ${id}`,
  background: true,
  status,
  statusCode: "X",
  finished: status !== "RUNNING",
  startTime: null,
  endTime: null,
  durationMs: null,
  duration: null,
  updated: "",
  updatedMs,
});

const page = (
  executions: ProcessExecution[],
  cursor: number,
  extra: Partial<ProcessMonitorListResponse> = {}
): ProcessMonitorListResponse => ({
  executions,
  cursor,
  hasMore: false,
  serverTime: cursor + 10,
  runningCount: 0,
  ...extra,
});

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const advance = async (ms: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("getNextDelay", () => {
  it("backs off exponentially up to the cap", () => {
    expect(getNextDelay(0)).toBe(POLL_INTERVAL_MS);
    expect(getNextDelay(1)).toBe(POLL_INTERVAL_MS * 2);
    expect(getNextDelay(10)).toBe(POLL_MAX_BACKOFF_MS);
  });
});

describe("useProcessMonitorPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setHidden(false);
    useProcessMonitorStore.getState().reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does nothing while disabled", async () => {
    renderHook(() => useProcessMonitorPolling(false, "r1"));
    await advance(POLL_INTERVAL_MS * 2);

    expect(fetchList).not.toHaveBeenCalled();
  });

  it("loads the initial page without a cursor and does not notify finished runs", async () => {
    fetchList.mockResolvedValue(page([build("a", "FAILED", 100)], 100));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();

    expect(fetchList).toHaveBeenCalledWith({ limit: INITIAL_LIMIT });
    expect(useProcessMonitorStore.getState().loaded).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("sends since = cursor - safety margin and notifies a RUNNING -> FAILED transition", async () => {
    fetchList
      .mockResolvedValueOnce(page([build("a", "RUNNING", 10_000)], 10_000))
      .mockResolvedValueOnce(page([build("a", "FAILED", 12_000)], 12_000));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();
    await advance(POLL_INTERVAL_MS);

    expect(fetchList.mock.calls[1][0]).toMatchObject({ since: 10_000 - CURSOR_SAFETY_MARGIN_MS });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "processMonitor.toast.failed",
      expect.objectContaining({ id: expect.any(String) })
    );
  });

  it("does not toast completed runs", async () => {
    fetchList
      .mockResolvedValueOnce(page([build("a", "RUNNING", 10_000)], 10_000))
      .mockResolvedValueOnce(page([build("a", "COMPLETED", 12_000)], 12_000));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();
    await advance(POLL_INTERVAL_MS);

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("drains hasMore pages immediately", async () => {
    fetchList
      .mockResolvedValueOnce(page([], 100))
      .mockResolvedValueOnce(page([build("a", "RUNNING", 200)], 200, { hasMore: true }))
      .mockResolvedValueOnce(page([build("b", "RUNNING", 300)], 300));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();
    await advance(POLL_INTERVAL_MS);

    expect(fetchList).toHaveBeenCalledTimes(3);
    expect(Object.keys(useProcessMonitorStore.getState().executions)).toEqual(["a", "b"]);
  });

  it("never overlaps requests", async () => {
    let resolveFirst: (value: ProcessMonitorListResponse) => void = () => {};
    fetchList.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    fetchList.mockResolvedValue(page([], 100));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await advance(POLL_INTERVAL_MS * 3);
    expect(fetchList).toHaveBeenCalledTimes(1);

    resolveFirst(page([], 100));
    await flush();
    await advance(POLL_INTERVAL_MS);
    expect(fetchList).toHaveBeenCalledTimes(2);
  });

  it("pauses while the document is hidden and resumes when visible", async () => {
    fetchList.mockResolvedValue(page([], 100));
    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();

    setHidden(true);
    await advance(POLL_INTERVAL_MS * 3);
    expect(fetchList).toHaveBeenCalledTimes(1);

    setHidden(false);
    await flush();
    expect(fetchList).toHaveBeenCalledTimes(2);
  });

  it("stops for good on 403 and hides the monitor without toasts", async () => {
    fetchList.mockRejectedValue(new ProcessMonitorError(403, "No access"));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();
    await advance(POLL_MAX_BACKOFF_MS * 2);

    expect(fetchList).toHaveBeenCalledTimes(1);
    expect(useProcessMonitorStore.getState().forbidden).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("backs off after a transient failure and recovers", async () => {
    fetchList.mockRejectedValueOnce(new ProcessMonitorError(500, "boom")).mockResolvedValue(page([], 100));

    renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();
    expect(useProcessMonitorStore.getState().hasError).toBe(true);

    await advance(POLL_INTERVAL_MS);
    expect(fetchList).toHaveBeenCalledTimes(1);
    await advance(POLL_INTERVAL_MS);
    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(useProcessMonitorStore.getState().hasError).toBe(false);
  });

  it("stops polling on unmount", async () => {
    fetchList.mockResolvedValue(page([], 100));
    const { unmount } = renderHook(() => useProcessMonitorPolling(true, "r1"));
    await flush();

    unmount();
    await advance(POLL_INTERVAL_MS * 3);

    expect(fetchList).toHaveBeenCalledTimes(1);
  });

  it("restarts from scratch when the role changes", async () => {
    fetchList.mockResolvedValue(page([], 100));
    const { rerender } = renderHook(({ role }) => useProcessMonitorPolling(true, role), {
      initialProps: { role: "r1" },
    });
    await flush();

    rerender({ role: "r2" });
    await flush();

    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(fetchList.mock.calls[1][0]).toEqual({ limit: INITIAL_LIMIT });
  });
});
