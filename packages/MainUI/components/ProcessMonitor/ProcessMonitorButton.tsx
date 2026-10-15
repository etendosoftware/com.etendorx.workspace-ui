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

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Popover } from "@mui/material";
import ActivityIcon from "@workspaceui/componentlibrary/src/assets/icons/activity.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { useTranslation } from "@/hooks/useTranslation";
import { useProcessMonitorPolling } from "@/hooks/useProcessMonitorPolling";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { useUserStore } from "@/stores/userStore";
import { useWindowStore } from "@/stores/windowStore";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import {
  PROCESS_MONITOR_WINDOW_ID,
  PROCESS_REQUEST_WINDOW_ID,
  MAX_FAILURES_SHOWN,
} from "@/utils/processMonitor/constants";
import { recentFailures } from "@/utils/processMonitor/mergeExecutions";
import { formatTimestamp } from "@/utils/processMonitor/format";
import ProcessExecutionDetail from "./ProcessExecutionDetail";

/**
 * Header indicator of the background processes. It owns the polling (so failure toasts work with the
 * popover closed), shows a badge with the running count and, in a popover, the most recent failed
 * executions (click opens the error log) plus links to the Process Request / Process Monitor windows.
 * It disappears when the role has no access to the monitor.
 */
const ProcessMonitorButton: React.FC = () => {
  const { t } = useTranslation();
  const token = useUserStore((s) => s.token);
  const roleId = useUserStore((s) => s.currentRole?.id);
  const passwordExpired = useUserStore((s) => s.passwordExpired);
  const forbidden = useProcessMonitorStore((s) => s.forbidden);
  const runningCount = useProcessMonitorStore((s) => s.runningCount);
  const executions = useProcessMonitorStore((s) => s.executions);
  const hasError = useProcessMonitorStore((s) => s.hasError);
  const openDetail = useProcessMonitorStore((s) => s.openDetail);
  const setWindowActive = useWindowStore((s) => s.setWindowActive);
  const loadWindowData = useMetadataZustandStore((s) => s.loadWindowData);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useProcessMonitorPolling(Boolean(token && roleId && !passwordExpired), roleId);

  const failures = useMemo(() => recentFailures(executions, MAX_FAILURES_SHOWN), [executions]);

  // Same way the sidebar opens a window entry.
  const openWindow = useCallback(
    (windowId: string, title: string) => {
      setOpen(false);
      loadWindowData(windowId).catch(() => {});
      setWindowActive({
        windowIdentifier: getNewWindowIdentifier(windowId),
        windowData: { title, initialized: true },
      });
    },
    [loadWindowData, setWindowActive]
  );

  if (forbidden) {
    return null;
  }

  const label =
    runningCount > 0
      ? t("processMonitor.buttonLabelRunning").replace("%0", String(runningCount))
      : t("processMonitor.buttonLabel");

  return (
    <>
      <div className="relative" ref={anchorRef}>
        <IconButton
          onClick={() => setOpen((value) => !value)}
          tooltip={label}
          ariaLabel={label}
          isPressed={open}
          className="w-10 h-10"
          data-testid="IconButton__process-monitor">
          <ActivityIcon data-testid="Icon__process-monitor" />
        </IconButton>
        {runningCount > 0 && (
          <span
            className="pointer-events-none absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] leading-4 text-center"
            data-testid="process-monitor-running-badge">
            {runningCount > 99 ? "99+" : runningCount}
          </span>
        )}
      </div>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <div className="w-80 max-w-[calc(100vw-2rem)] p-3 flex flex-col gap-3" data-testid="process-monitor-popover">
          <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
          {hasError && (
            <output className="block text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              {t("processMonitor.staleWarning")}
            </output>
          )}
          <section>
            <h3 className="text-xs font-medium text-gray-500 mb-1">{t("processMonitor.recentFailures")}</h3>
            {failures.length === 0 ? (
              <p className="text-sm text-gray-500">{t("processMonitor.noFailures")}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {failures.map((execution) => (
                  <li key={execution.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(execution.id)}
                      className="w-full text-left py-2 hover:bg-gray-50 flex flex-col">
                      <span className="text-sm font-medium text-red-700 break-words">
                        {execution.processName || t("processMonitor.unnamedProcess")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(execution.endTime ?? execution.startTime)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
            <button
              type="button"
              onClick={() => openWindow(PROCESS_REQUEST_WINDOW_ID, t("processMonitor.requestWindow"))}
              className="text-left text-sm text-(--color-dynamic-main) hover:underline">
              {t("processMonitor.requestWindow")}
            </button>
            <button
              type="button"
              onClick={() => openWindow(PROCESS_MONITOR_WINDOW_ID, t("processMonitor.monitorWindow"))}
              className="text-left text-sm text-(--color-dynamic-main) hover:underline">
              {t("processMonitor.monitorWindow")}
            </button>
          </div>
        </div>
      </Popover>
      <ProcessExecutionDetail />
    </>
  );
};

export default ProcessMonitorButton;
