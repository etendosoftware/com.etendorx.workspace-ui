import { SelectorListProps } from "./ToggleSection/types";

export interface User {
  photoUrl: string;
  name: string;
  email: string;
}

export interface ProfileModalProps extends SelectorListProps{
  cancelButtonText?: string;
  saveButtonText?: string;
  tooltipButtonProfile?: string;
}
