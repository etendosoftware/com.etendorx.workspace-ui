import { useState, useEffect, useMemo, useCallback } from "react";
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
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import StorageIcon from "@mui/icons-material/Storage";
import BuildIcon from "@mui/icons-material/Build";
import DataObjectIcon from "@mui/icons-material/DataObject";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import { executeGradle } from "../api/gradle";
import { useScreenshot } from "../hooks/useScreenshot";
import { ScreenshotManager } from "./ScreenshotManager";

type ServerStatus = "stopped" | "starting" | "running" | "error";

const GRADLE_COMMANDS = [
  { id: "update.database", label: "UPDATE.DATABASE", icon: <StorageIcon />, color: "primary" as const },
  { id: "smartbuild", label: "SMARTBUILD", icon: <BuildIcon />, color: "secondary" as const },
  { id: "generate.entities.quick", label: "GENERATE.ENTITIES.QUICK", icon: <DataObjectIcon />, color: "info" as const },
];

export function DevelopmentSection() {
  const theme = useTheme();
  const [serverStatus, setServerStatus] = useState<ServerStatus>("stopped");
  const [showIframe, setShowIframe] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [gradleExecuting, setGradleExecuting] = useState<string | null>(null);
  const [gradleOutput, setGradleOutput] = useState<{ command: string; output: string; success: boolean } | null>(null);
  const [showScreenshotManager, setShowScreenshotManager] = useState(false);
  const [screenshotSuccess, setScreenshotSuccess] = useState(false);
  const { captureScreenshot, isCapturing, error: screenshotError, setIframeRef } = useScreenshot();

  const logStyles = useMemo(
    () => ({
      p: 1.5,
      mt: 1,
      borderRadius: 1,
      border: `1px solid ${gradleOutput?.success ? theme.palette.success.main : theme.palette.error.main}`,
      backgroundColor: gradleOutput?.success ? "rgba(76, 175, 80, 0.05)" : "rgba(244, 67, 54, 0.05)",
      color: theme.palette.text.primary,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "0.85rem",
      lineHeight: 1.5,
      whiteSpace: "pre-wrap" as const,
      maxHeight: "150px",
      overflow: "auto",
    }),
    [theme, gradleOutput]
  );

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

  const statusLabel = useMemo(() => {
    switch (serverStatus) {
      case "running":
        return { text: "Running", color: "success" as const };
      case "starting":
        return { text: "Starting...", color: "warning" as const };
      case "error":
        return { text: "Error", color: "error" as const };
      default:
        return { text: "Stopped", color: "default" as const };
    }
  }, [serverStatus]);

  const isBusy = gradleExecuting !== null || serverStatus === "starting";

  return (
    <Box className="development-section">
      {/* Top toolbar */}
      <Paper elevation={0} className="development-toolbar">
        <Stack spacing={2}>
          {/* Server Controls */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                UI Server Control:
              </Typography>
              <Chip label={statusLabel.text} color={statusLabel.color} size="small" sx={{ fontWeight: 600 }} />
              {serverStatus === "running" && (
                <Typography variant="body2" color="text.secondary">
                  (localhost:3000)
                </Typography>
              )}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Start UI server">
                <span>
                  <IconButton
                    color="primary"
                    onClick={startServer}
                    disabled={serverStatus === "running" || serverStatus === "starting"}>
                    <PlayArrowIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Stop server">
                <span>
                  <IconButton color="error" onClick={stopServer} disabled={serverStatus === "stopped"}>
                    <StopIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Restart server">
                <span>
                  <IconButton
                    onClick={() => {
                      stopServer();
                      setTimeout(startServer, 500);
                    }}
                    disabled={serverStatus !== "running"}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Open in new tab">
                <span>
                  <IconButton
                    component="a"
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    disabled={serverStatus !== "running"}>
                    <OpenInNewIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Tooltip title="Capture screenshot">
                <span>
                  <IconButton
                    color="secondary"
                    onClick={handleCaptureScreenshot}
                    disabled={serverStatus !== "running" || isCapturing}>
                    <CameraAltIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="View screenshots">
                <span>
                  <IconButton color="info" onClick={() => setShowScreenshotManager(true)}>
                    <PhotoLibraryIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider />

          {/* Gradle commands */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Quick Development Commands (Gradle):
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              {GRADLE_COMMANDS.map((cmd) => (
                <Button
                  key={cmd.id}
                  variant="outlined"
                  color={cmd.color}
                  startIcon={cmd.icon}
                  onClick={() => executeCommand(cmd.id)}
                  disabled={isBusy}
                  sx={{
                    fontWeight: 600,
                    borderWidth: 2,
                    "&:hover": { borderWidth: 2 },
                  }}>
                  {gradleExecuting === cmd.id ? "Running..." : cmd.label}
                </Button>
              ))}
            </Stack>
          </Stack>

          {/* Gradle command output */}
          {gradleOutput && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Result of {gradleOutput.command}:
                </Typography>
                <Tooltip title="Close">
                  <IconButton size="small" onClick={() => setGradleOutput(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Paper variant="outlined" sx={logStyles}>
                {gradleOutput.output}
              </Paper>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Iframe area */}
      <Box className="development-iframe-area">
        {serverStatus === "starting" && !showIframe && (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1, p: 4 }}>
            <LinearProgress sx={{ width: 300 }} />
            <Typography variant="body1" fontWeight={500}>
              Connecting to the server...
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <PlayArrowIcon sx={{ fontSize: 48, color: "#999" }} />
            </Box>
            <Typography variant="h6" color="text.secondary">
              UI server not started
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
              Click the play button in the top bar to start the development server and load the Etendo UI.
            </Typography>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={startServer}>
              Start UI Server
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
