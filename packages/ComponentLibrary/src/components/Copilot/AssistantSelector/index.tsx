import { Box, Typography, Grid, Card, CardContent, Radio, Link } from "@mui/material";
import SparksIcon from "../../../assets/icons/sparks.svg";
import type { IAssistant, ILabels } from "@workspaceui/api-client/src/api/copilot";

interface AssistantSelectorProps {
  assistants: IAssistant[];
  selectedAssistant: IAssistant | null;
  onSelectAssistant: (assistant: IAssistant) => void;
  labels: ILabels;
}

const AssistantSelector: React.FC<AssistantSelectorProps> = ({ assistants, selectedAssistant, onSelectAssistant }) => {
  if (!assistants || !Array.isArray(assistants) || assistants.length === 0) {
    console.error("AssistantSelector: Invalid assistants data:", assistants);
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          {!assistants || !Array.isArray(assistants)
            ? "Error: Datos de asistentes inválidos"
            : "No hay asistentes disponibles"}
        </Typography>
      </Box>
    );
  }

  const getAssistantIcon = (assistantId: string) => {
    switch (assistantId) {
      case "bastian":
        return "😊";
      case "purchase":
        return "🛒";
      case "sql":
        return "📊";
      default:
        return "🤖";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          ¡Hola! ✨🚀 Selecciona el perfil que más se ajuste a tu tarea y comencemos. 💪
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SparksIcon />
          <Typography variant="h6">Perfiles</Typography>
        </Box>
        <Link href="#" sx={{ textDecoration: "none" }}>
          Conoce más sobre Copilot →
        </Link>
      </Box>

      <Grid container spacing={2}>
        {assistants.map((assistant) => (
          <Grid item xs={12} sm={6} md={4} key={assistant.app_id}>
            <Card
              sx={{
                cursor: "pointer",
                border: selectedAssistant?.app_id === assistant.app_id ? 2 : 1,
                borderColor: selectedAssistant?.app_id === assistant.app_id ? "primary.main" : "divider",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
              onClick={() => onSelectAssistant(assistant)}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Radio checked={selectedAssistant?.app_id === assistant.app_id} sx={{ mt: -1 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <span style={{ fontSize: "1.5rem" }}>{getAssistantIcon(assistant.app_id)}</span>
                      <Typography variant="h6">{assistant.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {assistant.description || "Asistente de Etendo Copilot"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AssistantSelector;
