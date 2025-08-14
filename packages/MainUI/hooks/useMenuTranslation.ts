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

import type { NestedKeyOf } from "@workspaceui/componentlibrary/src/locales/types";
import type { TranslationKeys } from "./types";
import { useTranslation } from "./useTranslation";
import type { Menu } from "@workspaceui/api-client/src/api/types";

export const useMenuTranslation = () => {
  const { t } = useTranslation();

  const translateMenuItem = (item: Menu): string => {
    if (!item.name) return item._identifier || "";

    try {
      return item._identifier || t(item.name as NestedKeyOf<TranslationKeys>) || item.name;
    } catch {
      return item._identifier || item.name;
    }
  };

  return { translateMenuItem };
};
