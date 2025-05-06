import { Field } from "@workspaceui/etendohookbinder/src/api/types";

export interface BaseButton {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
  field: Field;
}

export interface ProcessAction extends Record<string, unknown> {
  id: string;
  name: string;
}

export interface BaseProcessButton extends BaseButton {
  processId: string;
  buttonText: string;
  displayLogic?: string;
  processInfo: ProcessInfo;
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
  button: ProcessButton;
  onConfirm: () => void;
  isExecuting: boolean;
  processResponse: ProcessResponse | null;
  confirmationMessage: string;
  cancelButtonText: string;
  executeButtonText: string;
  onProcessSuccess?: () => void;
  tabId: string;
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
  tabId: string;
}

export interface ProcessDefinitionModalProps {
  onClose: () => void;
  open: boolean;
  button?: ProcessDefinitionButton | null;
  onSuccess?: () => void;
}

export interface ProcessDefinitionModalContentProps extends ProcessDefinitionModalProps {
  button: NonNullable<ProcessDefinitionModalProps['button']>;
}

export interface ProcessDeprecatedModallProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export interface ProcessInfo {
  loadFunction: string;
  searchKey: string;
  clientSideValidation: string;
  _entityName: string;
  id: string;
  name: string;
  javaClassName: string;
  parameters: Array<{
    defaultValue: string;
    id: string;
    name: string;
  }>;
}

export type ListOption = { id: string; label: string; value: string };

export type ProcessParameter = {
  defaultValue: string;
  id: string;
  name: string;
  refList: Array<ListOption>;
} & Record<string, string>;

export type ProcessParameters = Record<string, ProcessParameter>;

export interface ProcessDefinition extends Record<string, unknown> {
  id: string;
  name: string;
  javaClassName: string;
  parameters: ProcessParameters;
  onLoad: string;
  onProcess: string;
}
