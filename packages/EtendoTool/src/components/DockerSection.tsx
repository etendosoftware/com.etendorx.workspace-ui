import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import RefreshIcon from "@mui/icons-material/Refresh";
import TerminalIcon from "@mui/icons-material/Terminal";
import { dockerApi, type DockerContainer, type DockerResponse } from "../api/docker";

type ContainerView = DockerContainer & { key: string };

const normalizeText = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
};

const parseDockerPsOutput = (raw: string): ContainerView[] => {
  if (!raw) return [];
  const cleaned = raw.replace(/\\n/g, "\n").replace(/^"/, "").replace(/"$/, "");
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  // Detect header alignment; assume first line is header
  const header = lines[0];
  const headerCols = header.split(/\s{2,}/).map((h) => h.toLowerCase());
  const rows = lines.slice(1);
  const containers: ContainerView[] = [];

  rows.forEach((row, idx) => {
    const parts = row.split(/\s{2,}/).filter(Boolean);
    if (parts.length < 2) return;

    const get = (key: string): string | undefined => {
      const index = headerCols.findIndex((h) => h.startsWith(key));
      return index >= 0 ? parts[index] : undefined;
    };

    const name = get("name") || parts[0];
    const image = get("image") || parts[1] || "";
    const command = get("command") || "";
    const service = get("service") || parts[parts.length - 4] || "";
    const created = get("created") || parts[parts.length - 3] || "";
    const status = get("status") || parts[parts.length - 2] || "";
    const ports = get("ports") || parts[parts.length - 1] || "";

    containers.push({
      key: name || `container-${idx}`,
      name,
      service,
      status,
      state: status,
      ports,
      command,
      image,
      created,
    } as ContainerView);
  });

  return containers;
};

const isUpStatus = (value: string | undefined): boolean => {
  if (!value) return false;
  return value.toLowerCase().includes("up");
};

const toContainerList = (rawOutput?: string | unknown): ContainerView[] => {
  if (typeof rawOutput === "string" && rawOutput.includes("NAME") && rawOutput.includes("STATUS")) {
    return parseDockerPsOutput(rawOutput);
  }
  if (Array.isArray((rawOutput as { containers?: unknown[] })?.containers)) {
    const arr = (rawOutput as { containers: DockerContainer[] }).containers;
    return arr.map((item, idx) => ({
      key: item.name || item.service || `container-${idx}`,
      ...item,
    }));
  }
  return [];
};

const pickRawOutput = (payload: unknown): string => {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && typeof (payload as { output?: unknown }).output === "string") {
    return (payload as { output: string }).output;
  }
  return "";
};

