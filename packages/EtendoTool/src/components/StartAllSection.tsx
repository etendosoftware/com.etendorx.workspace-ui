import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  FormControlLabel,
  Typography,
  useTheme,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import StorageIcon from "@mui/icons-material/Storage";
import BuildIcon from "@mui/icons-material/Build";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CloudIcon from "@mui/icons-material/Cloud";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEnvironment } from "../hooks/useEnvironment";
import { executeGradle } from "../api/gradle";
import { dockerApi } from "../api/docker";
import { fetchSetupStatus, type SetupStatus } from "../api/setup";

type StepStatus = "pending" | "running" | "success" | "error" | "skipped";

interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  command: string;
  isDocker?: boolean;
  optional?: boolean;
}

interface StepState {
  status: StepStatus;
  output: string;
  error?: string;
}

const ALL_STEPS: SetupStep[] = [
  {
    id: "docker-up",
    label: "Start Docker Services",
    description: "Start PostgreSQL and other required containers",
    icon: <CloudIcon />,
    command: "resources.up",
    isDocker: true,
  },
  {
    id: "install",
    label: "Install Database",
    description: "Create database schema and initial data",
    icon: <StorageIcon />,
    command: "install",
  },
  {
    id: "smartbuild",
    label: "Compile Application",
    description: "Build the Etendo application",
    icon: <BuildIcon />,
    command: "smartbuild",
  },
  {
    id: "tomcat",
    label: "Start Tomcat",
    description: "Start the application server",
    icon: <RocketLaunchIcon />,
    command: "ui",
  },
];

// ─── Pre-flight status banner ────────────────────────────────────────────────

interface StatusBannerProps {
  status: SetupStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function ServiceChip({
  label,
  ok,
  warning,
  tooltip,
}: {
  label: string;
  ok: boolean;
  warning?: boolean;
  tooltip?: string;
}) {
  const chip = (
    <Chip
      size="small"
      icon={ok ? <CheckCircleIcon /> : warning ? <WarningAmberIcon /> : <ErrorIcon />}
      label={label}
      color={ok ? "success" : warning ? "warning" : "error"}
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top" arrow>
        <span>{chip}</span>
      </Tooltip>
    );
  }
  return chip;
}

