import type React from "react";
import { useState, useEffect } from "react";
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
    <div className="flex flex-col h-full">
      {/* Header with selected assistant */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <strong className="text-lg">{selectedAssistant?.name}</strong>
        </div>
        <div>
          <button
            type="button"
            onClick={handleBackToAssistants}
            className="bg-transparent border-none cursor-pointer text-blue-600 hover:text-blue-800">
            ← Cambiar asistente
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} labels={labels} isExpanded={isExpanded} isLoading={isLoading} />
      </div>

      {/* Input Area */}
      <MessageInput
        onSendMessage={onSendMessage}
        placeholder={labels.ETCOP_Message_Placeholder || "Conversa con Copilot..."}
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatInterface;
