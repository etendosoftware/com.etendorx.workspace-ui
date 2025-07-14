import type React from "react";
import type { IAssistant, ILabels, IMessage } from "@workspaceui/api-client/src/api/copilot";
import ChatInterface from "./ChatInterface";

export interface CopilotPopupProps {
  open: boolean;
  onClose: () => void;
  assistants: IAssistant[];
  labels: ILabels;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  messages: IMessage[];
  selectedAssistant: IAssistant | null;
  isLoading: boolean;
  onSelectAssistant: (assistant: IAssistant) => void;
  onSendMessage: (message: string, files?: File[]) => void;
  onResetConversation: () => void;
}

const CopilotPopup: React.FC<CopilotPopupProps> = ({
  open,
  onClose,
  assistants,
  labels,
  isExpanded = false,
  onToggleExpanded,
  messages,
  selectedAssistant,
  isLoading,
  onSelectAssistant,
  onSendMessage,
  onResetConversation,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`bg-white rounded-lg shadow-xl ${isExpanded ? "w-full max-w-4xl h-[80vh]" : "w-full max-w-md h-[600px]"} max-h-[90vh] flex flex-col`}>
        {/* Dialog Header */}
        <div className="flex justify-between items-center p-4 pb-2 border-b border-gray-200">
          <span className="text-lg font-semibold">Perfil Copilot</span>
          <div className="flex gap-1">
            {onToggleExpanded && (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label={isExpanded ? "Minimizar" : "Maximizar"}>
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Minimizar">
                    <title>Minimizar</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Maximizar">
                    <title>Maximizar</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Cerrar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Cerrar">
                <title>Cerrar</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dialog Content */}
        <div className="p-0 flex flex-col flex-1 overflow-hidden">
          <ChatInterface
            assistants={assistants}
            labels={labels}
            isExpanded={isExpanded}
            messages={messages}
            selectedAssistant={selectedAssistant}
            isLoading={isLoading}
            onSelectAssistant={onSelectAssistant}
            onSendMessage={onSendMessage}
            onResetConversation={onResetConversation}
          />
        </div>
      </div>
    </div>
  );
};

export default CopilotPopup;
