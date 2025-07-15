import type { IAssistant, ILabels, IMessage } from "@workspaceui/api-client/src/api/copilot";

export interface AssistantSelectorProps {
  assistants: IAssistant[];
  selectedAssistant: IAssistant | null;
  onSelectAssistant: (assistant: IAssistant) => void;
  labels: ILabels;
  isExpanded?: boolean;
  showDescription?: boolean;
  translations: {
    errorInvalidData: string;
    errorNoAssistantsAvailable: string;
    defaultDescription: string;
    welcomeMessage: string;
    profilesTitle: string;
    learnMoreText: string;
    filterPlaceholder: string;
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
  translations: {
    assistantSelector: AssistantSelectorProps["translations"];
    messageInput: MessageInputProps["translations"];
    messageList: MessageListProps["translations"];
  };
}

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
  onSelectAssistant: (assistant: IAssistant | null) => void;
  onSendMessage: (message: string, files?: File[]) => void;
  onResetConversation: () => void;
  showDescription?: boolean;
  translations: {
    copilotProfile: string;
    backToSelection: string;
    minimize: string;
    maximize: string;
    close: string;
    assistantSelector: AssistantSelectorProps["translations"];
    messageInput: MessageInputProps["translations"];
    messageList: MessageListProps["translations"];
  };
}

export interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  translations?: {
    placeholder: string;
  };
}

export interface MessageListProps {
  messages: IMessage[];
  labels: ILabels;
  isExpanded?: boolean;
  isLoading?: boolean;
  translations?: {
    welcomeMessage: string;
    typing: string;
  };
}
