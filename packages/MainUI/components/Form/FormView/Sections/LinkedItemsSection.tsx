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
import { FORM_MODES } from "@/utils/url/constants";
import type { LinkedItem } from "@workspaceui/api-client/src/api/types";

interface LinkedItemsSectionProps {
  windowId: string;
  entityName: string;
  recordId: string;
}

export const LinkedItemsSection = ({ windowId, entityName, recordId }: LinkedItemsSectionProps) => {
  const { openWindowAndSelect } = useMultiWindowURL();

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
      openWindowAndSelect(item.adWindowId, {
        selection: {
          tabId: item.adTabId,
          recordId: item.id,
          openForm: true,
          formMode: FORM_MODES.EDIT,
        },
      });
    },
    [openWindowAndSelect]
  );

  return (
    <LinkedItems
      windowId={windowId}
      entityName={entityName}
      recordId={recordId}
      onFetchCategories={handleFetchCategories}
      onFetchItems={handleFetchItems}
      onItemClick={handleItemClick}
      data-testid="LinkedItems__92af80"
    />
  );
};

export default LinkedItemsSection;
