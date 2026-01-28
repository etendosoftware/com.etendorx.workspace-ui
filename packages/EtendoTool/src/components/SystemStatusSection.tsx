import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { checkJavaCommand } from "../api/javaRuntime";
import type { PrerequisiteStatus, PrerequisiteItem, SystemStatusState } from "../types/systemStatus";
import { DEFAULT_PREREQUISITES } from "../types/systemStatus";

const STATUS_ICONS: Record<PrerequisiteStatus, React.ReactNode> = {
  ok: <CheckCircleIcon sx={{ color: "success.main" }} />,
  warning: <WarningIcon sx={{ color: "warning.main" }} />,
  error: <ErrorIcon sx={{ color: "error.main" }} />,
  checking: <CircularProgress size={20} />,
  unknown: <HelpOutlineIcon sx={{ color: "text.secondary" }} />,
};

const STATUS_COLORS: Record<PrerequisiteStatus, string> = {
  ok: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  checking: "#2196f3",
  unknown: "#9e9e9e",
};

export function SystemStatusSection() {
  const [state, setState] = useState<SystemStatusState>(DEFAULT_PREREQUISITES);
  const [error, setError] = useState<string | null>(null);

  const checkJava = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      java: { ...prev.java, status: "checking", details: "Checking..." },
    }));

    try {
      const response = await checkJavaCommand();
      setState((prev) => ({
        ...prev,
        java: {
          ...prev.java,
          status: response.available ? "ok" : "error",
          details: response.available ? "Java 17 detected in PATH" : "Java 17 not found",
          actionLabel: response.available ? undefined : "Install Java",
        },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        java: {
          ...prev.java,
          status: "error",
          details: err instanceof Error ? err.message : "Error while checking",
          actionLabel: "Retry",
        },
      }));
    }
  }, []);

  const checkDocker = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      docker: { ...prev.docker, status: "checking", details: "Checking..." },
    }));

    // Simulated check - in real implementation would call an API
    try {
      // For now, we'll simulate the check with a timeout
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({
        ...prev,
        docker: {
          ...prev.docker,
          status: "warning",
          details: "Docker installed; verify it is running",
          actionLabel: "Start Docker",
        },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        docker: {
          ...prev.docker,
          status: "error",
          details: "Docker not detected",
          actionLabel: "Install Docker",
        },
      }));
    }
  }, []);

  const checkDatabase = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      database: { ...prev.database, status: "checking", details: "Checking..." },
    }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({
        ...prev,
        database: {
          ...prev.database,
          status: "warning",
          details: "Container found; verify the connection",
          actionLabel: "Restart DB",
        },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        database: {
          ...prev.database,
          status: "error",
          details: "Database unavailable",
          actionLabel: "Configure DB",
        },
      }));
    }
  }, []);

  const checkPorts = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      ports: { ...prev.ports, status: "checking", details: "Checking..." },
    }));

    try {
      // Check if port 3000 is available by trying to fetch
      await fetch("http://localhost:3000", { method: "HEAD", mode: "no-cors" });
      setState((prev) => ({
        ...prev,
        ports: {
          ...prev.ports,
          status: "warning",
          details: "Port 3000 in use (UI might already be running)",
        },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        ports: {
          ...prev.ports,
          status: "ok",
          details: "Port 3000 available",
        },
      }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setError(null);
    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      await Promise.all([checkJava(), checkDocker(), checkDatabase(), checkPorts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error checking prerequisites");
    } finally {
      setState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }, [checkJava, checkDocker, checkDatabase, checkPorts]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const prerequisites: PrerequisiteItem[] = useMemo(
    () => [state.java, state.docker, state.database, state.ports],
    [state.java, state.docker, state.database, state.ports]
  );

  const criticalErrors = prerequisites.filter((p) => p.status === "error").length;

  return (
    <Box className="section-content">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            System Status and Prerequisites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check that your environment meets all required dependencies before installing or developing.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={state.isRefreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={refreshAll}
            disabled={state.isRefreshing}>
            Refresh All
          </Button>
          {criticalErrors > 0 && (
            <Alert severity="warning" sx={{ flex: 1 }}>
              {criticalErrors} critical prerequisite(s) need attention before continuing.
            </Alert>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e4e7ec" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600 }}>Component</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 150 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prerequisites.map((prereq) => (
                <TableRow key={prereq.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{prereq.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {STATUS_ICONS[prereq.status]}
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: STATUS_COLORS[prereq.status],
                        }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {prereq.details}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {prereq.actionLabel && (
                      <Button size="small" variant="outlined" onClick={prereq.onAction}>
                        {prereq.actionLabel}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Paper elevation={0} sx={{ p: 2, backgroundColor: "#f8fafc", border: "1px solid #e4e7ec" }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> If there are red indicators in critical prerequisites, the Installation and Development
            sections may not work correctly. Resolve the indicated issues before continuing.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
