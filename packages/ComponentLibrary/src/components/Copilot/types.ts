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

import type { IAssistant, ILabels, IMessage } from "@workspaceui/api-client/src/api/copilot";

export interface AssistantSelectorProps {
  assistants: IAssistant[];
  selectedAssistant: IAssistant | null;
  onSelectAssistant: (assistant: IAssistant) => void;
  labels: ILabels;
  isExpanded?: boolean;
  showDescription?: boolean;
  isLoading?: boolean;
  showOnlyFeatured?: boolean;
  hasFeaturedAssistants?: boolean;
  onToggleFeaturedFilter?: () => void;
  translations: {
    errorInvalidData: string;
    errorNoAssistantsAvailable: string;
    defaultDescription: string;
    welcomeMessage: string;
    profilesTitle: string;
    learnMoreText: string;
    filterPlaceholder: string;
    toggleFeaturedFilter?: string;
  };
}

export interface CopilotButtonProps {
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
}

export interface ChatInterfaceProps {
  assistants: IAssistant[];
  labels: ILabels;
  isExpanded?: boolean;
  messages: IMessage[];
  selectedAssistant: IAssistant | null;
  isLoading: boolean;
  onSelectAssistant: (assistant: IAssistant | null) => void;
  onSendMessage: (message: string, files?: File[]) => void;
  onResetConversation: () => void;
  showDescription?: boolean;
  isLoadingAssistants?: boolean;
  contextItems?: ContextItem[];
  onRemoveContext?: (id: string) => void;
  files?: File[];
  onFileSelect?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  conversations?: import("@workspaceui/api-client/src/api/copilot").IConversationSummary[];
  archivedConversations?: import("@workspaceui/api-client/src/api/copilot").IConversationSummary[];
  onSelectConversation?: (conversationId: string) => void;
  onLoadConversations?: () => void;
  conversationsLoading?: boolean;
  onRenameConversation?: (conversationId: string, title: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onRestoreConversation?: (conversationId: string) => void;
  onPermanentDeleteConversation?: (conversationId: string) => void;
  onToggleArchive?: () => void;
  archiveExpanded?: boolean;
  archivedLoading?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  showOnlyFeatured?: boolean;
  hasFeaturedAssistants?: boolean;
  onToggleFeaturedFilter?: () => void;
  translations: {
    selectedRegisters: string;
    assistantSelector: AssistantSelectorProps["translations"];
    messageInput: MessageInputProps["translations"];
    messageList: MessageListProps["translations"];
    conversationList?: ConversationListProps["translations"];
    conversationsButton?: string;
    hideConversationsButton?: string;
  };
}

export interface CopilotPopupProps extends Omit<ChatInterfaceProps, "translations"> {
  open: boolean;
  onClose: () => void;
  onToggleExpanded?: () => void;
  hasContextPending?: boolean;
  translations: ChatInterfaceProps["translations"] & {
    copilotProfile: string;
    backToSelection: string;
    minimize: string;
    maximize: string;
    close: string;
    contextText: string;
  };
}

export interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  contextItems?: ContextItem[];
  onRemoveContext?: (id: string) => void;
  message?: string;
  onMessageChange?: (message: string) => void;
  files?: File[];
  onFileSelect?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  translations?: {
    placeholder: string;
    selectedRegisters?: string;
  };
}

export interface MessageListProps {
  messages: IMessage[];
  labels: ILabels;
  isExpanded?: boolean;
  isLoading?: boolean;
  translations?: {
    contextRecords: string;
    welcomeMessage: string;
    typing: string;
    processing: string;
  };
}

export interface ContextItem {
  id: string;
  label: string;
  contextString: string;
  recordId?: string;
}

export interface ContextPreviewProps {
  contextItems: ContextItem[];
  onRemoveContext: (id: string) => void;
  showRemoveButton?: boolean;
  translations?: {
    selectedRegisters: string;
  };
}

export interface ConversationListProps {
  conversations: import("@workspaceui/api-client/src/api/copilot").IConversationSummary[];
  archivedConversations?: import("@workspaceui/api-client/src/api/copilot").IConversationSummary[];
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onCloseSidebar?: () => void;
  isLoading?: boolean;
  onRenameConversation?: (conversationId: string, title: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onRestoreConversation?: (conversationId: string) => void;
  onPermanentDeleteConversation?: (conversationId: string) => void;
  onToggleArchive?: () => void;
  archiveExpanded?: boolean;
  archivedLoading?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  translations: {
    newConversation: string;
    noConversations: string;
    startNewConversation: string;
    loading: string;
    untitledConversation?: string;
    closeSidebar?: string;
    searchPlaceholder?: string;
    archivedTitle?: string;
    noArchivedConversations?: string;
    renameConversation?: string;
    deleteConversation?: string;
    restoreConversation?: string;
    permanentDeleteConversation?: string;
  };
}
