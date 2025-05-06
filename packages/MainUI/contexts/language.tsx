'use client';

import { createContext, useCallback, useContext, useMemo, useEffect } from 'react';
import { LanguageContextType, Language } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { getLanguageFlag } from '../utils/languageFlags';
import useLocalStorage from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { usePrevious } from '@/hooks/usePrevious';
import { useRouter } from 'next/navigation';

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useLocalStorage<Language | null>('language', null);
  const prevLanguage = usePrevious(language, language);
  const router = useRouter();

  const getFlag = useCallback(
    (lang?: Language | null) => {
      return getLanguageFlag(lang || language);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      getFlag,
      prevLanguage,
    }),
    [language, setLanguage, getFlag, prevLanguage],
  );

  useEffect(() => {
    if (language) {
      Metadata.setLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (language != prevLanguage) {
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
