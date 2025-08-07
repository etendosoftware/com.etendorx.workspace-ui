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

"use client";

import { usePrevious } from "@/hooks/usePrevious";
import useLocalStorage from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Labels } from "@workspaceui/api-client/src/api/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLanguageFlag } from "../utils/languageFlags";
import type { Language, LanguageContextType } from "./types";

export const LanguageContext = createContext({} as LanguageContextType);

export default function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useLocalStorage<Language | null>("language", null);
  const [labels, setLabels] = useState<Labels>({});
  const prevLanguage = usePrevious(language);
  const router = useRouter();

  const getFlag = useCallback(
    (lang?: Language | null) => {
      return getLanguageFlag(lang || language);
    },
    [language]
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
    [language, setLanguage, getFlag, prevLanguage, getLabel]
  );

  useEffect(() => {
    if (language) {
      Metadata.setLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (prevLanguage && language !== prevLanguage) {
      router.push("/");
    }
  }, [language, prevLanguage, router]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};
