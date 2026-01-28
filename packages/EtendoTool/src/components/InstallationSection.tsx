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
    setInstallOutput("> Iniciando proceso de instalación...\n");
    setInstallSuccess(null);
    setError(null);

    try {
      setInstallOutput((prev) => `${prev}> Ejecutando gradle install...\n`);

      const result = await executeGradle("install");

      if (result.success) {
        setInstallOutput((prev) => `${prev}${result.output}\n\n✓ Instalación completada exitosamente.`);
        setInstallSuccess(true);
      } else {
        setInstallOutput((prev) => `${prev}${result.error || result.output}\n\n✗ La instalación falló.`);
        setInstallSuccess(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
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
            Instalación Inicial de Etendo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción preparará la base de datos y las estructuras necesarias. Ejecutar solo si es la primera vez o si
            necesitas reinstalar desde cero.
          </Typography>
        </Box>

        <Alert severity="info" variant="outlined">
          <Typography variant="body2">
            <strong>Estado:</strong> Prerrequisitos verificados. El sistema está listo para la instalación.
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
                Ejecutar Instalación
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
                Este proceso creará las tablas de base de datos, configurará los esquemas y preparará el sistema para su
                uso.
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
              {isInstalling ? "Instalando..." : "EJECUTAR INSTALACIÓN (INSTALL)"}
            </Button>
          </Stack>
        </Paper>

        {isInstalling && <LinearProgress />}

        {error && <Alert severity="error">{error}</Alert>}

        {installOutput && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Progreso de la instalación:
            </Typography>
            <Paper sx={logStyles}>{installOutput}</Paper>
          </Box>
        )}

        {installSuccess && (
          <Alert severity="success">
            <Typography variant="body2">
              ¡Instalación completada! Ahora puedes ir al <strong>Panel de Desarrollo</strong> para iniciar la UI.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
