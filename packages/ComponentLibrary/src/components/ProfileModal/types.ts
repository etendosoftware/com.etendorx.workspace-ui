import { ReactNode } from 'react';
import { Section } from './ToggleButton/types';
import { Item } from '../enums/index';
import { Role } from '../../../../MainUI/src/contexts/types';
import { Option } from '../Input/Select/types';

export interface User {
  photoUrl: string;
  name: string;
  email: string;
  sectionTooltip: string;
}

export interface ProfileModalProps extends SelectorListProps {
  icon: string | ReactNode;
  cancelButtonText?: string;
  saveButtonText?: string;
  tooltipButtonProfile?: string;
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sectionTooltip: string;
  sections: Section[];
}

export interface SelectorListProps {
  section: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  onRoleChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onWarehouseChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  roles: Role[];
  selectedRole: Option | null;
  selectedWarehouse: Option | null;
  saveAsDefault: boolean;
  onSaveAsDefaultChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export { Item };