function PreFlightBanner({ status, loading, error, onRefresh }: StatusBannerProps) {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "#f8fafc",
        }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Checking environment status...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert
        severity="warning"
        action={
          <Button size="small" startIcon={<RefreshIcon />} onClick={onRefresh}>
            Retry
          </Button>
        }>
        Could not load pre-flight status: {error}
      </Alert>
    );
  }

  if (!status) return null;

  const { docker, postgres, tomcat, warnings } = status;

  // Docker chip label
  const dockerLabel = docker.running
    ? docker.hasContainers
      ? "Docker: running"
      : "Docker: running (no containers)"
    : "Docker: stopped";

  const dockerOk = docker.running;
  const dockerWarn = !docker.running && !docker.hasComposeFile;

  // Postgres chip label
  const pgLabel = postgres.connected
    ? `PostgreSQL: connected (${postgres.via})`
    : `PostgreSQL: not connected`;

  // Tomcat chip
  const tomcatLabel = tomcat.running
    ? tomcat.needsRestart
      ? `Tomcat: restart needed (${tomcat.via})`
      : `Tomcat: running (${tomcat.via})`
    : "Tomcat: not running";

  const tomcatWarn = tomcat.running && tomcat.needsRestart;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "#f8fafc",
      }}>
      <Stack spacing={1.5}>
        {/* Header row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <InfoOutlinedIcon sx={{ color: "#004aca", fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#004aca" }}>
              Pre-Flight Status
            </Typography>
          </Stack>
          <Button
            size="small"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={onRefresh}
            sx={{ fontSize: "0.75rem", minWidth: 0, px: 1 }}>
            Refresh
          </Button>
        </Stack>

        {/* Service chips */}
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <ServiceChip
            label={dockerLabel}
            ok={dockerOk}
            warning={dockerWarn}
            tooltip={
              docker.running && docker.containers.length > 0
                ? `Running containers: ${docker.containers.join(", ")}`
                : docker.running
                  ? "Docker is running but no Etendo containers are active."
                  : "Docker daemon is not running. Start Docker Desktop or the Docker service."
            }
          />

          <ServiceChip
            label={pgLabel}
            ok={postgres.connected}
            tooltip={
              postgres.connected
                ? `Connected to ${postgres.url}/${postgres.sid}`
                : postgres.url
                  ? `Cannot reach ${postgres.url}/${postgres.sid}. Check that PostgreSQL is running and credentials in gradle.properties are correct.`
                  : "No bbdd.url found in gradle.properties."
            }
          />

          <ServiceChip
            label={tomcatLabel}
            ok={tomcat.running && !tomcat.needsRestart}
            warning={tomcatWarn}
            tooltip={
              tomcat.running && tomcat.needsRestart
                ? "The application was compiled after Tomcat last started. A restart is recommended."
                : tomcat.running
                  ? `Tomcat is responding on port ${tomcat.port}`
                  : `Tomcat is not listening on port ${tomcat.port}. The 'Start Tomcat' step will start it.`
            }
          />
        </Stack>

        {/* Context-sensitive advice */}
        {!docker.running && !docker.hasContainers && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="body2">
              Docker is not running and no containers were found. If you are using locally installed PostgreSQL and
              Tomcat, Docker is not required.
            </Typography>
          </Alert>
        )}

        {tomcat.needsRestart && (
          <Alert
            severity="warning"
            sx={{ py: 0.5 }}
            icon={<WarningAmberIcon fontSize="small" />}>
            <Typography variant="body2">
              <strong>Restart recommended:</strong> The application was compiled after Tomcat last started. Run{" "}
              <strong>smartbuild</strong> then restart Tomcat to apply the latest changes.
            </Typography>
          </Alert>
        )}

        {!postgres.connected && postgres.url && (
          <Alert severity="error" sx={{ py: 0.5 }}>
            <Typography variant="body2">
              PostgreSQL is not reachable at{" "}
              <code>
                {postgres.url}/{postgres.sid}
              </code>
              . Verify the database is running and that the credentials in <code>gradle.properties</code> are correct.
            </Typography>
          </Alert>
        )}

        {/* Generic warnings from backend */}
        {warnings.length > 0 &&
          warnings
            .filter((w) => {
              // Suppress duplicates already shown as specific alerts above
              if (!docker.running && !docker.hasContainers && w.toLowerCase().includes("docker is not running"))
                return false;
              if (!postgres.connected && w.toLowerCase().includes("postgresql is not reachable")) return false;
              if (tomcat.needsRestart && w.toLowerCase().includes("tomcat may need")) return false;
              return true;
            })
            .map((w, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static warning list
              <Alert key={i} severity="warning" sx={{ py: 0.5 }}>
                <Typography variant="body2">{w}</Typography>
              </Alert>
            ))}
      </Stack>
    </Paper>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StartAllSection() {
  const theme = useTheme();
  const { environment, isLoading: envLoading } = useEnvironment();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [includeDockerStep, setIncludeDockerStep] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

  // Pre-flight status state
  const [preflightStatus, setPreflightStatus] = useState<SetupStatus | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  const loadPreflightStatus = useCallback(async () => {
    setPreflightLoading(true);
    setPreflightError(null);
    try {
      const data = await fetchSetupStatus();
      setPreflightStatus(data);
    } catch (err) {
      setPreflightError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPreflightLoading(false);
    }
  }, []);

  // Load pre-flight status on mount
  useEffect(() => {
    void loadPreflightStatus();
  }, [loadPreflightStatus]);

  // Determine which steps to show based on environment and properties
  const steps = useMemo(() => {
    let filtered = ALL_STEPS;
    if (environment?.isDevContainer) {
      // In DevContainer, skip Docker step by default (already running)
      filtered = filtered.filter((step) => !step.isDocker || includeDockerStep);
    }
    // If UI is dockerized, skip startUINodeTask — Docker already started it via resources.up
    if (preflightStatus?.uiDockerized) {
      filtered = filtered.filter((step) => step.id !== "tomcat");
    }
    return filtered;
  }, [environment, includeDockerStep, preflightStatus]);

  const isDevContainer = environment?.isDevContainer ?? false;

  const logStyles = useMemo(
    () => ({
      p: 2,
      mt: 1,
      borderRadius: 1,
      backgroundColor: "#1e1e1e",
      color: "#d4d4d4",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "0.8rem",
      lineHeight: 1.5,
      whiteSpace: "pre-wrap" as const,
      maxHeight: "200px",
      overflow: "auto",
    }),
    []
  );

  const executeStep = useCallback(async (step: SetupStep): Promise<{ success: boolean; output: string }> => {
    if (step.isDocker) {
      // Use Docker API for docker commands
      const result = await dockerApi.startAll();
      return {
        success: result.success,
        output: result.output || result.message || result.error || "",
      };
    } else {
      // Use Gradle API for gradle commands
      const result = await executeGradle(step.command);
      return {
        success: result.success,
        output: result.output || result.error || "",
      };
    }
  }, []);

  const runAllSteps = useCallback(async () => {
    setIsRunning(true);
    setStepStates({});
    setCurrentStepIndex(0);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStepIndex(i);

      // Mark step as running
      setStepStates((prev) => ({
        ...prev,
        [step.id]: { status: "running", output: `Starting ${step.label}...\n` },
      }));

      try {
        const result = await executeStep(step);

        setStepStates((prev) => ({
          ...prev,
          [step.id]: {
            status: result.success ? "success" : "error",
            output: result.output,
            error: result.success ? undefined : result.output,
          },
        }));

        // If step failed, stop execution
        if (!result.success) {
          setIsRunning(false);
          return;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setStepStates((prev) => ({
          ...prev,
          [step.id]: {
            status: "error",
            output: errorMessage,
            error: errorMessage,
          },
        }));
        setIsRunning(false);
        return;
      }
    }

    setCurrentStepIndex(steps.length);
    setIsRunning(false);
    // Refresh pre-flight status after all steps complete
    void loadPreflightStatus();
  }, [steps, executeStep, loadPreflightStatus]);

  const getStepIcon = (stepId: string, index: number) => {
    const state = stepStates[stepId];
    if (!state) {
      return index <= currentStepIndex ? <PendingIcon /> : undefined;
    }
    switch (state.status) {
      case "success":
        return <CheckCircleIcon sx={{ color: "success.main" }} />;
      case "error":
        return <ErrorIcon sx={{ color: "error.main" }} />;
      case "running":
        return <PendingIcon sx={{ color: "primary.main" }} />;
      case "skipped":
        return <PendingIcon sx={{ color: "text.secondary" }} />;
      default:
        return undefined;
    }
  };

  const allCompleted = steps.every((step) => stepStates[step.id]?.status === "success");
  const hasError = steps.some((step) => stepStates[step.id]?.status === "error");

  if (envLoading) {
    return (
      <Box className="section-content">
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 4 }}>
          <LinearProgress sx={{ width: 200 }} />
          <Typography color="text.secondary">Detecting environment...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box className="section-content">
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Start All - Quick Setup
            </Typography>
            <Chip
              icon={isDevContainer ? <CloudIcon /> : <SettingsIcon />}
              label={isDevContainer ? "DevContainer Mode" : "Local Mode"}
              color={isDevContainer ? "info" : "default"}
              variant="outlined"
              size="small"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Execute all required steps sequentially to set up your Etendo environment.
            {isDevContainer && " Docker services are managed by DevContainer."}
          </Typography>
        </Box>

        {/* Pre-Flight Status Banner */}
        <PreFlightBanner
          status={preflightStatus}
          loading={preflightLoading}
          error={preflightError}
          onRefresh={loadPreflightStatus}
        />

        {/* Environment Info Alert */}
        {isDevContainer && (
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              <strong>DevContainer Detected:</strong> Docker services are already running in your container environment.
              The "Start Docker Services" step is optional and disabled by default.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={includeDockerStep}
                  onChange={(e) => setIncludeDockerStep(e.target.checked)}
                  disabled={isRunning}
                />
              }
              label="Include Docker step anyway"
              sx={{ mt: 1 }}
            />
          </Alert>
        )}

        {/* Stepper */}
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stepper activeStep={currentStepIndex} orientation="vertical">
            {steps.map((step, index) => {
              const state = stepStates[step.id];
              return (
                <Step key={step.id} completed={state?.status === "success"}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            state?.status === "success"
                              ? "success.light"
                              : state?.status === "error"
                                ? "error.light"
                                : state?.status === "running"
                                  ? "primary.light"
                                  : "grey.200",
                        }}>
                        {getStepIcon(step.id, index) || step.icon}
                      </Box>
                    )}
                    error={state?.status === "error"}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={600}>{step.label}</Typography>
                      {state?.status === "running" && (
                        <Chip label="Running..." size="small" color="primary" />
                      )}
                      {state?.status === "success" && (
                        <Chip label="Completed" size="small" color="success" />
                      )}
                      {state?.status === "error" && (
                        <Chip label="Failed" size="small" color="error" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Paper>

        {/* Action Button */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            size="large"
            startIcon={isRunning ? undefined : <PlayArrowIcon />}
            onClick={runAllSteps}
            disabled={isRunning}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(0, 74, 202, 0.4)",
            }}>
            {isRunning ? "Running..." : "START ALL"}
          </Button>
          {isRunning && <LinearProgress sx={{ flex: 1 }} />}
        </Stack>

        {/* Output Section */}
        {Object.keys(stepStates).length > 0 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={600}>
                Execution Log
              </Typography>
              <Button size="small" onClick={() => setShowOutput(!showOutput)}>
                {showOutput ? "Hide Output" : "Show Output"}
              </Button>
            </Stack>
            <Collapse in={showOutput}>
              <Paper sx={logStyles}>
                {steps.map((step) => {
                  const state = stepStates[step.id];
                  if (!state) return null;
                  return (
                    <Box key={step.id} sx={{ mb: 2 }}>
                      <Typography
                        component="span"
                        sx={{
                          color:
                            state.status === "success"
                              ? "#4caf50"
                              : state.status === "error"
                                ? "#f44336"
                                : "#2196f3",
                          fontWeight: 600,
                        }}>
                        [{step.label}]
                      </Typography>
                      <Box component="pre" sx={{ m: 0, mt: 0.5 }}>
                        {state.output}
                      </Box>
                      {state.status === "success" && (
                        <Typography sx={{ color: "#4caf50" }}>✓ Completed successfully</Typography>
                      )}
                      {state.status === "error" && (
                        <Typography sx={{ color: "#f44336" }}>✗ Failed: {state.error}</Typography>
                      )}
                      <Divider sx={{ my: 1, borderColor: "#333" }} />
                    </Box>
                  );
                })}
              </Paper>
            </Collapse>
          </Box>
        )}

        {/* Success Message */}
        {allCompleted && (
          <Alert severity="success">
            <Typography variant="body2">
              <strong>Setup Complete!</strong> All steps executed successfully. Your Etendo environment is ready.
              Go to the <strong>Development</strong> section to access the UI.
            </Typography>
          </Alert>
        )}

        {/* Error Message */}
        {hasError && !isRunning && (
          <Alert severity="error">
            <Typography variant="body2">
              <strong>Setup Failed:</strong> One or more steps encountered an error. Check the log above for details.
              Fix the issue and try again.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
