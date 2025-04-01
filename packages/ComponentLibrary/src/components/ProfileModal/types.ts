import { ReactNode } from 'react';
import { Section } from './ToggleButton/types';
import { Option } from '../Input/Select/types';
import { Language } from '../../locales/types';
import { LoginResponse } from '@workspaceui/etendohookbinder/src/api/types';

export interface Translations {
  saveAsDefault: string;
}

export interface Logger {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}

export interface BaseUser {
  photoUrl: string;
  name: string;
  email: string;
  sectionTooltip: string;
}

export interface BaseRole {
  id: string;
  name: string;
  orgList: Array<{
    id: string;
    name: string;
    warehouseList: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

export interface BaseWarehouse {
  id: string;
  name: string;
}

export interface BaseDefaultConfiguration {
  defaultRole?: string;
  defaultWarehouse?: string;
  organization?: string;
  language?: string;
  client?: string;
}

export interface BaseProfileModalProps {
  icon: string | ReactNode;
  cancelButtonText?: string;
  saveButtonText?: string;
  tooltipButtonProfile?: string;
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sectionTooltip: string;
  sections: Section[];
  section: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  translations: Translations;
}

export interface SelectionProps {
  onRoleChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onWarehouseChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  selectedRole: Option | null;
  selectedWarehouse: Option | null;
  saveAsDefault: boolean;
  onSaveAsDefaultChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ActionProps {
  onChangeRole: (roleId: string) => Promise<void>;
  onChangeWarehouse: (warehouseId: string) => Promise<void>;
  onSetDefaultConfiguration: (config: BaseDefaultConfiguration) => Promise<void>;
}

export interface LanguageOption {
  id: string;
  language: string;
  name: string;
}
export interface ProfileModalProps extends BaseProfileModalProps, SelectionProps, ActionProps {
  token: string;
  currentRole: BaseRole | null;
  currentWarehouse: BaseWarehouse | null;
  roles: BaseRole[];
  logger: Logger;
  onSignOff: () => void;
  onLanguageChange: (e: Language) => void;
  language: string;
  languages: LanguageOption[];
  languagesFlags: string;
  changeProfile: (params: { role?: string; warehouse?: string }) => Promise<LoginResponse>;
}

export interface UserProfileProps {
  photoUrl: string;
  name: string;
  email: string;
  sectionTooltip: string;
  onSignOff: () => void;
}

export interface SelectorListProps {
  section: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  onRoleChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onWarehouseChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  roles: BaseRole[];
  selectedRole: Option | null;
  selectedWarehouse: Option | null;
  onLanguageChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  selectedLanguage: Option | null;
  languages: Array<{
    id: string;
    language: string;
    name: string;
  }>;
  saveAsDefault: boolean;
  onSaveAsDefaultChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  translations: Translations;
  languagesFlags: string;
}
