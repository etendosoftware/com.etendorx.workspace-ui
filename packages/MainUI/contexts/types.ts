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
  EntityData,
} from '@workspaceui/etendohookbinder/src/api/types';
import { type Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';

export type Language = 'en_US' | 'es_ES';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getFlag: (language?: Language) => string;
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

// export interface IMetadataContext {
//   getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
//   getColumns: (tabId: string) => Etendo.Column[];
//   windowId: string;
//   recordId: string;
//   loading: boolean;
//   error: Error | undefined;
//   groupedTabs: Etendo.Tab[][];
//   selectedMultiple: Record<string, Record<string, EntityData>>;
//   selectMultiple: (records: EntityData[], tab: Tab) => void;
//   clearSelections: (tabId: string) => void;
//   tabs: Tab[];
//   tab?: Tab;
//   columns?: Record<string, Field>;
//   showTabContainer: boolean;
//   setShowTabContainer: (value: boolean | ((prev: boolean) => boolean)) => void;
//   activeTabLevels: number[];
//   setActiveTabLevels: (value: number[] | ((prev: number[]) => number[])) => void;
//   closeTab: (level: number) => void;
//   window?: Etendo.WindowMetadata;
//   refetch: () => Promise<void>;
//   removeRecord: (tabId: string, recordId: string) => void;
// }

export interface IMetadataContext {
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  window: Etendo.WindowMetadata | undefined;
  tabs: Etendo.Tab[];
  tab: Etendo.Tab | undefined;
  refetch: () => Promise<void>;
  removeRecord: (tabId: string, recordId: string) => void;
}
