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
import { useRouter, useSearchParams } from "next/navigation";
import LinkedItems from "@workspaceui/componentlibrary/src/components/LinkedItems";
import { fetchLinkedItemCategories, fetchLinkedItems } from "@workspaceui/api-client/src/api/linkedItems";
import { useWindowContext } from "@/contexts/window";
import type { LinkedItem } from "@workspaceui/api-client/src/api/types";
import { useTranslation } from "@/hooks/useTranslation";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { appendWindowToUrl } from "@/utils/url/utils";

interface LinkedItemsSectionProps {
  tabId: string;
  entityName: string;
  recordId: string;
}

export const LinkedItemsSection = ({ entityName, recordId }: LinkedItemsSectionProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeWindow, triggerRecovery, isRecoveryLoading } = useWindowContext();

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

  /**
   * Handles click on a linked item to open it in a new window.
   * Uses URL-driven recovery approach to leverage existing recovery system.
   *
   * Flow:
   * 1. Prevents multiple clicks during recovery (loading guard)
   * 2. Generates new window identifier with timestamp
   * 3. Resets recovery guard to allow re-execution
   * 4. Appends new window parameters to URL
   * 5. Updates browser URL to trigger recovery
   * 6. Recovery system reconstructs complete window state
   *
   * @param item - Linked item containing window, tab, and record information
   */
  const handleItemClick = useCallback(
    (item: LinkedItem) => {
      // Guard: Prevent multiple rapid clicks during recovery
      if (isRecoveryLoading) {
        return;
      }

      // Generate unique window identifier
      const newWindowIdentifier = getNewWindowIdentifier(item.adWindowId);

      // Extract tab and record information
      const newTabId = item.adTabId;
      const newRecordId = item.id;

      // Trigger recovery mechanism (resets hasRun guard)
      triggerRecovery();

      // Build new URL with appended window (uses current URL params)
      const newUrlParams = appendWindowToUrl(searchParams, {
        windowIdentifier: newWindowIdentifier,
        tabId: newTabId,
        recordId: newRecordId,
      });

      // Update URL to trigger recovery
      const newUrl = `window?${newUrlParams}`;
      router.replace(newUrl);

      // Note: Recovery system will handle:
      // - Fetching window metadata
      // - Calculating tab hierarchy
      // - Reconstructing parent selections
      // - Setting window as active
      // - Showing loading state
      // Then WindowProvider's useEffect will rebuild complete URL from state
    },
    [searchParams, triggerRecovery, router, isRecoveryLoading]
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
