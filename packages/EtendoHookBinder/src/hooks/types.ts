import { ToolbarButton } from '../api/types';

export interface ToolbarResponseButton extends ToolbarButton {
  icon: string;
}

export interface ToolbarResponse {
  response: {
    buttons: Array<ToolbarResponseButton>;
    windowId: string;
    isNew: boolean;
  };
}
