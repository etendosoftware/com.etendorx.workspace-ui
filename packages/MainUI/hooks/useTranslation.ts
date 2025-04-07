import { useLanguage } from './useLanguage';
import { TranslateFunction } from './types';
import { useCallback } from 'react';
import translations from '@workspaceui/componentlibrary/src/locales';
import DEFAULT_LANGUAGE from '../contexts/languageProvider';

export const useTranslation = (defaultLanguage = DEFAULT_LANGUAGE) => {
  const languageContext = useLanguage();
  const language = languageContext?.language || defaultLanguage;

  const t = useCallback<TranslateFunction>(
    key => {
      const keys = key.split('.');
      let value: unknown = translations[language ?? 'en_US'];

      for (const k of keys) {
        if (typeof value !== 'object' || value === null || !(k in value)) {
          return key;
        }
        value = value[k as keyof typeof value];
      }

      if (typeof value !== 'string') {
        return key;
      }

      return value;
    },
    [language],
  );

  return { t };
};
