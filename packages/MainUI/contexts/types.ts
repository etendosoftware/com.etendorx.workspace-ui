import { ISession, ProfileInfo, Role, Warehouse, Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
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
  login: (username: string, password: string) => Promise<void>;
  changeRole: (roleId: string) => Promise<void>;
  changeWarehouse: (warehouseId: string) => Promise<void>;
  token: string | null;
  roles: Role[];
  currentRole: Role | null;
  profile: ProfileInfo;
  currentWarehouse: Warehouse | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  clearUserData: () => void;
  setDefaultConfiguration: (token: string, config: DefaultConfiguration) => Promise<void>;
  languages: LanguageOption[];
  session: ISession;
  setSession: React.Dispatch<React.SetStateAction<ISession>>;
}

export interface IMetadataContext {
  getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getColumns: (tabId: string) => Etendo.Column[];
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  selectRecord: (record: Record<string, never>, tab: Tab) => void;
  selected: Record<string, Record<string, never>>;
  selectedMultiple: Record<string, Record<string, boolean>>;
  selectMultiple: (recordIds: string[], tab: Tab, replace?: boolean) => void;
  isSelected: (recordId: string, tabId: string) => boolean;
  clearSelections: (tabId: string) => void;
  getSelectedCount: (tabId: string) => number;
  getSelectedIds: (tabId: string) => string[];
  tabs: Tab[];
  tab?: Tab;
  columns?: Record<string, Field>;
  fieldsByColumnName: Record<string, Field>;
  fieldsByInputName: Record<string, Field>;
  showTabContainer: boolean;
  setShowTabContainer: (value: boolean | ((prev: boolean) => boolean)) => void;
  activeTabLevels: number[];
  setActiveTabLevels: (value: number[] | ((prev: number[]) => number[])) => void;
  closeTab: (level: number) => void;
  window?: Etendo.WindowMetadata;
}
