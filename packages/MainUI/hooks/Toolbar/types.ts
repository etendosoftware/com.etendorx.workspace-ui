import type { BaseFieldDefinition } from "@workspaceui/api-client/src/api/types";
import type { ProcessActionButton, ProcessButton, ProcessDefinitionButton } from "@/components/ProcessModal/types";

export type ButtonType = "ACTION" | "DROPDOWN" | "MODAL" | "TOGGLE" | "CUSTOM";
export type ButtonSection = "left" | "center" | "right";

export interface ToolbarButtonMetadata {
  id: string;
  action: string;
  name: string;
  icon?: string | null;
  active: boolean;
  seqno?: number | null;
  buttonType: ButtonType;
  section: ButtonSection;
  modalConfig?: {
    title?: string;
    size?: "small" | "medium" | "large";
  };
  dropdownConfig?: {
    items?: Array<{ label: string; action: string }>;
  };
}

export interface OrganizedSections {
  left: ToolbarButtonMetadata[];
  center: ToolbarButtonMetadata[];
  right: ToolbarButtonMetadata[];
}

export interface ExecuteProcessParams {
  button: ProcessButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ExecuteProcessDefinitionParams {
  button: ProcessDefinitionButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ExecuteProcessActionParams {
  button: ProcessActionButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ToolbarResponse {
  response: {
    data: Array<ToolbarButtonMetadata>;
  } & Record<string, string>;
  windowId: string;
  isNew: boolean;
}
