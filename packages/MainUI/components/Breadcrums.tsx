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

import { useCallback, useMemo } from "react";
import Breadcrumb from "@workspaceui/componentlibrary/src/components/Breadcrums";
import type { BreadcrumbItem } from "@workspaceui/componentlibrary/src/components/Breadcrums/types";
import { usePathname } from "next/navigation";
import type React from "react";
import { ROUTE_IDS } from "../constants/breadcrumb";
import { useMetadataContext } from "../hooks/useMetadataContext";
import { useTranslation } from "../hooks/useTranslation";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { useCurrentRecord } from "@/hooks/useCurrentRecord";
import { useWindowContext } from "@/contexts/window";

interface BreadcrumbProps {
  allTabs: Tab[][];
}

const AppBreadcrumb: React.FC<BreadcrumbProps> = ({ allTabs }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { window, windowId, windowIdentifier } = useMetadataContext();
  const { navigateToHome } = useMultiWindowURL();
  const { getTabFormState, clearTabFormState } = useWindowContext();
  const { graph } = useSelected();

  const allTabsFormatted = useMemo(() => allTabs.flat(), [allTabs]);
  const currentTab = useMemo(() => {
    if (!windowId || allTabsFormatted.length === 0) return undefined;

    const normalizedWindowId = windowId.split("_")[0];

    let tab = allTabsFormatted.find((tab) => tab.window === normalizedWindowId);

    if (!tab && window && window.window$_identifier === normalizedWindowId) {
      tab = allTabsFormatted[0];
    }

    if (!tab) {
      tab = allTabsFormatted.find((t) => t.window$_identifier === normalizedWindowId);
    }

    return tab;
  }, [allTabsFormatted, windowId, window]);

  const tabFormState = useMemo(() => {
    if (!currentTab) return undefined;

    return (
      getTabFormState(currentTab.window, currentTab.id) ||
      getTabFormState(windowId || "", currentTab.id) ||
      getTabFormState(currentTab.window$_identifier || currentTab.window, currentTab.id)
    );
  }, [currentTab, windowId, getTabFormState]);

  const currentRecordId = useMemo(() => {
    return tabFormState?.recordId || (graph?.getSelected?.(currentTab)?.[0] as string) || "";
  }, [tabFormState, graph, currentTab]);

  const { record } = useCurrentRecord({
    tab: currentTab,
    recordId: currentRecordId,
  });

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowClick = useCallback(
    (windowIdentifier: string) => {
      const allTabsFormatted = allTabs.flat();
      const currentTab = allTabsFormatted.find((tab) => tab.window === windowId);
      if (windowIdentifier && currentTab && currentTab.id) {
        clearTabFormState(windowIdentifier, currentTab.id);
      }
      if (currentTab && graph) {
        graph.clear(currentTab);
        graph.clearSelected(currentTab);
      }
    },
    [clearTabFormState, allTabs, graph, windowId]
  );

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && window && windowIdentifier) {
      items.push({
        id: windowId,
        label: String(window.window$_identifier || window.name || t("common.loading")),
        onClick: () => handleWindowClick(windowIdentifier),
      });
    }

    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t("breadcrumb.newRecord"),
      });
    }

    if (currentTab) {
      const tabFormState = windowIdentifier ? getTabFormState(windowIdentifier, currentTab.id) : undefined;
      const currentRecordId = tabFormState?.recordId || "";
      const currentLabel = record?._identifier?.toString();

      if (currentRecordId && currentLabel && currentRecordId !== NEW_RECORD_ID) {
        items.push({
          id: currentRecordId.toString(),
          label: currentLabel,
        });
      }
    }

    return items;
  }, [
    windowId,
    windowIdentifier,
    window,
    currentTab,
    record?._identifier,
    isNewRecord,
    t,
    handleWindowClick,
    getTabFormState,
  ]);

  const handleHomeClick = useCallback(() => {
    navigateToHome();
  }, [navigateToHome]);

  return (
    <div className="w-full h-8">
      <Breadcrumb onHomeClick={handleHomeClick} items={breadcrumbItems || []} data-testid="Breadcrumb__50ef19" />
    </div>
  );
};

export default AppBreadcrumb;
