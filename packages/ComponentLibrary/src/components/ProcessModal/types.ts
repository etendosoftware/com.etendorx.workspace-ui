import { ProcessBindings, ProcessInfo } from '@workspaceui/etendohookbinder/src/api/types';

export interface BaseButton {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
}

export interface ProcessButton extends BaseButton {
  processId: string;
  buttonText: string;
  displayLogic?: string;
  processInfo: ProcessInfo;
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
  process: ProcessBindings;
}
