'use client';

import { createContext, useCallback, useContext, useState, useMemo, useEffect } from 'react';
import { LanguageContextType, Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { getLanguageFlag } from '../utils/languageFlags';
import { DEFAULT_LANGUAGE } from '@workspaceui/componentlibrary/src/locales';

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguageValue] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('currentLanguage');
      return (savedLanguage as Language) || DEFAULT_LANGUAGE;
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((lang: Language) => {
    if (lang) {
      localStorage.setItem('currentLanguage', lang);
      setLanguageValue(lang);
      Metadata.setLanguage(lang);
    }
  }, []);

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
