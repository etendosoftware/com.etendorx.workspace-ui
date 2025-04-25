'use client';

import { createContext, useCallback, useContext, useMemo, useEffect } from 'react';
import { LanguageContextType, Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { getLanguageFlag } from '../utils/languageFlags';
import { DEFAULT_LANGUAGE } from '@workspaceui/componentlibrary/src/locales';
import useLocalStorage from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useLocalStorage('language', DEFAULT_LANGUAGE);

  const getFlag = useCallback(
    (lang?: Language) => {
      return getLanguageFlag(lang || language);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      getFlag,
    }),
    [language, setLanguage, getFlag],
  );

  useEffect(() => {
    Metadata.setLanguage(language);
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
