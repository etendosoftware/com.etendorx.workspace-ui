import { useState, useMemo, useCallback } from "react";
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
import { useEnvironment } from "../hooks/useEnvironment";
import { executeGradle } from "../api/gradle";
import { dockerApi } from "../api/docker";

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

export function StartAllSection() {
  const theme = useTheme();
  const { environment, isLoading: envLoading } = useEnvironment();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [includeDockerStep, setIncludeDockerStep] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

  // Determine which steps to show based on environment
  const steps = useMemo(() => {
    if (environment?.isDevContainer) {
      // In DevContainer, skip Docker step by default (already running)
      return ALL_STEPS.filter((step) => !step.isDocker || includeDockerStep);
    }
    return ALL_STEPS;
  }, [environment, includeDockerStep]);

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
  }, [steps, executeStep]);

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
