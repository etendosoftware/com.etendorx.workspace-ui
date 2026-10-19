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
import ActivityIcon from "@workspaceui/componentlibrary/src/assets/icons/activity.svg";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { useTranslation } from "@/hooks/useTranslation";
import { useProcessMonitorPolling } from "@/hooks/useProcessMonitorPolling";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { useUserStore } from "@/stores/userStore";
import { useWindowStore } from "@/stores/windowStore";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { PROCESS_MONITOR_WINDOW_ID, PROCESS_REQUEST_WINDOW_ID } from "@/utils/processMonitor/constants";
import { isMisfired, recentFailures, runningExecutions } from "@/utils/processMonitor/mergeExecutions";
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

  const failures = useMemo(() => recentFailures(executions), [executions]);
  const running = useMemo(() => runningExecutions(executions), [executions]);

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
      {open && (
        <Menu anchorEl={anchorRef.current} onClose={() => setOpen(false)} className="w-[20.75rem]" offsetY={4}>
          <div className="flex flex-col font-inter" data-testid="process-monitor-popover">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-base font-semibold text-(--color-baseline-100)">{label}</h2>
            </div>
            {hasError && (
              <output className="block mx-3 mb-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {t("processMonitor.staleWarning")}
              </output>
            )}
            {running.length > 0 && (
              <section className="px-3 pb-2" data-testid="process-monitor-running">
                <h3 className="px-1 pb-1 text-xs font-medium text-(--color-transparent-neutral-70)">
                  {t("processMonitor.running")}
                </h3>
                <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {running.map((execution) => (
                    <li key={execution.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(execution.id)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-(--color-transparent-neutral-5) flex flex-col transition-colors">
                        <span className="text-sm font-medium text-green-700 break-words">
                          {execution.processName || t("processMonitor.unnamedProcess")}
                        </span>
                        <span className="text-xs text-(--color-transparent-neutral-70)">
                          {formatTimestamp(execution.startTime)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="px-3 pb-3">
              <h3 className="px-1 pb-1 text-xs font-medium text-(--color-transparent-neutral-70)">
                {t("processMonitor.recentFailures")}
              </h3>
              {failures.length === 0 ? (
                <p className="px-1 py-2 text-sm text-(--color-transparent-neutral-70)">
                  {t("processMonitor.noFailures")}
                </p>
              ) : (
                <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {failures.map((execution) => (
                    <li key={execution.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(execution.id)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-(--color-transparent-neutral-5) flex flex-col transition-colors">
                        <span
                          className={`text-sm font-medium break-words ${isMisfired(execution) ? "text-amber-700" : "text-red-700"}`}>
                          {execution.processName || t("processMonitor.unnamedProcess")}
                          {isMisfired(execution) && ` (${t("processMonitor.misfired")})`}
                        </span>
                        <span className="text-xs text-(--color-transparent-neutral-70)">
                          {formatTimestamp(execution.endTime ?? execution.startTime)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="flex flex-col gap-1 border-t border-(--color-transparent-neutral-10) p-3">
              {[
                [PROCESS_REQUEST_WINDOW_ID, t("processMonitor.requestWindow")],
                [PROCESS_MONITOR_WINDOW_ID, t("processMonitor.monitorWindow")],
              ].map(([windowId, title]) => (
                <button
                  key={windowId}
                  type="button"
                  onClick={() => openWindow(windowId, title)}
                  className="text-left text-sm font-medium px-3 py-2 rounded-xl text-(--color-dynamic-main) hover:bg-(--color-dynamic-light) transition-colors">
                  {title}
                </button>
              ))}
            </div>
          </div>
        </Menu>
      )}
      <ProcessExecutionDetail />
    </>
  );
};

export default ProcessMonitorButton;
