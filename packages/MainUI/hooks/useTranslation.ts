import { useLanguage } from './useLanguage';
import { TranslateFunction } from './types';
import { useCallback, useMemo } from 'react';
import translations from '@workspaceui/componentlibrary/src/locales';

export const useTranslation = (defaultLanguage = 'en') => {
  const languageContext = useLanguage();
  const language = languageContext?.language || defaultLanguage;

  const t = useCallback<TranslateFunction>(
    key => {
      const keys = key.split('.');
      let value: unknown = translations[language ?? 'en_US'];

      for (const k of keys) {
        if (typeof value !== 'object' || value === null || !(k in value)) {
          console.warn(`Translation key "${key}" not found.`);
          return key;
        }
        value = value[k as keyof typeof value];
      }

      if (typeof value !== 'string') {
        console.warn(`Translation for key "${key}" is not a string.`);
        return key;
      }

      return value;
    },
    [language],
  );

  return useMemo(() => ({ t }), [t]);
};
