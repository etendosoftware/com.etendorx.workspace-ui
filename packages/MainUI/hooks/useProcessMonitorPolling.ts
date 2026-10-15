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

import { useEffect, useRef } from "react";
import {
  fetchProcessMonitorList,
  ProcessMonitorError,
  type ProcessMonitorListResponse,
} from "@workspaceui/api-client/src/api/processMonitor";
import { useTranslation } from "@/hooks/useTranslation";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { logger } from "@/utils/logger";
import {
  CURSOR_SAFETY_MARGIN_MS,
  INCREMENTAL_LIMIT,
  INITIAL_LIMIT,
  MAX_PAGES_PER_POLL,
  POLL_INTERVAL_MS,
  POLL_MAX_BACKOFF_MS,
} from "@/utils/processMonitor/constants";
import { notifyTransitions } from "@/utils/processMonitor/notifyTransitions";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

/** Delay before the next poll: doubled after each consecutive failure, capped at {@link POLL_MAX_BACKOFF_MS}. */
export function getNextDelay(failures: number): number {
  return Math.min(POLL_INTERVAL_MS * 2 ** failures, POLL_MAX_BACKOFF_MS);
}

/**
 * Polls `GET /meta/process-monitor` (no WebSocket) and feeds {@link useProcessMonitorStore}.
 *
 * - Initial load without `since`; later calls send `since = cursor - safety margin` and the store
 *   upserts by id. While `hasMore` the next page is requested immediately (bounded).
 * - Polls are strictly sequential (the next one is scheduled when the previous one settles), pause
 *   while the document is hidden (one immediate poll when it becomes visible again) and stop on
 *   unmount or when `enabled` turns false.
 * - 403 hides the monitor for the session/role (no retries, no toast); 401 stops polling (the
 *   global interceptor handles the logout); any other failure backs off exponentially.
 * - Runs that failed raise a toast (never for runs already failed on the initial load).
 *
 * @param enabled - Whether a session is active
 * @param roleId - Current role; the access and the data depend on it, so a change restarts everything
 */
export function useProcessMonitorPolling(enabled: boolean, roleId?: string): void {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  // biome-ignore lint/correctness/useExhaustiveDependencies: roleId restarts the polling on role change
  useEffect(() => {
    if (!enabled) {
      return;
    }

    useProcessMonitorStore.getState().reset();

    let cancelled = false;
    let stopped = false;
    let inFlight = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fetchPage = (): Promise<ProcessMonitorListResponse> => {
      const { cursor } = useProcessMonitorStore.getState();
      return cursor === null
        ? fetchProcessMonitorList({ limit: INITIAL_LIMIT })
        : fetchProcessMonitorList({ since: Math.max(0, cursor - CURSOR_SAFETY_MARGIN_MS), limit: INCREMENTAL_LIMIT });
    };

    const pollOnce = async () => {
      for (let page = 0; page < MAX_PAGES_PER_POLL; page++) {
        const response = await fetchPage();
        if (cancelled) {
          return;
        }
        const store = useProcessMonitorStore.getState();
        const transitions = store.applyResponse(response);
        notifyTransitions(transitions, { t: tRef.current, openDetail: store.openDetail });
        if (!response.hasMore) {
          return;
        }
      }
    };

    const handleFailure = (error: unknown) => {
      const store = useProcessMonitorStore.getState();
      const status = error instanceof ProcessMonitorError ? error.status : undefined;
      if (status === HTTP_FORBIDDEN) {
        stopped = true;
        store.setForbidden();
        return;
      }
      if (status === HTTP_UNAUTHORIZED) {
        stopped = true;
        return;
      }
      failures++;
      store.setError(true);
      logger.warn("Failed to poll the process monitor", error);
    };

    const schedule = () => {
      clearTimeout(timer);
      if (cancelled || stopped) {
        return;
      }
      timer = setTimeout(run, getNextDelay(failures));
    };

    async function run() {
      clearTimeout(timer);
      if (cancelled || stopped || inFlight) {
        return;
      }
      if (document.hidden) {
        // Resumed by the visibilitychange listener.
        return;
      }
      inFlight = true;
      try {
        await pollOnce();
        failures = 0;
      } catch (error) {
        if (cancelled) {
          return;
        }
        handleFailure(error);
      } finally {
        inFlight = false;
      }
      schedule();
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        run();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, roleId]);
}
