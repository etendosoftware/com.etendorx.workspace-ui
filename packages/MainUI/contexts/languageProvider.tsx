'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

const DEFAULT_LANGUAGE: Language = 'en_US';

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguageValue] = useState<Language>(DEFAULT_LANGUAGE);

  const setLanguage = useCallback((lang: Language) => {
    if (lang) {
      localStorage.setItem('currentLanguage', lang);
      setLanguageValue(lang);
      Metadata.setLanguage(lang);
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('currentLanguage');

    if (savedLanguage) {
      setLanguage(savedLanguage as Language);
    } else {
      setLanguage(DEFAULT_LANGUAGE);
    }
  }, [setLanguage]);

  if (!language) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
