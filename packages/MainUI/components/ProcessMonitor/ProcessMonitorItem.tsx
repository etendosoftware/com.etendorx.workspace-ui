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
import { Box, Collapse, Divider, IconButton, ListItem, ListItemText, Tooltip, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { BackgroundProcessItem } from "@workspaceui/api-client/src/api/types";
import { useTranslation } from "@/hooks/useTranslation";
import { ProcessStatusBadge } from "./ProcessStatusBadge";

interface ProcessMonitorItemProps {
  item: BackgroundProcessItem;
}

export const ProcessMonitorItem = ({ item }: ProcessMonitorItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasLog = !!item.errorMsg;
  const { t } = useTranslation();

  const formatElapsed = (startTime: string): string => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diffMs = now - start;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}${t("processMonitor.item.timeAgo.seconds")}`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}${t("processMonitor.item.timeAgo.minutes")}`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}${t("processMonitor.item.timeAgo.hours")}`;
  };

  return (
    <>
      <ListItem
        alignItems="flex-start"
        secondaryAction={
          hasLog ? (
            <Tooltip
              title={expanded ? t("processMonitor.item.hideLog") : t("processMonitor.item.showLog")}
              data-testid="Tooltip__30fb91">
              <IconButton
                size="small"
                onClick={() => setExpanded((v) => !v)}
                data-testid={`ProcessMonitorItem__toggle__${item.pInstanceId}`}>
                {expanded ? (
                  <ExpandLessIcon fontSize="small" data-testid="ExpandLessIcon__30fb91" />
                ) : (
                  <ExpandMoreIcon fontSize="small" data-testid="ExpandMoreIcon__30fb91" />
                )}
              </IconButton>
            </Tooltip>
          ) : null
        }
        data-testid={`ProcessMonitorItem__${item.pInstanceId}`}>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: hasLog ? 4 : 0 }} data-testid="Box__30fb91">
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{ flex: 1, minWidth: 0 }}
                data-testid="Typography__30fb91">
                {item.processName}
              </Typography>
              <ProcessStatusBadge status={item.status} data-testid="ProcessStatusBadge__30fb91" />
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" data-testid="Typography__30fb91">
              {formatElapsed(item.startTime)}
            </Typography>
          }
          data-testid="ListItemText__30fb91"
        />
      </ListItem>
      {hasLog && (
        <Collapse in={expanded} timeout="auto" unmountOnExit data-testid="Collapse__30fb91">
          <Box
            sx={{
              mx: 2,
              mb: 1,
              p: 1,
              bgcolor: "#F5F6FA",
              borderRadius: 1,
              maxHeight: 120,
              overflow: "auto",
            }}
            data-testid="Box__30fb91">
            <Typography
              variant="caption"
              component="pre"
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0, fontFamily: "monospace" }}
              data-testid="Typography__30fb91">
              {item.errorMsg}
            </Typography>
          </Box>
        </Collapse>
      )}
      <Divider component="li" data-testid="Divider__30fb91" />
    </>
  );
};
