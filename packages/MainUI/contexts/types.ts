import type { Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CurrentClient,
  CurrentOrganization,
  CurrentRole,
  CurrentWarehouse,
  Field,
  ISession,
  Labels,
  LoginResponse,
  ProfileInfo,
  SessionResponse,
  Tab,
  User,
} from '@workspaceui/etendohookbinder/src/api/types';

export type Language = 'en_US' | 'es_ES';

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
  changeProfile: (params: { role?: string; warehouse?: string }) => Promise<LoginResponse | undefined>;
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
