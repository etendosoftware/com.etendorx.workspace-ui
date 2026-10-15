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

import { Metadata } from "./metadata";

export const PROCESS_MONITOR_PATH = "meta/process-monitor";

/** Normalized execution status: RUNNING(PRC), COMPLETED(SUC), FAILED(ERR), OTHER(KIL, MIS, SYR, PCE...). */
export type ProcessExecutionStatus = "RUNNING" | "COMPLETED" | "FAILED" | "OTHER";

export interface ProcessExecution {
  id: string;
  processRequestId: string | null;
  processId: string | null;
  processName: string | null;
  background: boolean;
  status: ProcessExecutionStatus;
  statusCode: string;
  finished: boolean;
  startTime: string | null;
  endTime: string | null;
  durationMs: number | null;
  duration: string | null;
  updated: string;
  updatedMs: number;
}

export interface ProcessMonitorListResponse {
  executions: ProcessExecution[];
  /** Epoch ms to send as `since` in the next call. */
  cursor: number | null;
  hasMore: boolean;
  serverTime: number;
  /** Number of RUNNING runs for the background/processId filters (ignores status and since). */
  runningCount: number;
}

export interface ProcessMonitorRequestInfo {
  id: string;
  description: string | null;
  scheduleStatus: string | null;
  timing: string | null;
  channel: string | null;
  nextExecution: string | null;
  previousExecution: string | null;
  user: string | null;
}

export interface ProcessExecutionDetail extends ProcessExecution {
  log: string | null;
  /** Equals `log` only when the execution FAILED. Full text, not truncated. */
  errorMessage: string | null;
  report: string | null;
  request?: ProcessMonitorRequestInfo;
}

export interface ProcessMonitorListParams {
  status?: ProcessExecutionStatus[];
  /** Cursor from a previous response (epoch ms). */
  since?: number;
  limit?: number;
  /** Backend default is true (only ISBACKGROUND=Y); false includes every process. */
  background?: boolean;
  processId?: string;
}

/** Error thrown for non-2xx monitor responses; `status` lets callers tell 403 (no access) apart. */
export class ProcessMonitorError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProcessMonitorError";
    // Required with an ES5 target, otherwise `instanceof` fails for Error subclasses.
    Object.setPrototypeOf(this, ProcessMonitorError.prototype);
    this.status = status;
  }
}

/**
 * Request flags that keep monitor polls from extending the classic session inactivity timeout
 * (same flags as the alerts poll).
 */
const POLL_FLAGS = { IsAjaxCall: "1", ignoreForSessionTimeout: "1" } as const;

const buildListQuery = (params: ProcessMonitorListParams): string => {
  const query = new URLSearchParams();
  if (params.status?.length) {
    query.set("status", params.status.join(","));
  }
  if (params.since !== undefined) {
    query.set("since", String(params.since));
  }
  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  if (params.background !== undefined) {
    query.set("background", String(params.background));
  }
  if (params.processId) {
    query.set("processId", params.processId);
  }
  for (const [key, value] of Object.entries(POLL_FLAGS)) {
    query.set(key, value);
  }
  return query.toString();
};

const readErrorMessage = (data: unknown, status: number): string => {
  const message = (data as { error?: unknown } | undefined)?.error;
  return typeof message === "string" && message ? message : `Process monitor request failed: ${status}`;
};

const get = async <T>(path: string): Promise<T> => {
  const response = await Metadata.client.request(path, { method: "GET", headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new ProcessMonitorError(response.status, readErrorMessage(response.data, response.status));
  }
  return response.data as T;
};

/** Lists background process executions (see the polling contract in `ProcessMonitorService`). */
export function fetchProcessMonitorList(params: ProcessMonitorListParams = {}): Promise<ProcessMonitorListResponse> {
  return get<ProcessMonitorListResponse>(`${PROCESS_MONITOR_PATH}?${buildListQuery(params)}`);
}

/** Fetches one execution with its log, error message and process request info. */
export function fetchProcessMonitorDetail(runId: string): Promise<ProcessExecutionDetail> {
  return get<ProcessExecutionDetail>(`${PROCESS_MONITOR_PATH}/${encodeURIComponent(runId)}`);
}
