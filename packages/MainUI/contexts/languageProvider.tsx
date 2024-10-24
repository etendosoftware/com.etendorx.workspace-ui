'use client';

import { useMemo, useState } from 'react';
import LanguageContext from './languageContext';
import { Language } from './types';

export const LanguageProvider = ({ children }: React.PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>('en');
  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
