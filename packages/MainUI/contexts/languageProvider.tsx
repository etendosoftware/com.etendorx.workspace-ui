'use client';

import { useCallback, useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export const DEFAULT_LANGUAGE: Language = 'en_US';

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

  if (!language) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
