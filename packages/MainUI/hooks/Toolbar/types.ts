import { BaseFieldDefinition, ToolbarButton } from '@workspaceui/etendohookbinder/src/api/types';
import { IconName } from '../../components/Toolbar/types';
import { ProcessActionButton, ProcessButton, ProcessDefinitionButton } from '@/components/ProcessModal/types';

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

export interface ToolbarResponseButton extends ToolbarButton {
  icon: IconName;
}

export interface ToolbarResponse {
  buttons: Array<ToolbarResponseButton>;
  windowId: string;
  isNew: boolean;
}
