import type { TranslateFunction } from "./types";
import { useCallback } from "react";
import translations, { DEFAULT_LANGUAGE } from "@workspaceui/componentlibrary/src/locales";
import { useLanguage } from "../contexts/language";

export const useTranslation = (defaultLanguage = DEFAULT_LANGUAGE) => {
  const { language } = useLanguage();

  const t = useCallback<TranslateFunction>(
    (key) => {
      const keys = key.split(".");
      let value: unknown = translations[language ?? defaultLanguage ?? DEFAULT_LANGUAGE];

      for (const k of keys) {
        if (typeof value !== "object" || value === null || !(k in value)) {
          return key;
        }
        value = value[k as keyof typeof value];
      }

      if (typeof value !== "string") {
        return key;
      }

      return value;
    },
    [language, defaultLanguage],
  );

  return { t };
};