export function DockerSection() {
  const [containers, setContainers] = useState<ContainerView[]>([]);
  const [containersRaw, setContainersRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [logsLoading, setLogsLoading] = useState<string | null>(null);
  const [fullscreenLog, setFullscreenLog] = useState<{ service: string; content: string } | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [containersRes] = await Promise.all([dockerApi.listContainers()]);
      if (containersRes.success) {
        const rawText =
          pickRawOutput(containersRes.output) ||
          pickRawOutput(containersRes.data) ||
          normalizeText(containersRes.message) ||
          "";
        setContainers(toContainerList(rawText || containersRes.data));
        setContainersRaw(rawText);
      } else {
        setError(containersRes.error || "Could not fetch the containers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading Docker information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (
    action: () => Promise<DockerResponse<unknown>>,
    label: string,
    service?: string
  ) => {
    setActionLoading(service ? `${label}-${service}` : label);
    setMessage(null);
    setError(null);
    try {
      const res = await action();
      if (res.success) {
        setMessage(res.message || `Action ${label} executed successfully.`);
        await fetchData();
      } else {
        setError(res.error || res.message || `Could not run ${label}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not run ${label}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = useMemo(() => {
    const running = containers.filter((c) => (c.state || c.status || "").toLowerCase().includes("up")).length;
    if (containers.length === 0) return null;
    return `${running}/${containers.length} running`;
  }, [containers]);

  const fetchLogs = async (service: string) => {
    setLogsLoading(service);
    setError(null);
    try {
      const res = await dockerApi.serviceLogs(service);
      if (res.success) {
        const raw =
          pickRawOutput(res.output) || pickRawOutput(res.data) || (typeof res.data === "string" ? res.data : "") || "";
        setLogs((prev) => ({ ...prev, [service]: raw || "No content" }));
        // scroll to the end after setState
        setTimeout(() => {
          const el = document.getElementById(`logs-${service}`);
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        }, 50);
      } else {
        setError(res.error || res.message || `Could not fetch logs for ${service}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not fetch logs for ${service}`);
    } finally {
      setLogsLoading(null);
    }
  };

  return (
    <Box className="section-content">
      <Stack spacing={3}>
        {fullscreenLog && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}>
            <Paper
              sx={{
                width: "100%",
                height: "90vh",
                maxWidth: "1200px",
                p: 2,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#0b1021",
                color: "#e8e8e8",
              }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Logs for {fullscreenLog.service}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchLogs(fullscreenLog.service)}>
                    Refresh
                  </Button>
                  <Button variant="contained" size="small" color="error" onClick={() => setFullscreenLog(null)}>
                    Close
                  </Button>
                </Stack>
              </Stack>
              <Paper
                variant="outlined"
                sx={{ flex: 1, p: 1, backgroundColor: "transparent", color: "inherit", overflow: "auto" }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{fullscreenLog.content}</pre>
              </Paper>
            </Paper>
          </Box>
        )}

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Docker Wrapper
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Docker containers using the REST wrapper exposed by setup.web (compose project: etendo).
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Endpoints: /api/docker/* (start/stop/restart/pull/remove, containers, logs, config).
          </Typography>
        </Box>

        {(error || message) && (
          <Box>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {message && (
              <Alert severity="success" onClose={() => setMessage(null)}>
                {message}
              </Alert>
            )}
          </Box>
        )}

        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e4e7ec" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={actionLoading !== null}
                onClick={() => handleAction(dockerApi.startAll, "resources.up")}>
                Start all (Gradle resources.up)
              </Button>
              <Button
                variant="outlined"
                startIcon={<StopIcon />}
                disabled={actionLoading !== null}
                onClick={() => handleAction(dockerApi.stopAll, "resources.stop")}>
                Stop all (resources.stop)
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                disabled={actionLoading !== null}
                onClick={() => handleAction(dockerApi.restartAll, "resources.restart")}>
                Restart all (resources.restart)
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={actionLoading !== null}
                onClick={() => handleAction(dockerApi.pullAll, "pull")}>
                Pull images
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteSweepIcon />}
                disabled={actionLoading !== null}
                onClick={() => handleAction(dockerApi.removeStopped, "resources.down")}>
                Remove all (resources.down)
              </Button>
              <Button variant="text" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
                Refresh
              </Button>
            </Stack>
            {statusBadge && (
              <Chip
                icon={<TerminalIcon />}
                label={statusBadge}
                color="info"
                variant="outlined"
                sx={{ fontWeight: 600, ml: { md: "auto" } }}
              />
            )}
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="stretch">
          <Paper elevation={0} sx={{ p: 2, flex: 1, border: "1px solid #e4e7ec" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Containers
              </Typography>
              <IconButton size="small" onClick={fetchData} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
              </IconButton>
            </Stack>
            <Divider sx={{ my: 1.5 }} />

            {containers.length > 0 ? (
              <Stack spacing={1.5}>
              {containers.map((c) => (
                <Paper key={c.key} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                    <Stack spacing={0.5} flex={1}>
                      <Typography variant="body1" fontWeight={600}>
                        {c.service || c.name || c.key}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.name}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {c.state && <Chip size="small" label={`Status: ${c.state}`} color={isUpStatus(c.state) ? "success" : "error"} />}
                        {!c.state && c.status && (
                          <Chip size="small" label={c.status} color={isUpStatus(c.status) ? "success" : "error"} />
                        )}
                        {!isUpStatus(c.state || c.status) && <Chip size="small" label="Stopped" color="error" />}
                        {c.ports && <Chip size="small" label={`Ports: ${c.ports}`} />}
                      </Stack>
                    </Stack>
                    {c.service && (
                      <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleAction(() => dockerApi.serviceAction(c.service ?? c.key, "start"), "start", c.service)}
                            disabled={actionLoading !== null}>
                            Start
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<StopIcon />}
                            onClick={() => handleAction(() => dockerApi.serviceAction(c.service ?? c.key, "stop"), "stop", c.service)}
                            disabled={actionLoading !== null}>
                            Stop
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RestartAltIcon />}
                            onClick={() => handleAction(() => dockerApi.serviceAction(c.service ?? c.key, "restart"), "restart", c.service)}
                            disabled={actionLoading !== null}>
                            Restart
                          </Button>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<TerminalIcon />}
                              onClick={() => fetchLogs(c.service ?? c.key)}
                              disabled={logsLoading === c.service}>
                              {logsLoading === c.service ? "Loading logs..." : "Logs"}
                            </Button>
                            {logs[c.service ?? ""] && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  setFullscreenLog({ service: c.service ?? c.key, content: logs[c.service ?? ""] || "" })
                                }>
                                View fullscreen
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      )}
                    </Stack>
                    {logs[c.service ?? ""] && (
                      <Paper
                        variant="outlined"
                        sx={{
                          mt: 1,
                          p: 1,
                          backgroundColor: "#0b1021",
                          color: "#e8e8e8",
                          fontFamily: "monospace",
                        }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Logs for {c.service}:
                        </Typography>
                        <pre
                          id={`logs-${c.service}`}
                          style={{ margin: 0, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
                          {logs[c.service ?? ""]}
                        </pre>
                      </Paper>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {loading ? "Loading containers..." : "No containers found for etendo."}
              </Typography>
            )}

            {containersRaw && (
              <Box sx={{ mt: 2 }}>
                <Button size="small" variant="text" onClick={() => setShowRaw((v) => !v)}>
                  {showRaw ? "Hide raw output" : "Show raw output"}
                </Button>
                {showRaw && (
                  <Paper
                    variant="outlined"
                    sx={{ mt: 1, p: 1, backgroundColor: "#0b1021", color: "#e8e8e8", fontFamily: "monospace" }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{containersRaw}</pre>
                  </Paper>
                )}
              </Box>
            )}
          </Paper>

          {/* Docker compose config section temporarily hidden */}
        </Stack>
      </Stack>
    </Box>
  );
}
