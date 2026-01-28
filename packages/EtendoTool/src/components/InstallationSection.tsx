import { useState, useMemo } from "react";
import { Alert, Box, Button, Paper, Stack, Typography, LinearProgress, useTheme } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { executeGradle } from "../api/gradle";

export function InstallationSection() {
  const theme = useTheme();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installOutput, setInstallOutput] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logStyles = useMemo(
    () => ({
      p: 2,
      mt: 2,
      borderRadius: 1,
      border: `1px solid ${installSuccess ? theme.palette.success.main : installSuccess === false ? theme.palette.error.main : theme.palette.divider}`,
      backgroundColor: installSuccess
        ? "rgba(76, 175, 80, 0.05)"
        : installSuccess === false
          ? "rgba(244, 67, 54, 0.05)"
          : "#1e1e1e",
      color: installSuccess
        ? theme.palette.text.primary
        : installSuccess === false
          ? theme.palette.error.main
          : "#d4d4d4",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "0.85rem",
      lineHeight: 1.6,
      whiteSpace: "pre-wrap",
      maxHeight: "400px",
      overflow: "auto",
    }),
    [theme, installSuccess]
  );

  const handleInstall = async () => {
    setIsInstalling(true);
    setInstallOutput("> Starting installation process...\n");
    setInstallSuccess(null);
    setError(null);

    try {
      setInstallOutput((prev) => `${prev}> Running gradle install...\n`);

      const result = await executeGradle("install");

      if (result.success) {
        setInstallOutput((prev) => `${prev}${result.output}\n\n✓ Installation completed successfully.`);
        setInstallSuccess(true);
      } else {
        setInstallOutput((prev) => `${prev}${result.error || result.output}\n\n✗ The installation failed.`);
        setInstallSuccess(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setInstallOutput((prev) => `${prev}\n✗ Error: ${message}`);
      setInstallSuccess(false);
      setError(message);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Box className="section-content">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Initial Etendo Installation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action prepares the database and required structures. Run it only for the first setup or if you need a
            clean reinstall.
          </Typography>
        </Box>

        <Alert severity="info" variant="outlined">
          <Typography variant="body2">
            <strong>Status:</strong> Prerequisites verified. The system is ready for installation.
          </Typography>
        </Alert>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            border: "2px dashed #e4e7ec",
            borderRadius: 3,
            backgroundColor: "#fafbfc",
            }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0, 74, 202, 0.3)",
              }}>
              <PlayArrowIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Run Installation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
                This process creates the database tables, configures schemas, and prepares the system for use.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleInstall}
              disabled={isInstalling}
              startIcon={isInstalling ? undefined : <PlayArrowIcon />}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: "0 4px 14px rgba(0, 74, 202, 0.4)",
              }}>
              {isInstalling ? "Installing..." : "RUN INSTALLATION (INSTALL)"}
            </Button>
          </Stack>
        </Paper>

        {isInstalling && <LinearProgress />}

        {error && <Alert severity="error">{error}</Alert>}

        {installOutput && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Installation progress:
            </Typography>
            <Paper sx={logStyles}>{installOutput}</Paper>
          </Box>
        )}

        {installSuccess && (
          <Alert severity="success">
            <Typography variant="body2">
              Installation complete! You can now go to the <strong>Development Panel</strong> to start the UI.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
