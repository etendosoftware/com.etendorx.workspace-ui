'use client';

import { useCallback, useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { getLanguageFlag } from '../utils/languageFlags';

export const DEFAULT_LANGUAGE: Language = 'en_US';

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

  if (!language) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
