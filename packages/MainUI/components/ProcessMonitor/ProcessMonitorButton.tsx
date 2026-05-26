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
 * All portions are Copyright © 2021-2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */
"use client";
import { useState } from "react";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import ClockIcon from "@workspaceui/componentlibrary/src/assets/icons/clock.svg";
import { useBackgroundProcessMonitor } from "@/hooks/useBackgroundProcessMonitor";
import { useTranslation } from "@/hooks/useTranslation";
import { ProcessMonitorPanel } from "./ProcessMonitorPanel";

export const ProcessMonitorButton = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const { items, loading, runningCount, failedCount, refresh } = useBackgroundProcessMonitor();
  const { t } = useTranslation();

  const badgeCount = runningCount + failedCount;
  const badgeColor = failedCount > 0 ? "bg-red-500" : "bg-blue-500";

  return (
    <>
      <div className="relative">
        <IconButton
          onClick={() => setPanelOpen(true)}
          tooltip={t("processMonitor.button.tooltip")}
          ariaLabel={t("processMonitor.button.ariaLabel")}
          className="w-10 h-10"
          data-testid="ProcessMonitorButton__trigger">
          <ClockIcon data-testid="ClockIcon__ca468f" />
        </IconButton>
        {badgeCount > 0 && (
          <span
            className={`absolute top-0 right-0 ${badgeColor} text-white text-[0.6rem] font-bold rounded-full min-w-[1rem] h-4 flex items-center justify-center px-1 pointer-events-none`}
            data-testid="ProcessMonitorButton__badge">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      <ProcessMonitorPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        items={items}
        loading={loading}
        onRefresh={refresh}
        data-testid="ProcessMonitorPanel__ca468f"
      />
    </>
  );
};
