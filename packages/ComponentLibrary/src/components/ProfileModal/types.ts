import { ReactNode } from 'react';
import { Section } from './ToggleButton/types';
import { Item } from '../enums/index';
import { Option } from '../Input/Select/types';
import { Role } from '@workspaceui/etendohookbinder/src/api/types';

export interface User {
  photoUrl: string;
  name: string;
  email: string;
  sectionTooltip: string;
}

interface Logger {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}

interface Warehouse {
  id: string;
  name: string;
}

interface DefaultConfiguration {
  defaultRole?: string;
  defaultWarehouse?: string;
  organization?: string;
  language?: string;
  client?: string;
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
  currentRole: Role | null;
  currentWarehouse: Warehouse | null;
  roles: Role[];
  onChangeRole: (roleId: string) => Promise<void>;
  onChangeWarehouse: (warehouseId: string) => Promise<void>;
  onSetDefaultConfiguration: (config: DefaultConfiguration) => Promise<void>;
  logger: Logger;
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
