export type Language = 'es' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export interface Role {
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

export interface IUserContext {
  login: (username: string, password: string) => Promise<void>;
  changeRole: (roleId: string) => Promise<void>;
  token: string | null;
  roles: Role[];
  currentRole: Role | null;
}
