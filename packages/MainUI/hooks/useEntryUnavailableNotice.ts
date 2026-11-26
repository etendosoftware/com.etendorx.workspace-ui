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

import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveCatalogLabel } from "@/utils/catalogLabel";
import { ENTRY_UNAVAILABLE_MESSAGE } from "@/utils/menu/menuAvailability";

/**
 * Tells the user that a favorite or a recently visited entry cannot be opened with the current role.
 *
 * @returns A function that shows the message
 */
export function useEntryUnavailableNotice() {
  const { getLabel } = useLanguage();
  const { t } = useTranslation();

  return useCallback(() => {
    toast.warning(resolveCatalogLabel(ENTRY_UNAVAILABLE_MESSAGE, "dashboard.entryUnavailable", { getLabel, t }));
  }, [getLabel, t]);
}
