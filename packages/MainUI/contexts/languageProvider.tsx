/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguageValue] = useState<any | null>(null);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('currentLanguage', lang);
    setLanguageValue(lang);
    Metadata.setLanguage(lang);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('currentLanguage');

    if (savedLanguage) {
      setLanguage(savedLanguage as Language);
    } else {
      setLanguage('en_US');
    }
  }, [setLanguage]);

  return <LanguageContext.Provider value={value}>{language ? children : null}</LanguageContext.Provider>;
}
