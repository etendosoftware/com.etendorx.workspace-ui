import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import {
  GithubAuthApi,
  type DeviceFlowStart,
} from "../services/githubAuthApi";

type FlowState = "idle" | "pending" | "success" | "error";

interface GithubAuthButtonProps {
  onSuccess?: (token: string) => void;
}

export function GithubAuthButton({ onSuccess }: GithubAuthButtonProps) {
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [flowData, setFlowData] = useState<DeviceFlowStart | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const stopPolling = useCallback(() => {
    abortRef.current = true;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const poll = useCallback(
    (deviceCode: string, interval: number) => {
      if (abortRef.current) return;
      pollingRef.current = setTimeout(async () => {
        if (abortRef.current) return;
        const result = await GithubAuthApi.pollDeviceFlow(deviceCode);
        if (abortRef.current) return;

        if (result.status === "success" && result.token) {
          setFlowState("success");
          onSuccess?.(result.token);
          return;
        }
        if (result.status === "expired" || result.status === "denied") {
          setFlowState("error");
          setErrorMessage(
            result.status === "expired"
              ? "Authorization expired. Please try again."
              : "Authorization was denied. Please try again.",
          );
          return;
        }
        const nextInterval = result.interval
          ? result.interval * 1000
          : interval;
        poll(deviceCode, nextInterval);
      }, interval);
    },
    [onSuccess],
  );

  const startFlow = async () => {
    setFlowState("pending");
    setErrorMessage("");
    setCopied(false);
    abortRef.current = false;

    const result = await GithubAuthApi.startDeviceFlow();
    if (!result.success || !result.data) {
      setFlowState("error");
      setErrorMessage(result.error || "Failed to start authentication");
      return;
    }

    setFlowData(result.data);
    poll(result.data.deviceCode, result.data.interval * 1000);
  };

  const handleCancel = () => {
    stopPolling();
    setFlowState("idle");
    setFlowData(null);
    setErrorMessage("");
  };

  const handleCopy = async () => {
    if (!flowData) return;
    try {
      await navigator.clipboard.writeText(flowData.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  };

  if (flowState === "idle") {
    return (
      <Button variant="outlined" size="small" onClick={startFlow}>
        Connect GitHub
      </Button>
    );
  }

  if (flowState === "success") {
    return (
      <Alert
        severity="success"
        icon={<CheckCircleIcon />}
        sx={{ py: 0.5 }}
      >
        Token saved to gradle.properties
      </Alert>
    );
  }

  if (flowState === "error") {
    return (
      <Stack spacing={1}>
        <Alert severity="error" sx={{ py: 0.5 }}>
          {errorMessage}
        </Alert>
        <Button variant="outlined" size="small" onClick={startFlow}>
          Try again
        </Button>
      </Stack>
    );
  }

  // pending state
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.5}>
        <Typography variant="body2" fontWeight={500}>
          1. Copy this code and enter it on GitHub:
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1,
              backgroundColor: "grey.100",
              border: "2px dashed",
              borderColor: "primary.main",
              fontFamily: "monospace",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              userSelect: "all",
            }}
          >
            {flowData?.userCode}
          </Box>
          <IconButton size="small" onClick={handleCopy} title="Copy code">
            {copied ? (
              <CheckCircleIcon color="success" fontSize="small" />
            ) : (
              <ContentCopyIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <LinkIcon fontSize="small" color="action" />
          <Typography variant="body2">
            2. Open{" "}
            <a
              href={flowData?.verificationUri}
              target="_blank"
              rel="noopener noreferrer"
            >
              {flowData?.verificationUri}
            </a>
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={14} />
          <Typography variant="body2" color="text.secondary">
            Waiting for authorization...
          </Typography>
        </Stack>

        <Button
          variant="text"
          size="small"
          onClick={handleCancel}
          sx={{ alignSelf: "flex-start" }}
        >
          Cancel
        </Button>
      </Stack>
    </Paper>
  );
}
