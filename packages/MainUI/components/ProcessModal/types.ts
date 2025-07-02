import type { ProcessConfigResponse } from "@/hooks/datasource/useProcessDatasourceConfig";
import type { EntityData, EntityValue, ProcessParameter, Tab } from "@workspaceui/api-client/src/api/types";
import type { Field, ProcessAction } from "@workspaceui/api-client/src/api/types";
import type { MRT_Row, MRT_RowData, MRT_TableBodyRowProps, MRT_TableInstance } from "material-react-table";

export interface BaseButton extends Field {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
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
  PROCESS_DEFINITION = "processDefinition",
  PROCESS_ACTION = "processAction",
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

export interface MessageStylesType {
  bgColor: string;
  borderColor: string;
  textColor: string;
  buttonBg: string;
}

export interface ProcessIframeModalClosedProps {
  isOpen: false;
}

export interface ProcessIframeModalOpenProps {
  isOpen: true;
  url?: string;
  title?: string;
  tabId: string;
  onProcessSuccess?: () => void;
  onClose: () => void;
}

export type ProcessIframeModalProps = ProcessIframeModalClosedProps | ProcessIframeModalOpenProps;

export const isIframeModalOpen = (props: ProcessIframeModalProps): props is ProcessIframeModalOpenProps => {
  return props.isOpen === true;
};

export interface ProcessDefinitionModalProps {
  onClose: () => void;
  open: boolean;
  button?: ProcessDefinitionButton | null;
  onSuccess?: () => void;
  onError?: () => void;
}

export interface ProcessDefinitionModalContentProps extends ProcessDefinitionModalProps {
  button: NonNullable<ProcessDefinitionModalProps["button"]>;
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

export type ProcessParameters = Record<string, ProcessParameter>;

export interface ProcessDefinition extends Record<string, unknown> {
  id: string;
  name: string;
  javaClassName: string;
  parameters: ProcessParameters;
  onLoad: string;
  onProcess: string;
}
export interface ResponseMessage {
  msgText: string;
  msgTitle: string;
  msgType: string;
}

//Window References types

export type RecordValues = { [key: string]: EntityValue };
export interface WindowReferenceGridProps {
  parameter: ProcessParameter;
  onSelectionChange: (selection: unknown[]) => void;
  entityName?: EntityValue;
  recordId?: EntityValue;
  tabId: string;
  windowReferenceTab: Tab;
  windowId?: string;
  processConfig?: ProcessConfigResponse | null;
  processConfigLoading: boolean;
  processConfigError: Error | null;
}

export type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<MRT_RowData>, "staticRowIndex">;

export const isProcessActionButton = (button: ProcessButton): button is ProcessActionButton =>
  ProcessButtonType.PROCESS_ACTION in button;

export const isProcessDefinitionButton = (button: ProcessButton): button is ProcessDefinitionButton =>
  ProcessButtonType.PROCESS_DEFINITION in button;
