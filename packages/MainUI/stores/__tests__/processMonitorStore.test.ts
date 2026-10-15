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

import type { ProcessExecution, ProcessMonitorListResponse } from "@workspaceui/api-client/src/api/processMonitor";
import { useProcessMonitorStore } from "../processMonitorStore";

const build = (id: string, status: ProcessExecution["status"], updatedMs = 1000): ProcessExecution => ({
  id,
  processRequestId: null,
  processId: null,
  processName: id,
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

const response = (executions: ProcessExecution[], extra: Partial<ProcessMonitorListResponse> = {}) => ({
  executions,
  cursor: 5000,
  hasMore: false,
  serverTime: 6000,
  runningCount: 1,
  ...extra,
});

const store = () => useProcessMonitorStore.getState();

describe("processMonitorStore", () => {
  beforeEach(() => {
    store().reset();
  });

  it("stores the initial load without notifying and keeps the cursor", () => {
    const transitions = store().applyResponse(response([build("a", "FAILED"), build("b", "RUNNING")]));

    expect(transitions).toEqual([]);
    expect(store().loaded).toBe(true);
    expect(store().cursor).toBe(5000);
    expect(store().runningCount).toBe(1);
    expect(Object.keys(store().executions)).toHaveLength(2);
  });

  it("falls back to the server time, then keeps the previous cursor, when the cursor is null", () => {
    store().applyResponse(response([], { cursor: null }));
    expect(store().cursor).toBe(6000);

    store().applyResponse(response([], { cursor: null, serverTime: 9000 }));
    expect(store().cursor).toBe(6000);
  });

  it("never moves the cursor backwards", () => {
    store().applyResponse(response([], { cursor: 8000 }));
    store().applyResponse(response([], { cursor: 7000 }));

    expect(store().cursor).toBe(8000);
  });

  it("returns only the failures of later polls", () => {
    store().applyResponse(response([build("a", "RUNNING"), build("b", "RUNNING")]));

    const transitions = store().applyResponse(
      response([build("a", "FAILED", 2000), build("b", "COMPLETED", 2000), build("c", "FAILED", 2000)])
    );

    expect(transitions.map((t) => t.execution.id).sort()).toEqual(["a", "c"]);
  });

  it("opens and closes the detail", () => {
    store().openDetail("a");
    expect(store().detailId).toBe("a");
    store().closeDetail();
    expect(store().detailId).toBeNull();
  });

  it("closes the detail when access is forbidden", () => {
    store().openDetail("a");
    store().setForbidden();

    expect(store().forbidden).toBe(true);
    expect(store().detailId).toBeNull();
  });

  it("reset clears the polled data", () => {
    store().applyResponse(response([build("a", "RUNNING")]));
    store().setError(true);
    store().reset();

    expect(store().executions).toEqual({});
    expect(store().loaded).toBe(false);
    expect(store().cursor).toBeNull();
    expect(store().hasError).toBe(false);
  });
});
