'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export const LanguageProvider = ({ children }: React.PropsWithChildren) => {
  const [language, setLanguageValue] = useState<Language>('en_US');

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('currentLanguage', lang);
    setLanguageValue(lang);
    Metadata.setLanguage(lang);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('currentLanguage');

    if (savedLanguage) {
      setLanguageValue(savedLanguage as Language);
    }
  }, []);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
