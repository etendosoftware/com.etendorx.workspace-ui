import { Field } from "@workspaceui/etendohookbinder/src/api/types";

export interface BaseButton {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
}

export type ProcessParameters = Array<{
  defaultValue: string;
  id: string;
  name: string;
}>;

export interface ProcessDefinition extends Record<string, unknown> {
  id: string;
  name: string;
  javaClassName: string;
  parameters: ProcessParameters;
}

export interface ProcessAction extends Record<string, unknown> {
  id: string;
  name: string;
}

export interface ProcessInfo {
  loadFunction: string;
  clientSideValidation: string;
  _entityName: string;
  id: string;
  name: string;
  javaClassName: string;
  searchKey: string;
  parameters: ProcessParameters;
}

export interface BaseProcessButton extends BaseButton {
  processId: string;
  buttonText: string;
  displayLogic?: string;
  processInfo: ProcessInfo;
  field: Field;
}

export interface ProcessDefinitionButton extends BaseProcessButton {
  processDefinition: ProcessDefinition;
}

export interface ProcessActionButton extends BaseProcessButton {
  processAction: ProcessAction;
}

export type ProcessButton = ProcessDefinitionButton | ProcessActionButton;

export enum ProcessButtonType {
  PROCESS_DEFINITION = 'processDefinition',
  PROCESS_ACTION = 'processAction',
}

export interface ProcessResponse {
  responseActions?: Array<{
    showMsgInProcessView?: {
      msgType: string;
      msgTitle: string;
      msgText: string;
    };
  }>;
  refreshParent?: boolean;
  showInIframe?: boolean;
  iframeUrl?: string;
}

export interface ProcessModalProps {
  open: boolean;
  onClose: () => void;
  button: ProcessButton | null;
  onConfirm: () => void;
  isExecuting: boolean;
  processResponse: ProcessResponse | null;
  confirmationMessage: string;
  cancelButtonText: string;
  executeButtonText: string;
  onProcessSuccess?: () => void;
}

export interface MessageStylesType {
  bgColor: string;
  borderColor: string;
  textColor: string;
  buttonBg: string;
}

export interface ProcessIframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  onProcessSuccess?: () => void;
}
