import { Role, Warehouse } from '@workspaceui/etendohookbinder/src/api/types';

export type Language = 'es' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export interface DefaultConfiguration {
  defaultRole?: string;
  defaultWarehouse?: string;
  organization?: string;
  language?: string;
  client?: string;
}

export interface IUserContext {
  login: (username: string, password: string) => Promise<void>;
  changeRole: (roleId: string) => Promise<void>;
  changeWarehouse: (warehouseId: string) => Promise<void>;
  token: string | null;
  roles: Role[];
  currentRole: Role | null;
  currentWarehouse: Warehouse | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  clearUserData: () => void;
  setDefaultConfiguration: (token: string, config: DefaultConfiguration) => Promise<void>;
}
