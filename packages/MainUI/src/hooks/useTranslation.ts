import { useLanguage } from './useLanguage';
import translations from '../../../ComponentLibrary/src/locales';
import { TranslateFunction, Translations } from './types';
import { useCallback, useMemo } from 'react';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t: TranslateFunction = useCallback(
    key => {
      const keys = key.split('.');
      let value: unknown = (translations as Translations)[language];

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
