import { ISession, Role, Warehouse } from '@workspaceui/etendohookbinder/src/api/types';

export type Language = 'en_US' | 'es_ES';

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

export interface LanguageOption {
  id: string;
  language: string;
  name: string;
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
  languages: LanguageOption[];
  session: ISession;
  setSession: React.Dispatch<React.SetStateAction<ISession>>;
}
