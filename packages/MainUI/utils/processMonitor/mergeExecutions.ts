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
import { MAX_KEPT_EXECUTIONS } from "./constants";

export type ExecutionMap = Record<string, ProcessExecution>;

/** A run that just failed and deserves an in-app notification. */
export interface ExecutionTransition {
  execution: ProcessExecution;
  status: "FAILED";
}

export interface MergeResult {
  next: ExecutionMap;
  transitions: ExecutionTransition[];
}

/**
 * Upserts the polled executions by `id` (the backend cursor is strict and the client re-reads a
 * safety margin, so the same run can arrive several times) and detects the runs to notify.
 *
 * Notification rules (failures only):
 * - RUNNING -> FAILED notifies.
 * - A run never seen before notifies only when `notifyUnseen` is true (every poll after the initial
 *   load: a short run can start and fail between two polls). On the initial load it is false, so
 *   opening the app never produces a toast storm for runs that had already failed.
 * - Stale payloads (older `updatedMs` than the stored one) are ignored.
 */
export function mergeExecutions(prev: ExecutionMap, incoming: ProcessExecution[], notifyUnseen: boolean): MergeResult {
  const next: ExecutionMap = { ...prev };
  const transitions: ExecutionTransition[] = [];
  let changed = false;

  for (const execution of incoming) {
    const stored = next[execution.id];
    if (stored && updatedOf(execution) < updatedOf(stored)) {
      continue;
    }
    const mayNotify = stored ? stored.status === "RUNNING" : notifyUnseen;
    if (mayNotify && execution.status === "FAILED") {
      transitions.push({ execution, status: "FAILED" });
    }
    if (!stored || !isSameExecution(stored, execution)) {
      next[execution.id] = execution;
      changed = true;
    }
  }

  // Same reference when nothing changed, so subscribers do not re-render on every idle poll.
  return { next: changed ? trimExecutions(next) : prev, transitions };
}

const updatedOf = (execution: ProcessExecution): number => execution.updatedMs ?? 0;

const isSameExecution = (a: ProcessExecution, b: ProcessExecution): boolean =>
  a.status === b.status &&
  a.updatedMs === b.updatedMs &&
  a.processName === b.processName &&
  a.endTime === b.endTime &&
  a.duration === b.duration;

/** Newest first. */
export function sortExecutions(map: ExecutionMap): ProcessExecution[] {
  return Object.values(map).sort((a, b) => updatedOf(b) - updatedOf(a));
}

/** Most recent failed executions. */
export function recentFailures(map: ExecutionMap, limit: number): ProcessExecution[] {
  return sortExecutions(map)
    .filter((execution) => execution.status === "FAILED")
    .slice(0, limit);
}

function trimExecutions(map: ExecutionMap): ExecutionMap {
  const all = sortExecutions(map);
  if (all.length <= MAX_KEPT_EXECUTIONS) {
    return map;
  }
  const kept: ExecutionMap = {};
  let remaining = MAX_KEPT_EXECUTIONS;
  for (const execution of all) {
    if (execution.status === "RUNNING" || remaining > 0) {
      kept[execution.id] = execution;
      if (execution.status !== "RUNNING") {
        remaining--;
      }
    }
  }
  return kept;
}
