import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useTheme,
} from "@mui/material";
import { Tag } from "@workspaceui/componentlibrary";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CloseIcon from "@mui/icons-material/Close";
import { executeGradle } from "./api/gradle";
import { useJavaRuntime } from "./hooks/useJavaRuntime";
import type { JavaRuntimeStatus } from "./types/javaRuntime";

const STATUS_COPY: Record<
  JavaRuntimeStatus,
  {
    label: string;
    description: string;
  }
> = {
  installed: {
    label: "Java 17 instalado",
    description: "La API reporto que el runtime esta disponible.",
  },
  installing: {
    label: "Instalacion en progreso",
    description: "La API esta ejecutando Java o instalando el runtime.",
  },
  missing: {
    label: "No instalado",
    description: "El host no tiene Java 17 disponible.",
  },
  unknown: {
    label: "Sin verificar",
    description: "Ejecuta la verificacion para conocer el estado.",
  },
};

const INSTALL_LABEL: Record<JavaRuntimeStatus, string> = {
  installed: "Java 17 listo",
  installing: "Instalando...",
  missing: "Instalar Java 17",
  unknown: "Instalar Java 17",
};

export default function App() {
  const theme = useTheme();
  const { state, loading, error, checkStatus, runJava, skipRequirements, skipped } = useJavaRuntime();
  const [activeStep, setActiveStep] = useState(0);
  const [gradleOutput, setGradleOutput] = useState<string | null>(null);
  const [gradleSuccess, setGradleSuccess] = useState<boolean | null>(null);
  const [javaExecuting, setJavaExecuting] = useState(false);
  const [gradleExecuting, setGradleExecuting] = useState(false);
  const [uiRunning, setUiRunning] = useState(false);
  const [showUiFrame, setShowUiFrame] = useState(false);
  const [uiFullscreen, setUiFullscreen] = useState(false);
  const [uiLaunchTime, setUiLaunchTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const logStyles = useMemo(
    () => (isSuccess?: boolean) => ({
      p: 1.5,
      mt: 1,
      borderColor: isSuccess ? theme.palette.success.main : theme.palette.error.main,
      backgroundColor: isSuccess ? "rgba(0, 128, 0, 0.08)" : "rgba(220, 20, 60, 0.05)",
      color: theme.palette.text.primary,
      whiteSpace: "pre-wrap",
      fontFamily: "ui-monospace, SFMono-Regular, SFMono-Bold, Menlo, Monaco, Consolas",
      fontSize: "0.9rem",
      lineHeight: 1.4,
    }),
    [theme.palette.error.main, theme.palette.success.main, theme.palette.text.primary]
  );

  const statusColors = useMemo(() => {
    switch (state.status) {
      case "installed":
        return { text: theme.palette.success.main, background: theme.palette.success.light };
      case "installing":
        return { text: theme.palette.warning.main, background: theme.palette.warning.light };
      case "missing":
        return { text: theme.palette.error.main, background: theme.palette.error.light };
      default:
        return { text: theme.palette.info.main, background: theme.palette.info.light };
    }
  }, [state.status, theme]);

  const lastCheckedLabel = state.lastCheckedAt ? new Date(state.lastCheckedAt).toLocaleString() : "Pendiente";
  const lastRunLabel = state.lastRunAt ? new Date(state.lastRunAt).toLocaleString() : "Pendiente";

  const disabledInstall = loading;
  const canAdvance = state.available || state.status === "installed";
  const isBusy = loading || javaExecuting || gradleExecuting;

  const goNext = () => {
    if (canAdvance || skipped) {
      setActiveStep(1);
    }
  };

  const resetUiState = () => {
    setShowUiFrame(false);
    setUiLaunchTime(null);
    setUiRunning(false);
    setCountdown(0);
  };

  const handleStopUi = () => {
    setGradleExecuting(false);
    setGradleOutput(null);
    setGradleSuccess(null);
    resetUiState();
    setUiFullscreen(false);
  };

  const handleStartUi = async () => {
    setShowUiFrame(false);
    setUiLaunchTime(Date.now());
    setCountdown(60);
    setUiRunning(true);
    setUiFullscreen(true);

    setGradleExecuting(true);
    try {
      const res = await executeGradle("ui");
      setGradleSuccess(res.success);
      setGradleOutput(res.output || res.error || "Sin salida");
    } catch (err) {
      console.log("Backend no disponible, continuando con el iframe...");
    } finally {
      setGradleExecuting(false);
    }
  };

  const goBack = () => setActiveStep(0);

  // Effect to handle countdown and show iframe after 60 seconds
  useEffect(() => {
    if (uiLaunchTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - uiLaunchTime;
        const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
        setCountdown(remaining);

        if (remaining === 0 && !showUiFrame) {
          setShowUiFrame(true);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [uiLaunchTime, showUiFrame]);

  const renderRequirements = () => (
    <Paper elevation={0} className="status-card">
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}>
          <Box>
            <Typography variant="h6">Paso 1: Requisitos de sistema</Typography>
            <Typography variant="body2" color="text.secondary">
              Verifica Java 17 en modo desarrollo para continuar con EtendoTool.
            </Typography>
          </Box>
          <Tag
            label={STATUS_COPY[state.status].label}
            tagColor={statusColors.background}
            textColor={statusColors.text}
          />
        </Stack>

        {loading ? <LinearProgress /> : null}

        <Divider />

        <div className="info-grid">
          <div>
            <Typography variant="subtitle2" color="text.secondary">
              Version detectada
            </Typography>
            <Typography variant="body1">{state.version ?? "N/D"}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="text.secondary">
              Ultima verificacion
            </Typography>
            <Typography variant="body1">{lastCheckedLabel}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="text.secondary">
              Observacion
            </Typography>
            <Typography variant="body1">{STATUS_COPY[state.status].description}</Typography>
          </div>
        </div>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={checkStatus} disabled={loading}>
            Volver a verificar
          </Button>
          <Button variant="contained" onClick={runJava} disabled={disabledInstall}>
            {INSTALL_LABEL[state.status]}
          </Button>
          <Button variant="outlined" color="inherit" onClick={skipRequirements} disabled={loading}>
            Saltar requisitos
          </Button>
          <Button variant="contained" color="success" onClick={goNext} disabled={!canAdvance && !skipped}>
            Continuar a ejecucion
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );

  const renderUiFullscreen = () => (
    <div className="ui-fullscreen-shell">
      <Box
        className="ui-toolbar"
        sx={{
          height: "15vh",
          minHeight: 120,
          borderBottom: "1px solid #e4e7ec",
          background: "#ffffff",
          px: { xs: 2, md: 3 },
          py: 2,
        }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ height: "100%" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton color="primary" onClick={handleStartUi} disabled={isBusy}>
              <PlayArrowIcon />
            </IconButton>
            <IconButton color="error" onClick={handleStopUi}>
              <StopIcon />
            </IconButton>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                Lanzar UI (gradle ui)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showUiFrame ? "Servidor listo en http://localhost:3000" : `Iniciando servidor... ${countdown}s`}
              </Typography>
            </Stack>
          </Stack>

          <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
            <Typography variant="body2" color="text.secondary">
              Acceso UI local
            </Typography>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 600, color: "#004aca" }}>
              http://localhost:3000
            </a>
            {uiRunning ? (
              <Typography variant="caption" color={showUiFrame ? "success.main" : "warning.main"}>
                {showUiFrame ? "UI en ejecucion" : "Esperando disponibilidad"}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      <Box className="ui-iframe-area">
        {showUiFrame ? (
          <iframe src="http://localhost:3000" title="Etendo UI" className="ui-iframe" />
        ) : (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ height: "100%" }}>
            <LinearProgress sx={{ width: 240 }} />
            <Typography variant="body2" color="text.secondary">
              El iframe se mostrará automáticamente. Tiempo restante {countdown}s.
            </Typography>
          </Stack>
        )}
      </Box>
    </div>
  );

  const renderExecution = () => (
    <Paper elevation={0} className="status-card">
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}>
          <Box>
            <Typography variant="h6">Paso 2: Modo ejecucion (dev)</Typography>
            <Typography variant="body2" color="text.secondary">
              Ejecuta comandos con el backend init-web ya corriendo en tu entorno local.
            </Typography>
          </Box>
          <Tag
            label={canAdvance ? "Listo para ejecutar" : "Falta requisito"}
            tagColor={canAdvance ? theme.palette.success.light : theme.palette.error.light}
            textColor={canAdvance ? theme.palette.success.main : theme.palette.error.main}
          />
        </Stack>

        <Divider />

        <Typography variant="body2" color="text.secondary">
          Usa este paso para validar que Java responde correctamente en modo desarrollo. Las llamadas se realizan a
          `/api` proxied a init-web.
        </Typography>

        {isBusy ? <LinearProgress /> : null}

        {state.output ? (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Salida del comando (ultima ejecucion: {lastRunLabel})
            </Typography>
            <Paper variant="outlined" sx={logStyles(state.success)}>
              {state.output}
            </Paper>
          </Box>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Divider />
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1">Comandos Gradle rapidos</Typography>
          <Chip size="small" label="install" />
          <Chip size="small" label="update.database" />
          <Chip size="small" label="smartbuild" />
          <Chip size="small" label="generate.entities.quick" />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="outlined"
            onClick={async () => {
              setGradleExecuting(true);
              try {
                const res = await executeGradle("install");
                setGradleSuccess(res.success);
                setGradleOutput(res.output || res.error || "Sin salida");
              } finally {
                setGradleExecuting(false);
              }
            }}
            disabled={isBusy}>
            install
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              setGradleExecuting(true);
              try {
                const res = await executeGradle("update.database");
                setGradleSuccess(res.success);
                setGradleOutput(res.output || res.error || "Sin salida");
              } finally {
                setGradleExecuting(false);
              }
            }}
            disabled={isBusy}>
            update.database
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              setGradleExecuting(true);
              try {
                const res = await executeGradle("smartbuild");
                setGradleSuccess(res.success);
                setGradleOutput(res.output || res.error || "Sin salida");
              } finally {
                setGradleExecuting(false);
              }
            }}
            disabled={isBusy}>
            smartbuild
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              setGradleExecuting(true);
              try {
                const res = await executeGradle("generate.entities.quick");
                setGradleSuccess(res.success);
                setGradleOutput(res.output || res.error || "Sin salida");
              } finally {
                setGradleExecuting(false);
              }
            }}
            disabled={isBusy}>
            generate.entities.quick
          </Button>
        </Stack>

        {gradleOutput ? (
          <Paper variant="outlined" sx={logStyles(gradleSuccess ?? undefined)}>
            {gradleOutput}
          </Paper>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={goBack} disabled={isBusy}>
            Volver a requisitos
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setJavaExecuting(true);
              try {
                await runJava();
              } finally {
                setJavaExecuting(false);
              }
            }}
            disabled={isBusy || !canAdvance}>
            Ejecutar comando Java
          </Button>
          <Button variant="outlined" onClick={checkStatus} disabled={isBusy}>
            Refrescar estado
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );

  if (uiFullscreen) {
    return (
      <div className="page page-ui-full">
        {renderUiFullscreen()}
      </div>
    );
  }

  return (
    <div className="page">
      <Container maxWidth="md">
        <Stack spacing={3} className="app-shell">
          <Box>
            <Typography variant="h4" className="title">
              EtendoTool · Wizard de desarrollo
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Paso a paso para validar requisitos (Java 17) y ejecutar comandos en modo desarrollo contra init-web.
            </Typography>
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                border: "1px solid #e4e7ec",
                borderRadius: 2,
                background: "#ffffff",
              }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton color="primary" onClick={handleStartUi} disabled={isBusy}>
                  <PlayArrowIcon />
                </IconButton>
                <Stack spacing={0}>
                  <Typography variant="subtitle2">Lanzar UI (gradle ui)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ejecuta el comando gradle ui y abre el server local.
                  </Typography>
                </Stack>
              </Stack>
              <Stack spacing={0} alignItems="flex-end">
                <Typography variant="body2" color="text.secondary">
                  Acceso UI local
                </Typography>
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontWeight: 600, color: "#004aca" }}>
                  http://localhost:3000
                </a>
                {uiRunning ? (
                  <Typography variant="caption" color="success.main">
                    UI en ejecucion
                  </Typography>
                ) : null}
              </Stack>
            </Paper>

            {!uiFullscreen && uiLaunchTime && (
              <Paper
                elevation={1}
                sx={{
                  mt: 2,
                  p: 2,
                  border: showUiFrame ? "1px solid #4caf50" : "1px solid #2196f3",
                  borderRadius: 2,
                  background: showUiFrame ? "rgba(76, 175, 80, 0.05)" : "rgba(33, 150, 243, 0.05)",
                }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: showUiFrame ? 2 : 0 }}>
                  <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                    {!showUiFrame && <LinearProgress sx={{ width: 200 }} />}
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {showUiFrame ? "✓ UI cargada exitosamente" : `⏳ Iniciando servidor... ${countdown}s`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {showUiFrame ? "Servidor listo en http://localhost:3000" : "El iframe se mostrará automáticamente"}
                      </Typography>
                    </Stack>
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowUiFrame(false);
                      setUiLaunchTime(null);
                      setUiRunning(false);
                      setCountdown(0);
                    }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {showUiFrame && (
                  <Box
                    sx={{
                      width: "100%",
                      height: "70vh",
                      border: "1px solid #e4e7ec",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}>
                    <iframe
                      src="http://localhost:3000"
                      title="Etendo UI"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                    />
                  </Box>
                )}
              </Paper>
            )}
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel>
            {["Requisitos de sistema", "Modo ejecucion"].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 ? renderRequirements() : renderExecution()}
        </Stack>
      </Container>
    </div>
  );
}
