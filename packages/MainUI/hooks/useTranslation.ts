import { TranslateFunction } from './types';
import { useCallback } from 'react';
import translations from '@workspaceui/componentlibrary/src/locales';
import DEFAULT_LANGUAGE, { useLanguage } from '../contexts/language';

export const useTranslation = (defaultLanguage = DEFAULT_LANGUAGE) => {
  const { language } = useLanguage();

  const t = useCallback<TranslateFunction>(
    key => {
      const keys = key.split('.');
      let value: unknown = translations[language ?? defaultLanguage ?? 'en_US'];

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
    [language, defaultLanguage],
  );

  return { t };
};
