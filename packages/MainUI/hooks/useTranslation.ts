/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
    [language, defaultLanguage]
  );

  return { t };
};
