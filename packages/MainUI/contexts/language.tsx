'use client';

import { createContext, useCallback, useContext, useMemo, useEffect, useState } from 'react';
import { LanguageContextType, Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { getLanguageFlag } from '../utils/languageFlags';
import { DEFAULT_LANGUAGE } from '@workspaceui/componentlibrary/src/locales';
import useLocalStorage from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { Labels } from '@workspaceui/etendohookbinder/src/api/types';

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useLocalStorage('language', DEFAULT_LANGUAGE);
  const [labels, setLabels] = useState<Labels>({});

  const getFlag = useCallback(
    (lang?: Language) => {
      return getLanguageFlag(lang || language);
    },
    [language],
  );

  const getLabel = useCallback((label: string) => labels[label] ?? label, [labels]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      setLabels,
      getFlag,
      getLabel,
    }),
    [language, setLanguage, setLabels, getFlag, getLabel],
  );

  useEffect(() => {
    if (language) {
      Metadata.setLanguage(language);
    }
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
