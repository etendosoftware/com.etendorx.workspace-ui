import { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  TextField,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCopilot } from "../hooks/useCopilot";

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ChatSidebar({ isCollapsed, onToggleCollapse }: ChatSidebarProps) {
  const [inputMessage, setInputMessage] = useState("");
  const {
    messages,
    assistants,
    selectedAssistant,
    isLoading,
    isLoadingAssistants,
    isInitialized,
    handleSelectAssistant,
    handleSendMessage: sendMessage,
    handleResetConversation,
  } = useCopilot();

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage("");
  };

  return (
    <Box className={`chat-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <Box className="chat-sidebar-header">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {!isCollapsed && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
              {selectedAssistant && (
                <IconButton size="small" onClick={handleResetConversation}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              <SmartToyIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600} noWrap>
                {selectedAssistant ? selectedAssistant.name : "Copilot"}
              </Typography>
            </Box>
          )}
          <IconButton onClick={onToggleCollapse} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
            {isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
      </Box>

      {!isCollapsed && (
        <Box className="chat-sidebar-content">
          {!isInitialized ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", p: 3 }}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Inicializando Copilot...
                </Typography>
              </Stack>
            </Box>
          ) : !selectedAssistant ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Selecciona un Asistente
              </Typography>
              {isLoadingAssistants ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {assistants.map((assistant) => (
                    <ListItem key={assistant.app_id} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => handleSelectAssistant(assistant)}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          "&:hover": {
                            bgcolor: "primary.light",
                          },
                        }}>
                        <ListItemText
                          primary={assistant.name}
                          secondary={assistant.description}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          ) : (
            <Stack direction="column" sx={{ height: "100%", display: "flex" }}>
              {/* Welcome Message */}
              {messages.length === 0 && (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <SmartToyIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {selectedAssistant.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAssistant.description || "Tu asistente de IA para desarrollo y soporte de Etendo"}
                  </Typography>
                </Box>
              )}

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: "80%",
                      bgcolor: msg.sender === "user" ? "primary.main" : "grey.100",
                      color: msg.sender === "user" ? "white" : "text.primary",
                    }}>
                    <Typography variant="body2">{msg.text}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 0.5 }}>
                      {msg.timestamp}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "grey.100" }}>
                    <Typography variant="body2" color="text.secondary">
                      Escribiendo...
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Escribe tu mensaje..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <IconButton color="primary" onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      )}

      {isCollapsed && (
        <Tooltip title="Abrir Copilot" placement="left">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 2,
              cursor: "pointer",
            }}
            onClick={onToggleCollapse}>
            <SmartToyIcon sx={{ color: "primary.main" }} />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
