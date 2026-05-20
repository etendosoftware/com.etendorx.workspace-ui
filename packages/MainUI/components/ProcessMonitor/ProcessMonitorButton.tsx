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
import { Badge, IconButton, Tooltip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useBackgroundProcessMonitor } from "@/hooks/useBackgroundProcessMonitor";
import { ProcessMonitorPanel } from "./ProcessMonitorPanel";

export const ProcessMonitorButton = (_props: React.HTMLAttributes<HTMLDivElement>) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const { items, loading, runningCount, failedCount, refresh } = useBackgroundProcessMonitor();

  const badgeCount = runningCount + failedCount;
  const badgeColor = failedCount > 0 ? "error" : "info";

  return (
    <>
      <Tooltip title="Background Processes">
        <IconButton
          size="small"
          onClick={() => setPanelOpen(true)}
          data-testid="ProcessMonitorButton__trigger"
          sx={{ color: "inherit" }}>
          <Badge
            badgeContent={badgeCount > 0 ? badgeCount : undefined}
            color={badgeColor}
            data-testid="ProcessMonitorButton__badge">
            <AccessTimeIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <ProcessMonitorPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        items={items}
        loading={loading}
        onRefresh={refresh}
      />
    </>
  );
};
