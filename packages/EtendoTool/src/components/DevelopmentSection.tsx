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
      console.log("Backend no disponible, continuando con polling...");
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
        output: result.output || result.error || "Sin salida",
        success: result.success,
      });
    } catch (err) {
      setGradleOutput({
        command,
        output: err instanceof Error ? err.message : "Error desconocido",
        success: false,
      });
    } finally {
      setGradleExecuting(null);
    }
  }, []);

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
        return { text: "Corriendo", color: "success" as const };
      case "starting":
        return { text: "Iniciando...", color: "warning" as const };
      case "error":
        return { text: "Error", color: "error" as const };
      default:
        return { text: "Detenido", color: "default" as const };
    }
  }, [serverStatus]);

  const isBusy = gradleExecuting !== null || serverStatus === "starting";

  return (
    <Box className="development-section">
      {/* Toolbar Superior */}
      <Paper elevation={0} className="development-toolbar">
        <Stack spacing={2}>
          {/* Control del Servidor */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                Control del Servidor UI:
              </Typography>
              <Chip label={statusLabel.text} color={statusLabel.color} size="small" sx={{ fontWeight: 600 }} />
              {serverStatus === "running" && (
                <Typography variant="body2" color="text.secondary">
                  (localhost:3000)
                </Typography>
              )}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Iniciar servidor UI">
                <span>
                  <IconButton
                    color="primary"
                    onClick={startServer}
                    disabled={serverStatus === "running" || serverStatus === "starting"}>
                    <PlayArrowIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Detener servidor">
                <span>
                  <IconButton color="error" onClick={stopServer} disabled={serverStatus === "stopped"}>
                    <StopIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reiniciar servidor">
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
              <Tooltip title="Abrir en pestaña nueva">
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
            </Stack>
          </Stack>

          <Divider />

          {/* Comandos Gradle */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Comandos Rápidos de Desarrollo (Gradle):
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
                  {gradleExecuting === cmd.id ? "Ejecutando..." : cmd.label}
                </Button>
              ))}
            </Stack>
          </Stack>

          {/* Output de comandos Gradle */}
          {gradleOutput && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Resultado de {gradleOutput.command}:
                </Typography>
                <Tooltip title="Cerrar">
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

      {/* Área del Iframe */}
      <Box className="development-iframe-area">
        {serverStatus === "starting" && !showIframe && (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1, p: 4 }}>
            <LinearProgress sx={{ width: 300 }} />
            <Typography variant="body1" fontWeight={500}>
              Conectando al servidor...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tiempo: {elapsedTime}s | Intento: {connectionAttempts}
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
              Servidor UI no iniciado
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
              Haz clic en el botón de play en la barra superior para iniciar el servidor de desarrollo y cargar la
              interfaz de Etendo.
            </Typography>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={startServer}>
              Iniciar Servidor UI
            </Button>
          </Stack>
        )}

        {showIframe && serverStatus === "running" && (
          <iframe src="http://localhost:3000" title="Etendo UI" className="development-iframe" />
        )}
      </Box>
    </Box>
  );
}
