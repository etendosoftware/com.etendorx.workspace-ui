import type React from "react";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import AssistantSelector from "../AssistantSelector";
import type { IAssistant, ILabels, IMessage } from "@workspaceui/api-client/src/api/copilot";
import MessageList from "../MessageComponents/MessageList";
import MessageInput from "../MessageComponents/MessageInput";

interface ChatInterfaceProps {
  assistants: IAssistant[];
  labels: ILabels;
  isExpanded?: boolean;
  // ← Props para la lógica de negocio
  messages: IMessage[];
  selectedAssistant: IAssistant | null;
  isLoading: boolean;
  onSelectAssistant: (assistant: IAssistant) => void;
  onSendMessage: (message: string, files?: File[]) => void;
  onResetConversation: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  assistants,
  labels,
  isExpanded = false,
  messages,
  selectedAssistant,
  isLoading,
  onSelectAssistant,
  onSendMessage,
  onResetConversation,
}) => {
  // Parse assistants si vienen como string
  let parsedAssistants: IAssistant[] = [];
  if (typeof assistants === "string") {
    try {
      parsedAssistants = JSON.parse(assistants);
    } catch {
      parsedAssistants = [];
    }
  } else if (Array.isArray(assistants)) {
    parsedAssistants = assistants;
  }

  const [showAssistantSelector, setShowAssistantSelector] = useState(true);

  // Mostrar chat si hay asistente seleccionado
  useEffect(() => {
    if (selectedAssistant) {
      setShowAssistantSelector(false);
    }
  }, [selectedAssistant]);

  const handleSelectAssistant = (assistant: IAssistant) => {
    onSelectAssistant(assistant);
    setShowAssistantSelector(false);
  };

  const handleBackToAssistants = () => {
    setShowAssistantSelector(true);
    onResetConversation();
  };

  if (showAssistantSelector) {
    return (
      <AssistantSelector
        assistants={parsedAssistants}
        selectedAssistant={selectedAssistant}
        onSelectAssistant={handleSelectAssistant}
        labels={labels}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header with selected assistant */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: "1.5rem" }}>🤖</span>
          <strong>{selectedAssistant?.name}</strong>
        </Box>
        <Box>
          <button
            onClick={handleBackToAssistants}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}>
            ← Cambiar asistente
          </button>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <MessageList messages={messages} labels={labels} isExpanded={isExpanded} isLoading={isLoading} />
      </Box>

      {/* Input Area */}
      <MessageInput
        onSendMessage={onSendMessage}
        placeholder={labels.ETCOP_Message_Placeholder || "Conversa con Copilot..."}
        disabled={isLoading}
      />
    </Box>
  );
};

export default ChatInterface;
