import { BaseFieldDefinition, ToolbarButton } from '@workspaceui/etendohookbinder/src/api/types';
import { IconName, ProcessButton } from '../../components/Toolbar/types';

export interface ExecuteProcessParams {
  button: ProcessButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ToolbarResponseButton extends ToolbarButton {
  icon: IconName;
}

export interface ToolbarResponse {
  response: {
    buttons: Array<ToolbarResponseButton>;
    windowId: string;
    isNew: boolean;
  };
}
