/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
