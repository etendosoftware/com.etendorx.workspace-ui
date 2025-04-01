export interface BaseButton {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
}

export interface ProcessDefinition extends Record<string, unknown> {
  id: string;
  name: string;
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
  parameters: Array<{
    defaultValue: string;
    id: string;
    name: string;
  }>;
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
  PROCESS_DEFINITION = 'processDefintion',
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
}
