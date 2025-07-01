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
import { styles } from "./styles";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useSelected } from "@/hooks/useSelected";

interface BreadcrumbProps {
  allTabs: Tab[][];
}

const AppBreadcrumb: React.FC<BreadcrumbProps> = ({ allTabs }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { window } = useMetadataContext();
  const { windowId } = useQueryParams<{ windowId: string }>();
  const { navigateToHome, clearTabFormState } = useMultiWindowURL();
  const { graph } = useSelected();

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowClick = useCallback(
    (windowId: string) => {
      const allTabsFormatted = allTabs.flat();
      const currentTab = allTabsFormatted.find((tab) => tab.window === windowId);
      if (windowId && currentTab?.id) {
        clearTabFormState(windowId, currentTab.id);
      }
      if (currentTab) {
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

    return items;
  }, [windowId, window, isNewRecord, t, handleWindowClick]);

  const handleHomeClick = useCallback(() => {
    navigateToHome();
  }, [navigateToHome]);

  return (
    <div style={styles.breadCrum}>
      <Breadcrumb onHomeClick={handleHomeClick} items={breadcrumbItems} />
    </div>
  );
};

export default AppBreadcrumb;
