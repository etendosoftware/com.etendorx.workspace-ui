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

import { useCallback } from "react";
import LinkedItems from "@workspaceui/componentlibrary/src/components/LinkedItems";
import { fetchLinkedItemCategories, fetchLinkedItems } from "@workspaceui/api-client/src/api/linkedItems";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import type { LinkedItem } from "@workspaceui/api-client/src/api/types";
import { useTranslation } from "@/hooks/useTranslation";

interface LinkedItemsSectionProps {
  tabId: string;
  entityName: string;
  recordId: string;
}

export const LinkedItemsSection = ({ tabId, entityName, recordId }: LinkedItemsSectionProps) => {
  const { openWindow } = useMultiWindowURL();
  const { t } = useTranslation();
  const { activeWindow } = useMultiWindowURL();

  const handleFetchCategories = useCallback(
    async (params: { windowId: string; entityName: string; recordId: string }) => {
      return await fetchLinkedItemCategories(params);
    },
    []
  );

  const handleFetchItems = useCallback(
    async (params: {
      windowId: string;
      entityName: string;
      recordId: string;
      adTabId: string;
      tableName: string;
      columnName: string;
    }) => {
      return await fetchLinkedItems(params);
    },
    []
  );

  const handleItemClick = useCallback(
    (item: LinkedItem) => {
      const currentRecord = {
        tabId: tabId,
        recordId: recordId,
      };
      const newRecord = {
        tabId: item.adTabId,
        recordId: item.id,
      }
      const selectedRecords = [
        currentRecord,
        newRecord
      ];
      const tabFormStates = [
        {
          tabId: newRecord.tabId,
          tabFormState: { recordId: newRecord.recordId }
        }
      ]
      openWindow(item.adWindowId, item.adMenuName, selectedRecords, tabFormStates)
    },
    [tabId, recordId, openWindow]
  );

  return (
    <LinkedItems
      windowId={activeWindow?.windowId || ""}
      entityName={entityName}
      recordId={recordId}
      onFetchCategories={handleFetchCategories}
      onFetchItems={handleFetchItems}
      onItemClick={handleItemClick}
      loadingText={t("common.loading")}
      noCategoriesText={t("forms.sections.noCategories")}
      noSelectedCategoryText={t("forms.sections.selectCategory")}
      data-testid="LinkedItems__92af80"
    />
  );
};

export default LinkedItemsSection;
