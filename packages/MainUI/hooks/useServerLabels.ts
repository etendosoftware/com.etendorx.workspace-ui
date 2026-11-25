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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language";
import { loadServerLabel } from "@/utils/serverLabels";

/**
 * Translated texts of AD_Messages that are not in the label catalog of the session (`meta/labels` only holds
 * the classic I18N labels). Classic reads them on demand with `OB.I18N.getLabelFromServer`.
 *
 * @param keys - Search keys of the messages; keep the array stable between renders
 * @param enabled - Whether the texts are needed yet; nothing is requested until they are
 * @returns The texts found, by key (a key is missing until its text arrives or when it does not exist)
 */
export function useServerLabels(keys: readonly string[], enabled = true): Record<string, string> {
  const { language } = useLanguage();
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    const sessionLanguage = language ?? "";
    Promise.all(keys.map(async (key) => [key, await loadServerLabel(sessionLanguage, key)] as const)).then(
      (entries) => {
        if (!cancelled) {
          setLabels(
            Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])))
          );
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [keys, enabled, language]);

  return labels;
}
