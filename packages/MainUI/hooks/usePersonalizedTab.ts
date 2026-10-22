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

import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { useFormPersonalization } from "@/hooks/useFormPersonalization";
import { applyFormPersonalization } from "@/utils/form/formPersonalization";

/**
 * The tab with the form personalization of the session applied to its fields, so the form built from it
 * shows the personalized order, visibility, sections, columns, status bar and initial focus.
 *
 * It is the same tab object until a personalization applies, which keeps unpersonalized forms untouched.
 */
export function usePersonalizedTab(tab: Tab): Tab {
  const { personalization } = useFormPersonalization(tab?.id);
  const form = personalization?.form;

  return useMemo(() => {
    if (!tab?.fields || !form) {
      return tab;
    }
    const fields = applyFormPersonalization(tab.fields, form);
    return fields === tab.fields ? tab : { ...tab, fields };
  }, [tab, form]);
}

export default usePersonalizedTab;
