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
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StorageIcon from "@mui/icons-material/Storage";
import BuildIcon from "@mui/icons-material/Build";
import DataObjectIcon from "@mui/icons-material/DataObject";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { executeGradle } from "../api/gradle";
import { useScreenshot } from "../hooks/useScreenshot";
import { ScreenshotManager } from "./ScreenshotManager";

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
  const [showScreenshotManager, setShowScreenshotManager] = useState(false);
  const [screenshotSuccess, setScreenshotSuccess] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const { captureScreenshot, isCapturing, error: screenshotError, setIframeRef } = useScreenshot();


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

    try {
      const result = await executeGradle(command);
      setGradleOutput({
        command,
        output: result.output || result.error || "No output",
        success: result.success,
      });
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

  const handleCaptureScreenshot = useCallback(async () => {
    setMoreMenuAnchor(null);
    try {
      await captureScreenshot();
      setScreenshotSuccess(true);
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
    }
  }, [captureScreenshot]);

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
      {/* Top toolbar */}
      <Paper elevation={0} className="development-toolbar">
        <Stack spacing={1.5}>

          {/* ── Row 1: Server controls ── */}
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mr: 0.5 }}>
              Server
            </Typography>
            <Chip label={statusLabel.text} color={statusLabel.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            {serverStatus === "running" && (
              <Typography variant="caption" color="text.secondary">localhost:3000</Typography>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={startServer}
              disabled={serverStatus === "running" || serverStatus === "starting"}>
              Start
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<StopIcon />}
              onClick={stopServer}
              disabled={serverStatus === "stopped"}>
              Stop
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => { stopServer(); setTimeout(startServer, 500); }}
              disabled={serverStatus !== "running"}>
              Restart
            </Button>
            <Tooltip title="Open in new tab">
              <span>
                <IconButton
                  component="a"
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                  disabled={serverStatus !== "running"}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="More options">
              <IconButton size="small" onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Divider />

          {/* ── Row 2: Gradle commands + result bars ── */}
          <Stack direction="row" alignItems="flex-start" spacing={1} flexWrap="wrap">
            {GRADLE_COMMANDS.map((cmd) => {
              const isRunning = gradleExecuting === cmd.id;
              const result = gradleOutput?.command === cmd.id ? gradleOutput : null;
              const borderColor = result
                ? result.success
                  ? "#4caf50"
                  : "#f44336"
                : "transparent";
              const bgColor = result
                ? result.success
                  ? "rgba(76,175,80,0.06)"
                  : "rgba(244,67,54,0.06)"
                : "transparent";

              return (
                <Stack key={cmd.id} spacing={0.5} sx={{ width: "auto" }}>
                  <Tooltip title={cmd.description} placement="bottom">
                    <span>
                      <Button
                        variant="outlined"
                        color={cmd.color}
                        size="small"
                        startIcon={cmd.icon}
                        onClick={() => executeCommand(cmd.id)}
                        disabled={isBusy}
                        sx={{ fontWeight: 600 }}>
                        {isRunning ? "Running..." : cmd.label}
                      </Button>
                    </span>
                  </Tooltip>

                  {/* Result bar */}
                  <Box
                    sx={{
                      borderLeft: `3px solid ${result ? borderColor : "#e0e0e0"}`,
                      borderRadius: "0 4px 4px 0",
                      backgroundColor: result ? bgColor : "#fafafa",
                      px: 1,
                      py: 0.5,
                      minHeight: 28,
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      cursor: result ? "pointer" : "default",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => result && setGradleOutput(result.command === gradleOutput?.command ? null : result)}>
                    {isRunning ? (
                      <LinearProgress sx={{ width: "100%", height: 2 }} />
                    ) : result ? (
                      <Typography
                        variant="caption"
                        sx={{
                          color: result.success ? "#2e7d32" : "#c62828",
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}>
                        {result.success ? "✓ OK" : "✗ Failed"}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: "#bdbdbd", fontSize: "0.7rem" }}>
                        not run
                      </Typography>
                    )}
                  </Box>

                  {/* Expanded output */}
                  {gradleOutput?.command === cmd.id && gradleOutput !== null && (
                    <Box
                      sx={{
                        borderLeft: `3px solid ${borderColor}`,
                        borderRadius: "0 4px 4px 0",
                        backgroundColor: bgColor,
                        px: 1,
                        py: 0.75,
                        fontFamily: "monospace",
                        fontSize: "0.72rem",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        maxHeight: 140,
                        overflow: "auto",
                        color: "text.primary",
                      }}>
                      {gradleOutput.output}
                    </Box>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </Paper>

      {/* More options menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        <MenuItem
          onClick={handleCaptureScreenshot}
          disabled={serverStatus !== "running" || isCapturing}>
          <ListItemIcon>
            <CameraAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Capture screenshot" secondary="Save current UI state" />
        </MenuItem>
        <MenuItem onClick={() => { setMoreMenuAnchor(null); setShowScreenshotManager(true); }}>
          <ListItemIcon>
            <PhotoLibraryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View screenshots" secondary="Browse saved captures" />
        </MenuItem>
      </Menu>

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
            ref={setIframeRef}
            src="http://localhost:3000"
            title="Etendo UI"
            className="development-iframe"
          />
        )}
      </Box>

      {/* Screenshot Manager Dialog */}
      <ScreenshotManager open={showScreenshotManager} onClose={() => setShowScreenshotManager(false)} />

      {/* Success Snackbar */}
      <Snackbar
        open={screenshotSuccess}
        autoHideDuration={3000}
        onClose={() => setScreenshotSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setScreenshotSuccess(false)} severity="success" sx={{ width: "100%" }}>
          Screenshot captured successfully!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!screenshotError}
        autoHideDuration={5000}
        onClose={() => {}}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="error" sx={{ width: "100%" }}>
          {screenshotError || "Failed to capture screenshot"}
        </Alert>
      </Snackbar>
    </Box>
  );
}
