import { BaseFieldDefinition, ToolbarButton } from '@workspaceui/etendohookbinder/src/api/types';
import { IconName } from '../../components/Toolbar/types';
import { ProcessButton } from '@workspaceui/componentlibrary/src/components/ProcessModal/types';

export interface ExecuteProcessParams {
  button: ProcessButton;
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
