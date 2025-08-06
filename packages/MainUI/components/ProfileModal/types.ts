/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Logger } from "@/utils/logger";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { Language } from "@workspaceui/componentlibrary/src/locales/types";
import type {
  CurrentOrganization,
  CurrentRole,
  CurrentWarehouse,
  LoginResponse,
  SessionResponse,
} from "@workspaceui/api-client/src/api/types";
import type { ReactNode } from "react";
import type { Section } from "./ToggleButton/types";

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
  roles: SessionResponse["roles"];
  logger: Logger;
  onSignOff: () => void;
  onLanguageChange: (e: Language) => void;
  language: string | null;
  languages: LanguageOption[];
  languagesFlags: string;
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
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
  roles: SessionResponse["roles"];
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
