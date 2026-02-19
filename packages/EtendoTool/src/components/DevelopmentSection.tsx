import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import StorageIcon from "@mui/icons-material/Storage";
import BuildIcon from "@mui/icons-material/Build";
import DataObjectIcon from "@mui/icons-material/DataObject";
import { executeGradle } from "../api/gradle";

type ServerStatus = "stopped" | "starting" | "running" | "error";

const GRADLE_COMMANDS = [
  {
    id: "update.database",
    label: "Update Database",
    description: "Sync schema and apply pending migrations",
    icon: <StorageIcon />,
    color: "primary" as const,
  },
  {
    id: "smartbuild",
    label: "Smartbuild",
    description: "Compile and deploy only changed modules",
    icon: <BuildIcon />,
    color: "secondary" as const,
  },
  {
    id: "generate.entities.quick",
    label: "Generate Entities",
    description: "Regenerate Java entity classes from data model",
    icon: <DataObjectIcon />,
    color: "info" as const,
  },
];

export function DevelopmentSection() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>("stopped");
  const [showIframe, setShowIframe] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [gradleExecuting, setGradleExecuting] = useState<string | null>(null);
  const [gradleOutput, setGradleOutput] = useState<{ command: string; output: string; success: boolean } | null>(null);
  const [showOutput, setShowOutput] = useState(false);


  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    try {
      await fetch("http://localhost:3000", { method: "HEAD", mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  }, []);

  const startServer = useCallback(async () => {
    setServerStatus("starting");
    setShowIframe(false);
    setConnectionAttempts(0);
    setElapsedTime(0);
    setIsPolling(true);

    try {
      await executeGradle("ui");
    } catch {
      console.log("Backend not available, continuing to poll...");
    }
  }, []);

  const stopServer = useCallback(() => {
    setServerStatus("stopped");
    setShowIframe(false);
    setIsPolling(false);
    setConnectionAttempts(0);
    setElapsedTime(0);
  }, []);

  const executeCommand = useCallback(async (command: string) => {
    setGradleExecuting(command);
    setGradleOutput(null);
    setShowOutput(false);

    try {
      const result = await executeGradle(command);
      setGradleOutput({
        command,
        output: result.output || result.error || "No output",
        success: result.success,
      });
      setShowOutput(true);
    } catch (err) {
      setGradleOutput({
        command,
        output: err instanceof Error ? err.message : "Unknown error",
        success: false,
      });
    } finally {
      setGradleExecuting(null);
    }
  }, []);

  // Check if the server is already running (e.g., when returning to the section)
  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      const isUp = await checkServerHealth();
      if (cancelled) return;
      if (isUp) {
        setServerStatus("running");
        setShowIframe(true);
        setIsPolling(false);
      } else {
        setServerStatus("stopped");
        setShowIframe(false);
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [checkServerHealth]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || showIframe) return;

    let cancelled = false;
    const pollInterval = 2000;

    const poll = async () => {
      if (cancelled) return;

      setConnectionAttempts((prev) => prev + 1);
      setElapsedTime((prev) => prev + 2);

      const isUp = await checkServerHealth();

      if (isUp && !cancelled) {
        setShowIframe(true);
        setServerStatus("running");
        setIsPolling(false);
      } else if (!cancelled) {
        setTimeout(poll, pollInterval);
      }
    };

    const timeoutId = setTimeout(poll, pollInterval);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isPolling, showIframe, checkServerHealth]);

  const statusLabel = {
    running:  { text: "Running",    color: "success" as const },
    starting: { text: "Starting...", color: "warning" as const },
    error:    { text: "Error",      color: "error"   as const },
    stopped:  { text: "Stopped",    color: "error"   as const },
  }[serverStatus];

  const isBusy = gradleExecuting !== null || serverStatus === "starting";

  return (
    <Box className="development-section">
      {/* Top toolbar — single line with sections */}
      <Paper elevation={0} className="development-toolbar">
        <Stack direction="row" alignItems="center" spacing={1}>

          {/* ── Section: Server status ── */}
          <Typography variant="body2" fontWeight={700} noWrap>Server</Typography>
          <Chip
            label={statusLabel.text}
            color={statusLabel.color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          {serverStatus === "running" && (
            <Typography variant="caption" color="text.secondary" noWrap>:3000</Typography>
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* ── Section: Server controls ── */}
          <Button variant="outlined" size="small" startIcon={<PlayArrowIcon />}
            onClick={startServer} disabled={serverStatus === "running" || serverStatus === "starting"}>
            Start
          </Button>
          <Button variant="outlined" color="error" size="small" startIcon={<StopIcon />}
            onClick={stopServer} disabled={serverStatus === "stopped"}>
            Stop
          </Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
            onClick={() => { stopServer(); setTimeout(startServer, 500); }}
            disabled={serverStatus !== "running"}>
            Restart
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* ── Section: Gradle commands ── */}
          {GRADLE_COMMANDS.map((cmd) => {
            const result = gradleOutput?.command === cmd.id ? gradleOutput : null;
            const resultColor = result ? (result.success ? "success" : "error") : cmd.color;
            return (
              <Tooltip key={cmd.id} title={cmd.description} placement="bottom">
                <span>
                  <Button
                    variant={result ? "contained" : "outlined"}
                    color={resultColor}
                    size="small"
                    startIcon={gradleExecuting === cmd.id ? undefined : cmd.icon}
                    onClick={() => executeCommand(cmd.id)}
                    disabled={isBusy}
                    sx={{ fontWeight: 600, minWidth: 0 }}>
                    {gradleExecuting === cmd.id ? <LinearProgress sx={{ width: 60, height: 2 }} /> : cmd.label}
                  </Button>
                </span>
              </Tooltip>
            );
          })}

          <Box sx={{ flex: 1 }} />

          {/* ── Section: Utility actions ── */}
          <Tooltip title="Open in new tab">
            <span>
              <IconButton component="a" href="http://localhost:3000" target="_blank"
                rel="noreferrer" size="small" disabled={serverStatus !== "running"}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* ── Result bar — appears below the toolbar row when a command has run ── */}
        {gradleOutput && (
          <Box
            sx={{
              mt: 1.5,
              pl: 1.5,
              py: 0.5,
              borderLeft: `3px solid ${gradleOutput.success ? "#4caf50" : "#f44336"}`,
              borderRadius: "0 4px 4px 0",
              backgroundColor: gradleOutput.success ? "rgba(76,175,80,0.05)" : "rgba(244,67,54,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "monospace",
                color: gradleOutput.success ? "#2e7d32" : "#c62828",
                fontWeight: 600,
                cursor: "pointer",
                flex: 1,
              }}
              onClick={() => setShowOutput((v) => !v)}>
              {gradleOutput.success ? "✓" : "✗"} {gradleOutput.command}
              {showOutput ? " ▴" : " ▾"}
            </Typography>
            <IconButton size="small" onClick={() => setGradleOutput(null)} sx={{ p: 0.25 }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}

        {/* ── Expanded output ── */}
        {gradleOutput && showOutput && (
          <Box
            sx={{
              mx: 0,
              mt: 0.5,
              pl: 1.5,
              py: 0.75,
              borderLeft: `3px solid ${gradleOutput.success ? "#4caf50" : "#f44336"}`,
              borderRadius: "0 4px 4px 0",
              backgroundColor: gradleOutput.success ? "rgba(76,175,80,0.04)" : "rgba(244,67,54,0.04)",
              fontFamily: "monospace",
              fontSize: "0.72rem",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              maxHeight: 140,
              overflow: "auto",
            }}>
            {gradleOutput.output}
          </Box>
        )}
      </Paper>

      {/* Iframe area */}
      <Box className="development-iframe-area">
        {serverStatus === "starting" && !showIframe && (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1, p: 4 }}>
            <LinearProgress sx={{ width: 300 }} />
            <Typography variant="body1" fontWeight={500} sx={{ color: "rgba(255,255,255,0.9)" }}>
              Connecting to Etendo Application Server...
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)" }}>
              Time: {elapsedTime}s | Attempt: {connectionAttempts}
            </Typography>
          </Stack>
        )}

        {serverStatus === "stopped" && (
          <Stack alignItems="center" justifyContent="center" spacing={3} sx={{ flex: 1, p: 4 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <PlayArrowIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.35)" }} />
            </Box>
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.9)" }}>
              Etendo Application Server is not running
            </Typography>
            <Typography variant="body2" textAlign="center" sx={{ color: "rgba(255,255,255,0.55)", maxWidth: 400 }}>
              Start the server to load the Etendo UI in this panel. The server runs on port 3000.
            </Typography>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={startServer}>
              Start Server
            </Button>
          </Stack>
        )}

        {showIframe && serverStatus === "running" && (
          <iframe
            src="http://localhost:3000"
            title="Etendo UI"
            className="development-iframe"
          />
        )}
      </Box>

    </Box>
  );
}
