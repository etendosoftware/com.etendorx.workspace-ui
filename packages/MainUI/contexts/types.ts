/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ISession,
  ProfileInfo,
  User,
  Field,
  Tab,
  LoginResponse,
  CurrentWarehouse,
  CurrentClient,
  CurrentRole,
  CurrentOrganization,
  SessionResponse,
} from '@workspaceui/etendohookbinder/src/api/types';
import { type Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';

export type Language = 'en_US' | 'es_ES';

export interface LanguageContextType {
  language: Language | null;
  prevLanguage: Language | null;
  setLanguage: (lang: Language) => void;
  getFlag: (language?: Language | null) => string;
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
  changeProfile: (params: { role?: string; warehouse?: string }) => Promise<LoginResponse | void>;
  token: string | null;
  roles: SessionResponse['roles'];
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
}

export interface IMetadataContext {
  windowId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  tabs: Record<string, Tab>;
  columns?: Record<string, Field>;
  window?: Etendo.WindowMetadata;
  refetch: () => Promise<void>;
  removeRecord: (tabId: string, recordId: string) => void;
}
