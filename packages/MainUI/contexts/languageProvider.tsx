'use client';

import { useCallback, useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export const LanguageProvider = ({ children }: React.PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>('en');

  const handleLanguageChange = useCallback((value: Language) => {
    Metadata.setLanguage(value);
    setLanguage(value);
  }, []);

  const value = useMemo(() => ({ language, setLanguage: handleLanguageChange }), [handleLanguageChange, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
