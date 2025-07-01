"use client";

import { useEffect, useMemo } from "react";
import Tabs from "@/components/window/Tabs";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useSelected } from "@/hooks/useSelected";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import { useTranslation } from "@/hooks/useTranslation";
import AppBreadcrumb from "@/components/Breadcrums";

export default function TabsContainer() {
  const { activeLevels, clearAllStates } = useSelected();
  const { activeWindow } = useMultiWindowURL();
  const { getWindowMetadata } = useMetadataContext();
  const { t } = useTranslation();

  const windowData = useMemo(() => {
    return activeWindow ? getWindowMetadata(activeWindow.windowId) : undefined;
  }, [activeWindow, getWindowMetadata]);

  useEffect(() => {
    if (activeWindow?.windowId) {
      clearAllStates();
    }
  }, [activeWindow?.windowId, clearAllStates]);

  if (!windowData) {
    return <div>{t("common.loadingWindowContent")}</div>;
  }

  const groupedTabs = groupTabsByLevel(windowData);
  const firstExpandedIndex = groupedTabs.findIndex((tabs) => activeLevels.includes(tabs[0].tabLevel));

  return (
    <div className="flex flex-col w-full h-full max-h-full">
      <AppBreadcrumb allTabs={groupedTabs} />
      {groupedTabs.map((tabs, index) => {
        const isTopGroup = index === firstExpandedIndex && firstExpandedIndex !== -1;

        return <Tabs key={tabs[0].id} tabs={tabs} isTopGroup={isTopGroup} />;
      })}
    </div>
  );
}
