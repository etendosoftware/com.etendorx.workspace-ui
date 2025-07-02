// packages/ComponentLibrary/src/components/Copilot/ChatInterface/index.tsx

import { useState } from "react";
import { Box } from "@mui/material";
import AssistantSelector from "../AssistantSelector";
import MessageList from "../MessageComponents/MessageList";
import MessageInput from "../MessageComponents/MessageInput";
import type { IAssistant, ILabels, IMessage } from "@workspaceui/api-client/src/api/copilot";

interface ChatInterfaceProps {
  assistants: IAssistant[];
  labels: ILabels;
  isExpanded?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ assistants, labels, isExpanded = false }) => {
  const [selectedAssistant, setSelectedAssistant] = useState<IAssistant | null>(
    assistants.length > 0 ? assistants[0] : null
  );
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [showAssistantSelector, setShowAssistantSelector] = useState(true);

  const handleSelectAssistant = (assistant: IAssistant) => {
    setSelectedAssistant(assistant);
    setShowAssistantSelector(false);
    setMessages([]);
  };

  const handleSendMessage = (message: string, files?: File[]) => {
    console.log("Send message:", message, files);
  };

  if (showAssistantSelector) {
    return (
      <AssistantSelector
        assistants={assistants}
        selectedAssistant={selectedAssistant}
        onSelectAssistant={handleSelectAssistant}
        labels={labels}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <MessageList messages={messages} labels={labels} isExpanded={isExpanded} />
      </Box>

      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder={labels.ETCOP_Message_Placeholder || "Conversa con Copilot..."}
        disabled={false}
      />
    </Box>
  );
};

export default ChatInterface;
