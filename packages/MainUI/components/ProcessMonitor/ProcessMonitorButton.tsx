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
import type { ProcessExecution } from "@workspaceui/api-client/src/api/processMonitor";
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
import { failedExecutions, misfiredExecutions, runningExecutions } from "@/utils/processMonitor/mergeExecutions";
import { formatTimestamp } from "@/utils/processMonitor/format";
import ProcessExecutionDetail from "./ProcessExecutionDetail";

interface ExecutionSectionProps {
  title: string;
  executions: ProcessExecution[];
  /** Text color of the process names, which tells the sections apart. */
  tone: string;
  onSelect: (id: string) => void;
  unnamed: string;
  /** When set, the section stays visible without executions and shows this text. */
  emptyText?: string;
  testId: string;
  /** Whether the list starts expanded. */
  defaultOpen?: boolean;
}

/** One collapsible status group of the popover; hidden while empty unless it has an empty-state text. */
const ExecutionSection: React.FC<ExecutionSectionProps> = ({
  title,
  executions,
  tone,
  onSelect,
  unnamed,
  emptyText,
  testId,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  if (executions.length === 0 && !emptyText) {
    return null;
  }

  return (
    <section className="px-3 pb-2" data-testid={testId}>
      <h3 className="text-xs font-medium text-(--color-transparent-neutral-70)">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="w-full flex items-center justify-between px-1 pb-1 text-left cursor-pointer">
          <span>
            {title} ({executions.length})
          </span>
          <span aria-hidden="true" className={`transition-transform ${open ? "rotate-90" : ""}`}>
            ›
          </span>
        </button>
      </h3>
      {!open ? null : executions.length === 0 ? (
        <p className="px-1 py-2 text-sm text-(--color-transparent-neutral-70)">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {executions.map((execution) => (
            <li key={execution.id}>
              <button
                type="button"
                onClick={() => onSelect(execution.id)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-(--color-transparent-neutral-5) flex flex-col transition-colors">
                <span className={`text-sm font-medium break-words ${tone}`}>{execution.processName || unnamed}</span>
                <span className="text-xs text-(--color-transparent-neutral-70)">
                  {formatTimestamp(execution.endTime ?? execution.startTime)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * Header indicator of the background processes. It owns the polling (so failure toasts work with the
 * popover closed), shows the running count in its label and, in a popover, the running, failed and
 * misfired executions in a section each (click opens the detail) plus links to the Process Request / Process Monitor windows.
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

  const failed = useMemo(() => failedExecutions(executions), [executions]);
  const misfired = useMemo(() => misfiredExecutions(executions), [executions]);
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
      </div>
      {open && (
        <Menu
          anchorEl={anchorRef.current}
          onClose={() => setOpen(false)}
          className="w-[20.75rem]"
          offsetY={4}
          data-testid="Menu__ca468f">
          <div className="flex flex-col font-inter" data-testid="process-monitor-popover">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-base font-semibold text-(--color-baseline-100)">{label}</h2>
            </div>
            {hasError && (
              <output className="block mx-3 mb-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {t("processMonitor.staleWarning")}
              </output>
            )}
            <ExecutionSection
              title={t("processMonitor.running")}
              executions={running}
              tone="text-green-700"
              onSelect={openDetail}
              unnamed={t("processMonitor.unnamedProcess")}
              testId="process-monitor-running"
              defaultOpen
            />
            <ExecutionSection
              title={t("processMonitor.failed")}
              executions={failed}
              tone="text-red-700"
              onSelect={openDetail}
              unnamed={t("processMonitor.unnamedProcess")}
              emptyText={t("processMonitor.noFailures")}
              testId="process-monitor-failed"
            />
            <ExecutionSection
              title={t("processMonitor.misfired")}
              executions={misfired}
              tone="text-amber-700"
              onSelect={openDetail}
              unnamed={t("processMonitor.unnamedProcess")}
              testId="process-monitor-misfired"
            />
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
      <ProcessExecutionDetail data-testid="ProcessExecutionDetail__ca468f" />
    </>
  );
};

export default ProcessMonitorButton;
