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

import type { ProcessExecution } from "@workspaceui/api-client/src/api/processMonitor";
import { MAX_KEPT_EXECUTIONS } from "../constants";
import { mergeExecutions, recentFailures, sortExecutions } from "../mergeExecutions";

const build = (id: string, status: ProcessExecution["status"], updatedMs = 1000): ProcessExecution => ({
  id,
  processRequestId: null,
  processId: "P",
  processName: `Process ${id}`,
  background: true,
  status,
  statusCode: status === "RUNNING" ? "PRC" : "SUC",
  finished: status !== "RUNNING",
  startTime: null,
  endTime: null,
  durationMs: null,
  duration: null,
  updated: "2026-10-15T10:00:00Z",
  updatedMs,
});

describe("mergeExecutions", () => {
  it("does not notify runs seen for the first time on the initial load", () => {
    const { next, transitions } = mergeExecutions({}, [build("a", "COMPLETED"), build("b", "FAILED")], false);

    expect(transitions).toEqual([]);
    expect(Object.keys(next)).toEqual(["a", "b"]);
  });

  it("does not notify runs that are still running", () => {
    expect(mergeExecutions({}, [build("a", "RUNNING")], true).transitions).toEqual([]);
  });

  it("notifies RUNNING -> FAILED", () => {
    const prev = { a: build("a", "RUNNING", 1000) };

    const { next, transitions } = mergeExecutions(prev, [build("a", "FAILED", 2000)], false);

    expect(transitions).toHaveLength(1);
    expect(transitions[0].status).toBe("FAILED");
    expect(next.a.status).toBe("FAILED");
  });

  it("does not notify RUNNING -> COMPLETED", () => {
    const prev = { a: build("a", "RUNNING", 1000) };

    const { next, transitions } = mergeExecutions(prev, [build("a", "COMPLETED", 2000)], true);

    expect(transitions).toEqual([]);
    expect(next.a.status).toBe("COMPLETED");
  });

  it("does not notify unseen completed runs after the initial load", () => {
    expect(mergeExecutions({}, [build("a", "COMPLETED")], true).transitions).toEqual([]);
  });

  it("notifies unseen finished runs after the initial load (start and end between two polls)", () => {
    const { transitions } = mergeExecutions({}, [build("a", "FAILED")], true);

    expect(transitions.map((t) => t.execution.id)).toEqual(["a"]);
  });

  it("notifies only once when the same finished run arrives again (cursor safety margin)", () => {
    const first = mergeExecutions({ a: build("a", "RUNNING", 1000) }, [build("a", "FAILED", 2000)], false);
    const again = mergeExecutions(first.next, [build("a", "FAILED", 2000)], true);

    expect(first.transitions).toHaveLength(1);
    expect(again.transitions).toEqual([]);
  });

  it("does not notify transitions that do not fail the run", () => {
    const prev = { a: build("a", "RUNNING", 1000) };

    expect(mergeExecutions(prev, [build("a", "OTHER", 2000)], true).transitions).toEqual([]);
  });

  it("ignores stale payloads", () => {
    const prev = { a: build("a", "FAILED", 2000) };

    const { next, transitions } = mergeExecutions(prev, [build("a", "RUNNING", 1000)], true);

    expect(next.a.status).toBe("FAILED");
    expect(transitions).toEqual([]);
  });

  it("returns the same map reference when nothing changed", () => {
    const prev = { a: build("a", "RUNNING", 1000) };

    expect(mergeExecutions(prev, [build("a", "RUNNING", 1000)], true).next).toBe(prev);
  });

  it("tolerates null update timestamps", () => {
    const nullUpdated = { ...build("a", "RUNNING"), updated: null, updatedMs: null };
    const { next } = mergeExecutions({ a: nullUpdated }, [{ ...nullUpdated, status: "FAILED" }], false);

    expect(next.a.status).toBe("FAILED");
    expect(sortExecutions({ a: nullUpdated, b: build("b", "FAILED", 5) }).map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the previous map", () => {
    const prev = { a: build("a", "RUNNING") };

    mergeExecutions(prev, [build("a", "COMPLETED", 5000)], false);

    expect(prev.a.status).toBe("RUNNING");
  });

  it("caps the kept executions but never evicts running ones", () => {
    const old = Array.from({ length: MAX_KEPT_EXECUTIONS + 10 }, (_, i) => build(`c${i}`, "COMPLETED", 10_000 + i));
    const running = build("run", "RUNNING", 1);

    const { next } = mergeExecutions({}, [running, ...old], false);

    expect(next.run).toBeDefined();
    expect(Object.keys(next)).toHaveLength(MAX_KEPT_EXECUTIONS + 1);
    expect(next.c0).toBeUndefined();
  });
});

describe("sortExecutions", () => {
  it("orders newest first", () => {
    const sorted = sortExecutions({
      a: build("a", "COMPLETED", 1),
      b: build("b", "COMPLETED", 3),
      c: build("c", "FAILED", 2),
    });

    expect(sorted.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
});

describe("recentFailures", () => {
  it("returns only failed runs, newest first, up to the limit", () => {
    const failures = recentFailures(
      {
        a: build("a", "FAILED", 1),
        b: build("b", "COMPLETED", 5),
        c: build("c", "FAILED", 3),
        d: build("d", "FAILED", 2),
      },
      2
    );

    expect(failures.map((e) => e.id)).toEqual(["c", "d"]);
  });
});
