import type { IAssistant, ILabels, IMessage } from "@workspaceui/api-client/src/api/copilot";

export interface AssistantSelectorProps {
  assistants: IAssistant[];
  selectedAssistant: IAssistant | null;
  onSelectAssistant: (assistant: IAssistant) => void;
  labels: ILabels;
  isExpanded?: boolean;
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
  onSelectAssistant: (assistant: IAssistant) => void;
  onSendMessage: (message: string, files?: File[]) => void;
  onResetConversation: () => void;
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
}

export interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface MessageListProps {
  messages: IMessage[];
  labels: ILabels;
  isExpanded?: boolean;
  isLoading?: boolean;
}
