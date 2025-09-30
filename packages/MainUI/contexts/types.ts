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

import type { Etendo } from "@workspaceui/api-client/src/api/metadata";
import type {
  CurrentClient,
  CurrentOrganization,
  CurrentRole,
  CurrentWarehouse,
  ISession,
  Labels,
  LoginResponse,
  ProfileInfo,
  SessionResponse,
  Tab,
  User,
} from "@workspaceui/api-client/src/api/types";

export type Language = "en_US" | "es_ES";

export interface LanguageContextType {
  language: Language | null;
  prevLanguage: Language | null;
  setLanguage: (lang: Language) => void;
  setLabels: React.Dispatch<React.SetStateAction<Labels>>;
  getFlag: (language?: Language | null) => string;
  getLabel: (key: string) => string;
}

export interface DefaultConfiguration {
  defaultRole?: string;
  defaultWarehouse?: string;
  organization?: string;
  language?: string;
  client?: string;
}

export interface LanguageOption {
  id: string;
  language: string;
  name: string;
  key?: string;
}

export interface IUserContext {
  user: User;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  changeProfile: (params: { role?: string; warehouse?: string }) => Promise<LoginResponse | void>;
  token: string | null;
  roles: SessionResponse["roles"];
  currentRole: CurrentRole | undefined;
  prevRole: CurrentRole | undefined;
  profile: ProfileInfo;
  currentWarehouse: CurrentWarehouse | undefined;
  currentClient: CurrentClient | undefined;
  currentOrganization: CurrentOrganization | undefined;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  clearUserData: () => void;
  setDefaultConfiguration: (config: DefaultConfiguration) => Promise<void>;
  languages: LanguageOption[];
  session: ISession;
  setSession: React.Dispatch<React.SetStateAction<ISession>>;
  /** Indicates if session sync operations are loading */
  isSessionSyncLoading: boolean;
  /** Setter for session sync loading state */
  setSessionSyncLoading: React.Dispatch<React.SetStateAction<boolean>>;
  /** Indicates if Copilot is installed */
  isCopilotInstalled: boolean;
  /** Setter for Copilot installed state */
  setIsCopilotInstalled: React.Dispatch<React.SetStateAction<boolean>>;
  /** Text to show when login fails */
  loginErrorText: string;
  /** Setter for login error text */
  setLoginErrorText: React.Dispatch<React.SetStateAction<string>>;
  /** Description for login error */
  loginErrorDescription: string;
  /** Setter for login error description */
  setLoginErrorDescription: React.Dispatch<React.SetStateAction<string>>;
}

export interface IMetadataContext {
  windowId?: string;
  window?: Etendo.WindowMetadata;
  loading: boolean;
  error?: Error;
  groupedTabs: Etendo.Tab[][];
  tabs: Record<string, Tab>;
  refetch: () => Promise<Etendo.WindowMetadata>;
  removeRecord: (tabId: string, recordId: string) => void;
  emptyWindowDataName: () => void;
  loadWindowData: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getWindowMetadata: (windowId: string) => Etendo.WindowMetadata | undefined;
  getWindowTitle: (windowId: string) => string;
  isWindowLoading: (windowId: string) => boolean;
  getWindowError: (windowId: string) => Error | undefined;
  windowsData: Record<string, Etendo.WindowMetadata>;
  loadingWindows: Record<string, boolean>;
  errors: Record<string, Error | undefined>;
}
