import AssistantSelector from "../AssistantSelector";
import type { IAssistant } from "@workspaceui/api-client/src/api/copilot";
import MessageList from "../MessageComponents/MessageList";
import MessageInput from "../MessageComponents/MessageInput";
import type { ChatInterfaceProps } from "../types";

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  assistants,
  labels,
  isExpanded = false,
  messages,
  selectedAssistant,
  isLoading,
  onSelectAssistant,
  onSendMessage,
  showDescription = true,
  contextItems = [],
  onRemoveContext,
  translations,
}) => {
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

  const showAssistantSelector = !selectedAssistant;

  const handleSelectAssistant = (assistant: IAssistant) => {
    onSelectAssistant(assistant);
  };

  if (showAssistantSelector) {
    return (
      <AssistantSelector
        assistants={parsedAssistants}
        selectedAssistant={selectedAssistant}
        onSelectAssistant={handleSelectAssistant}
        labels={labels}
        isExpanded={isExpanded}
        showDescription={showDescription}
        translations={translations.assistantSelector}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          labels={labels}
          isExpanded={isExpanded}
          isLoading={isLoading}
          translations={translations.messageList}
        />
      </div>

      <MessageInput
        onSendMessage={onSendMessage}
        placeholder={translations.messageInput?.placeholder || labels.ETCOP_Message_Placeholder}
        disabled={isLoading}
        contextItems={contextItems}
        onRemoveContext={onRemoveContext}
        translations={{
          placeholder: translations.messageInput?.placeholder || labels.ETCOP_Message_Placeholder,
          selectedRegisters: translations.selectedRegisters,
        }}
      />
    </div>
  );
};

export default ChatInterface;
