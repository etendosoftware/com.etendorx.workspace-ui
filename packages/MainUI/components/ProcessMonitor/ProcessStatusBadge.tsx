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
import { Chip, CircularProgress } from "@mui/material";
import type { BackgroundProcessStatus } from "@workspaceui/api-client/src/api/types";

interface ProcessStatusBadgeProps {
  status: BackgroundProcessStatus;
}

const STATUS_CONFIG: Record<BackgroundProcessStatus, { label: string; color: "info" | "success" | "error" }> = {
  RUNNING: { label: "Running", color: "info" },
  COMPLETED: { label: "Completed", color: "success" },
  FAILED: { label: "Failed", color: "error" },
};

export const ProcessStatusBadge = ({ status }: ProcessStatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      icon={
        status === "RUNNING" ? (
          <CircularProgress
            size={12}
            color="inherit"
            sx={{ ml: "6px !important" }}
            data-testid="CircularProgress__961534"
          />
        ) : undefined
      }
      data-testid={`ProcessStatusBadge__${status}`}
    />
  );
};
