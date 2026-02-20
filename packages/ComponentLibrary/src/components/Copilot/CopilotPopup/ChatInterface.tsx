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

import { useState } from "react";
import AssistantSelector from "../AssistantSelector";
import ConversationList from "../ConversationList";
import type { IAssistant, IMessage } from "@workspaceui/api-client/src/api/copilot";
import MessageList from "../MessageComponents/MessageList";
import MessageInput from "../MessageComponents/MessageInput";
import IconButton from "../../IconButton";
import SidebarIcon from "../../../assets/icons/sidebar.svg";
import MessageSquareIcon from "../../../assets/icons/message-square.svg";
import type { ChatInterfaceProps, ContextItem } from "../types";

interface ChatContentProps {
  messages: IMessage[];
  labels: ChatInterfaceProps["labels"];
  isExpanded: boolean;
  isLoading: boolean;
  onSendMessage: (message: string, files?: File[]) => void;
  contextItems: ContextItem[];
  onRemoveContext?: (id: string) => void;
  files?: File[];
  onFileSelect?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  currentMessage: string;
  onMessageChange: (message: string) => void;
  translations: {
    messageList: ChatInterfaceProps["translations"]["messageList"];
    messageInput: ChatInterfaceProps["translations"]["messageInput"];
    selectedRegisters: string;
  };
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  labels,
  isExpanded,
  isLoading,
  onSendMessage,
  contextItems,
  onRemoveContext,
  files,
  onFileSelect,
  onRemoveFile,
  currentMessage,
  onMessageChange,
  translations,
}) => (
  <>
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
      files={files}
      onFileSelect={onFileSelect}
      onRemoveFile={onRemoveFile}
      message={currentMessage}
      onMessageChange={onMessageChange}
      translations={{
        placeholder: translations.messageInput?.placeholder || labels.ETCOP_Message_Placeholder,
        selectedRegisters: translations.selectedRegisters,
      }}
    />
  </>
);

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
  showDescription = true,
  isLoadingAssistants = false,
  contextItems = [],
  onRemoveContext,
  files,
  onFileSelect,
  onRemoveFile,
  conversations = [],
  onSelectConversation,
  onLoadConversations,
  conversationsLoading = false,
  showOnlyFeatured,
  hasFeaturedAssistants,
  onToggleFeaturedFilter,
  translations,
}) => {
  const [showConversations, setShowConversations] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("");

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
    setShowConversations(false);
  };

  const handleToggleConversations = () => {
    const newShowState = !showConversations;
    setShowConversations(newShowState);

    if (newShowState && onLoadConversations) {
      onLoadConversations();
    }
  };

  const handleSelectConversationInternal = (conversationId: string) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId);
      setShowConversations(false);
    }
  };

  const handleNewConversation = () => {
    onResetConversation();
    setShowConversations(false);
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
        isLoading={isLoadingAssistants}
        showOnlyFeatured={showOnlyFeatured}
        hasFeaturedAssistants={hasFeaturedAssistants}
        onToggleFeaturedFilter={onToggleFeaturedFilter}
        translations={translations.assistantSelector}
      />
    );
  }

  // For compact view, show full-screen conversation list or chat
  if (!isExpanded) {
    if (showConversations && translations.conversationList) {
      return (
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversationInternal}
          onNewConversation={handleNewConversation}
          isLoading={conversationsLoading}
          translations={translations.conversationList}
        />
      );
    }

    return (
      <div className="flex flex-col h-full">
        {onLoadConversations && selectedAssistant && (
          <div className="px-4 py-2 border-b border-(--color-transparent-neutral-20)">
            <button
              type="button"
              onClick={handleToggleConversations}
              className="flex items-center gap-2 text-sm text-(--color-transparent-neutral-70) hover:text-(--color-dynamic-main) transition-colors">
              <MessageSquareIcon className="w-4 h-4" fill="currentColor" />
              <span>{translations.conversationsButton || "Previous Conversations"}</span>
            </button>
          </div>
        )}

        <ChatContent
          messages={messages}
          labels={labels}
          isExpanded={isExpanded}
          isLoading={isLoading}
          onSendMessage={onSendMessage}
          contextItems={contextItems}
          onRemoveContext={onRemoveContext}
          files={files}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          currentMessage={currentMessage}
          onMessageChange={setCurrentMessage}
          translations={{
            messageList: translations.messageList,
            messageInput: translations.messageInput,
            selectedRegisters: translations.selectedRegisters,
          }}
        />
      </div>
    );
  }

  // For expanded view, show sidebar with conversations
  return (
    <div className="flex h-full relative">
      {/* Sidebar - Conversation List */}
      {onLoadConversations && selectedAssistant && translations.conversationList && (
        <div
          className={`border-r border-(--color-transparent-neutral-20) bg-white transition-all duration-300 ${showConversations ? "w-80" : "w-0 overflow-hidden"}`}>
          {showConversations && (
            <ConversationList
              conversations={conversations}
              onSelectConversation={handleSelectConversationInternal}
              onNewConversation={handleNewConversation}
              onCloseSidebar={handleToggleConversations}
              isLoading={conversationsLoading}
              translations={translations.conversationList}
            />
          )}
        </div>
      )}

      {/* Vertical Toolbar - Only show when sidebar is hidden */}
      {onLoadConversations && selectedAssistant && !showConversations && (
        <div className="flex flex-col gap-2 p-2 border-r border-(--color-transparent-neutral-20)">
          <IconButton
            onClick={handleToggleConversations}
            tooltip={translations.conversationsButton || "Show sidebar"}
            tooltipPosition="right"
            ariaLabel="Show sidebar">
            <SidebarIcon />
          </IconButton>
          <IconButton
            onClick={handleNewConversation}
            tooltip={translations.conversationList?.newConversation || "New conversation"}
            tooltipPosition="right"
            ariaLabel="New conversation">
            <MessageSquareIcon />
          </IconButton>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <ChatContent
          messages={messages}
          labels={labels}
          isExpanded={isExpanded}
          isLoading={isLoading}
          onSendMessage={onSendMessage}
          contextItems={contextItems}
          onRemoveContext={onRemoveContext}
          files={files}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          currentMessage={currentMessage}
          onMessageChange={setCurrentMessage}
          translations={{
            messageList: translations.messageList,
            messageInput: translations.messageInput,
            selectedRegisters: translations.selectedRegisters,
          }}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
