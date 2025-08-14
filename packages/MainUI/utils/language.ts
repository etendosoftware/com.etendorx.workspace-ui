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

import { DEFAULT_LANGUAGE, translations, type Language } from "@workspaceui/componentlibrary/src/locales";

export const t = (
  language: Language,
  key: string,
  value: unknown = translations[language] ?? translations[DEFAULT_LANGUAGE]
): string => {
  if (!language) {
    language = DEFAULT_LANGUAGE;
  }

  const keys = key.split(".");
  const [currentKey, ...remainingKeys] = keys;

  if (typeof value !== "object" || value === null || !(currentKey in value)) {
    return key;
  }

  const nextValue = value[currentKey as keyof typeof value];

  if (remainingKeys.length === 0) {
    return typeof nextValue === "string" ? nextValue : key;
  }

  return t(language, remainingKeys.join("."), nextValue);
};

export const getLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const savedLanguage = localStorage.getItem("currentLanguage");

    return (savedLanguage as Language) || DEFAULT_LANGUAGE;
  }

  return DEFAULT_LANGUAGE;
};
