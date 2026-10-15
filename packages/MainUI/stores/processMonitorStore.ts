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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ProcessMonitorListResponse } from "@workspaceui/api-client/src/api/processMonitor";
import { type ExecutionMap, type ExecutionTransition, mergeExecutions } from "@/utils/processMonitor/mergeExecutions";

interface ProcessMonitorState {
  /** Execution whose error dialog is open, if any. */
  detailId: string | null;
  executions: ExecutionMap;
  /** Cursor of the last response (epoch ms), `null` until the initial load succeeds. */
  cursor: number | null;
  runningCount: number;
  /** True once the initial load succeeded: later unseen failed runs are notified. */
  loaded: boolean;
  /** The role has no access to the monitor endpoints (403): hide it, stop polling. */
  forbidden: boolean;
  /** The last poll failed (transient): the popover warns that the data may be stale. */
  hasError: boolean;
}

interface ProcessMonitorActions {
  openDetail: (id: string) => void;
  closeDetail: () => void;
  /** Merges a poll response and returns the runs that just failed (to notify). */
  applyResponse: (response: ProcessMonitorListResponse) => ExecutionTransition[];
  setForbidden: () => void;
  setError: (hasError: boolean) => void;
  /** Clears the polled data (session/role change). */
  reset: () => void;
}

const initialData = {
  detailId: null,
  executions: {} as ExecutionMap,
  cursor: null,
  runningCount: 0,
  loaded: false,
  forbidden: false,
  hasError: false,
};

export const useProcessMonitorStore = create<ProcessMonitorState & ProcessMonitorActions>()(
  devtools(
    (set, get) => ({
      ...initialData,

      openDetail: (id) => set({ detailId: id }),
      closeDetail: () => set({ detailId: null }),

      applyResponse: (response) => {
        const state = get();
        const { next, transitions } = mergeExecutions(state.executions, response.executions, state.loaded);
        set({
          executions: next,
          // Never moves backwards, even if a response carries an older cursor.
          cursor: Math.max(state.cursor ?? 0, response.cursor ?? 0) || response.serverTime,
          runningCount: response.runningCount,
          loaded: true,
          hasError: false,
        });
        return transitions;
      },

      setForbidden: () => set({ forbidden: true, detailId: null }),
      setError: (hasError) => set({ hasError }),
      reset: () => set({ ...initialData }),
    }),
    { name: "ProcessMonitorStore" }
  )
);
