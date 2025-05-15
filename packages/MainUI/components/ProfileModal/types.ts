import { ReactNode } from 'react';
import { Section } from './ToggleButton/types';
import { Option } from '@workspaceui/componentlibrary/src/components/Input/Select/types';
import { Language } from '@workspaceui/componentlibrary/src/locales/types';
import {
  CurrentOrganization,
  CurrentRole,
  CurrentWarehouse,
  LoginResponse,
  SessionResponse,
} from '@workspaceui/etendohookbinder/src/api/types';
import { Logger } from '@/utils/logger';

export interface Translations {
  saveAsDefault: string;
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
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sections: Section[];
  section: string;
  translations: Translations;
}

export interface SelectionProps {
  saveAsDefault: boolean;
  onSaveAsDefaultChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ActionProps {
  onChangeRole?: (roleId: string) => Promise<void>;
  onChangeWarehouse?: (warehouseId: string) => Promise<void>;
  onSetDefaultConfiguration: (config: BaseDefaultConfiguration) => Promise<void>;
}

export interface LanguageOption {
  id: string;
  language: string;
  name: string;
}
export interface ProfileModalProps extends BaseProfileModalProps, SelectionProps, ActionProps {
  currentRole: CurrentRole | undefined;
  currentWarehouse: CurrentWarehouse | undefined;
  currentOrganization: CurrentOrganization | undefined;
  roles: SessionResponse['roles'];
  logger: Logger;
  onSignOff: () => void;
  onLanguageChange: (e: Language) => void;
  language: string | null;
  languages: LanguageOption[];
  languagesFlags: string;
  changeProfile: (params: { role?: string; warehouse?: string }) => Promise<LoginResponse | void>;
}

export interface UserProfileProps {
  photoUrl: string;
  name: string;
  email: string;
  onSignOff: () => void;
}

export interface SelectorListProps {
  section: string;
  onRoleChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onWarehouseChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onOrgChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  roles: SessionResponse['roles'];
  selectedRole: Option | null;
  selectedWarehouse: Option | null;
  selectedClient: Option | null;
  selectedOrg: Option;
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
