import { ReactNode } from 'react';
import { SelectorListProps } from './ToggleSection/types';
import { Section } from './ToggleButton/types';

export interface User {
  photoUrl: string;
  name: string;
  email: string;
  sestionTooltip: string;
}

export interface ProfileModalProps extends SelectorListProps {
  icon: string | ReactNode;
  cancelButtonText?: string;
  saveButtonText?: string;
  tooltipButtonProfile?: string;
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sestionTooltip: string;
  sections: Section[];
}
