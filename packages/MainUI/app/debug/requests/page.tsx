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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import type { DebugLogEntry } from "../../api/_utils/debugLogger";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debug-tabpanel-${index}`}
      aria-labelledby={`debug-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function formatJson(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function getStatusColor(status: number): "success" | "warning" | "error" | "default" {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "error";
  return "default";
}

function getMethodColor(method: string): "primary" | "secondary" | "warning" | "error" | "default" {
  switch (method.toUpperCase()) {
    case "GET":
      return "primary";
    case "POST":
      return "secondary";
    case "PUT":
      return "warning";
    case "DELETE":
      return "error";
    default:
      return "default";
  }
}

export default function RequestDebugger() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<DebugLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<DebugLogEntry | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [filters, setFilters] = useState({
    method: "",
    status: "",
    route: "",
    search: "",
  });

  // SSE connection
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let eventSource: EventSource | null = null;

    const connect = () => {
      setConnectionStatus("connecting");
      eventSource = new EventSource("/api/debug/stream");

      eventSource.onopen = () => {
        setConnectionStatus("connected");
        console.debug("Debug SSE connection established");
      };

      eventSource.onmessage = (event) => {
        try {
          const newLogs = JSON.parse(event.data) as DebugLogEntry[];
          setLogs(newLogs);
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setConnectionStatus("error");
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSource) {
            eventSource.close();
          }
          connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    if (filters.method) {
      filtered = filtered.filter((log) => log.method === filters.method);
    }

    if (filters.status) {
      if (filters.status === "success") {
        filtered = filtered.filter((log) => log.responseStatus >= 200 && log.responseStatus < 300);
      } else if (filters.status === "error") {
        filtered = filtered.filter((log) => log.responseStatus >= 400);
      } else {
        const statusCode = parseInt(filters.status);
        filtered = filtered.filter((log) => log.responseStatus === statusCode);
      }
    }

    if (filters.route) {
      filtered = filtered.filter((log) => log.route.toLowerCase().includes(filters.route.toLowerCase()));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.url.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.requestBody).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.responseBody).toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  const handleClearLogs = async () => {
    try {
      await fetch("/api/debug/clear", { method: "POST" });
      setLogs([]);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    return date.toLocaleTimeString();
  };

  // Production check
  if (process.env.NODE_ENV !== "development") {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          Debug interface is only available in development mode.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ERP Request Debugger
      </Typography>

      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Chip
          icon={connectionStatus === "connected" ? <RefreshIcon /> : <SettingsIcon />}
          label={`Connection: ${connectionStatus}`}
          color={connectionStatus === "connected" ? "success" : connectionStatus === "error" ? "error" : "default"}
          variant="outlined"
        />
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Method</InputLabel>
                <Select
                  value={filters.method}
                  label="Method"
                  onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                  <MenuItem value="PATCH">PATCH</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success (2xx)</MenuItem>
                  <MenuItem value="error">Error (4xx, 5xx)</MenuItem>
                  <MenuItem value="200">200</MenuItem>
                  <MenuItem value="401">401</MenuItem>
                  <MenuItem value="500">500</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Route"
                size="small"
                fullWidth
                value={filters.route}
                onChange={(e) => setFilters({ ...filters, route: e.target.value })}
                placeholder="e.g. /api/datasource"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search"
                size="small"
                fullWidth
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search URL or body..."
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFilters({ method: "", status: "", route: "", search: "" })}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleClearLogs}
                >
                  Clear Logs
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Total Requests
              </Typography>
              <Typography variant="h6">{logs.length}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Filtered
              </Typography>
              <Typography variant="h6">{filteredLogs.length}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Success Rate
              </Typography>
              <Typography variant="h6">
                {logs.length > 0
                  ? `${Math.round((logs.filter((l) => l.responseStatus >= 200 && l.responseStatus < 300).length / logs.length) * 100)}%`
                  : "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Avg Response Time
              </Typography>
              <Typography variant="h6">
                {logs.length > 0
                  ? `${Math.round(logs.reduce((sum, log) => sum + log.timing, 0) / logs.length)}ms`
                  : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Request Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Timing</TableCell>
                  <TableCell>URL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.method}
                        size="small"
                        color={getMethodColor(log.method)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" component="code">
                        {log.route}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.responseStatus}
                        size="small"
                        color={getStatusColor(log.responseStatus)}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>{log.timing}ms</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.url}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredLogs.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                {logs.length === 0 ? "No requests logged yet" : "No requests match your filters"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Request Details</Typography>
            <IconButton onClick={() => setSelectedLog(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              {/* Request Overview */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Method</Typography>
                      <Chip
                        label={selectedLog.method}
                        color={getMethodColor(selectedLog.method)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Status</Typography>
                      <Chip
                        label={selectedLog.responseStatus}
                        color={getStatusColor(selectedLog.responseStatus)}
                        variant="filled"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Timing</Typography>
                      <Typography>{selectedLog.timing}ms</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Route</Typography>
                      <Typography component="code">{selectedLog.route}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">URL</Typography>
                      <Typography sx={{ wordBreak: "break-all" }}>{selectedLog.url}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Detailed Information */}
              <Tabs value={0}>
                <Tab label="Request" />
                <Tab label="Response" />
                {selectedLog.error && <Tab label="Error" />}
              </Tabs>

              <TabPanel value={0} index={0}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Request Headers</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="pre" sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1, overflow: "auto" }}>
                      {formatJson(selectedLog.requestHeaders)}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {selectedLog.requestBody && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Request Body</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="pre" sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1, overflow: "auto" }}>
                        {formatJson(selectedLog.requestBody)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </TabPanel>

              <TabPanel value={1} index={1}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Response Headers</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="pre" sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1, overflow: "auto" }}>
                      {formatJson(selectedLog.responseHeaders)}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {selectedLog.responseBody && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Response Body</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="pre" sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1, overflow: "auto" }}>
                        {formatJson(selectedLog.responseBody)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </TabPanel>

              {selectedLog.error && (
                <TabPanel value={2} index={2}>
                  <Alert severity="error">
                    <Typography variant="subtitle1">Error Message</Typography>
                    <Typography component="pre">{selectedLog.error}</Typography>
                  </Alert>
                </TabPanel>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}