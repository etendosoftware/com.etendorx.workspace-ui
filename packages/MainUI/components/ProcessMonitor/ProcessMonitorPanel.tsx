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
import { Box, Button, CircularProgress, Drawer, IconButton, List, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";
import type { BackgroundProcessItem, BackgroundProcessStatus } from "@workspaceui/api-client/src/api/types";
import { ProcessMonitorItem } from "./ProcessMonitorItem";

const PROCESS_SCHEDULING_WINDOW_URL = "/window?wi_0=800016";

interface ProcessMonitorPanelProps {
  open: boolean;
  onClose: () => void;
  items: BackgroundProcessItem[];
  loading: boolean;
  onRefresh: () => void;
}

type TabFilter = "ALL" | BackgroundProcessStatus;

const TABS: { label: string; value: TabFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Running", value: "RUNNING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

export const ProcessMonitorPanel = ({ open, onClose, items, loading, onRefresh }: ProcessMonitorPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");

  const filtered = activeTab === "ALL" ? items : items.filter((i) => i.status === activeTab);

  const countFor = (filter: TabFilter) =>
    filter === "ALL" ? items.length : items.filter((i) => i.status === filter).length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 380, display: "flex", flexDirection: "column" } }}
      data-testid="ProcessMonitorPanel__drawer">
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          gap: 1,
        }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
          Background Processes
        </Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton size="small" onClick={onRefresh} disabled={loading} data-testid="ProcessMonitorPanel__refresh">
              {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <IconButton size="small" onClick={onClose} data-testid="ProcessMonitorPanel__close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40 }}
        data-testid="ProcessMonitorPanel__tabs">
        {TABS.map(({ label, value }) => (
          <Tab
            key={value}
            label={`${label} (${countFor(value)})`}
            value={value}
            sx={{ minHeight: 40, py: 0.5, fontSize: "0.75rem" }}
            data-testid={`ProcessMonitorPanel__tab__${value}`}
          />
        ))}
      </Tabs>

      {/* List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {filtered.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              color: "text.secondary",
            }}>
            <Typography variant="body2">
              {loading ? "Loading..." : "No background processes in the last 24 hours"}
            </Typography>
          </Box>
        ) : (
          <List disablePadding data-testid="ProcessMonitorPanel__list">
            {filtered.map((item) => (
              <ProcessMonitorItem key={item.pInstanceId} item={item} />
            ))}
          </List>
        )}
      </Box>

      {/* Footer: link to Process Scheduling window */}
      <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1 }}>
        <Button
          component={Link}
          href={PROCESS_SCHEDULING_WINDOW_URL}
          size="small"
          endIcon={<OpenInNewIcon fontSize="inherit" />}
          onClick={onClose}
          sx={{ textTransform: "none" }}
          data-testid="ProcessMonitorPanel__scheduling-link">
          Go to Process Scheduling
        </Button>
      </Box>
    </Drawer>
  );
};
