'use client';

import { usePrevious } from '@/hooks/usePrevious';
import useLocalStorage from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import type { Labels } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLanguageFlag } from '../utils/languageFlags';
import type { Language, LanguageContextType } from './types';

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useLocalStorage<Language | null>('language', null);
  const [labels, setLabels] = useState<Labels>({});
  const prevLanguage = usePrevious(language);
  const router = useRouter();

  const getFlag = useCallback(
    (lang?: Language | null) => {
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
      prevLanguage,
      getLabel,
    }),
    [language, setLanguage, getFlag, prevLanguage, getLabel],
  );

  useEffect(() => {
    if (language) {
      Metadata.setLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (prevLanguage && language !== prevLanguage) {
      router.push('/');
    }
  }, [language, prevLanguage, router]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
