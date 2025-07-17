"use client";

import { useCallback, useMemo } from "react";
import { useQueryParams } from "@/hooks/useQueryParams";
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

interface BreadcrumbProps {
  allTabs: Tab[][];
}

const AppBreadcrumb: React.FC<BreadcrumbProps> = ({ allTabs }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { window } = useMetadataContext();
  const { windowId } = useQueryParams<{ windowId: string }>();
  const { navigateToHome, clearTabFormState, getTabFormState } = useMultiWindowURL();
  const { graph } = useSelected();

  const allTabsFormatted = useMemo(() => allTabs.flat(), [allTabs]);
  const currentTab = useMemo(
    () => allTabsFormatted.find((tab) => tab.window === windowId),
    [allTabsFormatted, windowId]
  );

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowClick = useCallback(
    (windowId: string) => {
      const allTabsFormatted = allTabs.flat();
      const currentTab = allTabsFormatted.find((tab) => tab.window === windowId);
      if (windowId && currentTab && currentTab.id) {
        clearTabFormState(windowId, currentTab.id);
      }
      if (currentTab && graph) {
        graph.clear(currentTab);
        graph.clearSelected(currentTab);
      }
    },
    [clearTabFormState, allTabs, graph]
  );

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && window) {
      items.push({
        id: windowId,
        label: String(window.window$_identifier || window.name || t("common.loading")),
        onClick: () => handleWindowClick(windowId),
      });
    }

    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t("breadcrumb.newRecord"),
      });
    }

    if (currentTab) {
      const tabFormState = windowId ? getTabFormState(windowId, currentTab.id) : undefined;
      const currentRecordId = tabFormState?.recordId || "";

      if (currentRecordId && currentRecordId !== NEW_RECORD_ID) {
        items.push({
          id: currentRecordId.toString(),
          label: currentRecordId.toString(),
        });
      }
    }

    return items;
  }, [windowId, window, currentTab, isNewRecord, t, handleWindowClick, getTabFormState]);

  const handleHomeClick = useCallback(() => {
    navigateToHome();
  }, [navigateToHome]);

  return (
    <div className="w-full h-8">
      <Breadcrumb onHomeClick={handleHomeClick} items={breadcrumbItems || []} />
    </div>
  );
};

export default AppBreadcrumb;
