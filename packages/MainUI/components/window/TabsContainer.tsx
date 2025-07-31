"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Tabs from "@/components/window/Tabs";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useSelected } from "@/hooks/useSelected";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import { useTranslation } from "@/hooks/useTranslation";
import AppBreadcrumb from "@/components/Breadcrums";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { shouldShowTab, type TabWithParentInfo } from "@/utils/tabUtils";

export default function TabsContainer() {
  const { activeLevels, clearAllStates } = useSelected();
  const { activeWindow } = useMultiWindowURL();
  const { getWindowMetadata } = useMetadataContext();
  const { t } = useTranslation();

  const [activeTabsByLevel, setActiveTabsByLevel] = useState<Map<number, string>>(new Map());

  const windowData = useMemo(() => {
    return activeWindow ? getWindowMetadata(activeWindow.windowId) : undefined;
  }, [activeWindow, getWindowMetadata]);

  useEffect(() => {
    if (activeWindow?.windowId) {
      clearAllStates();
      setActiveTabsByLevel(new Map());
    }
  }, [activeWindow?.windowId, clearAllStates]);

  const groupedTabs = useMemo(() => {
    return windowData ? groupTabsByLevel(windowData) : [];
  }, [windowData]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTabsByLevel((prev) => {
      const newMap = new Map(prev);
      newMap.set(tab.tabLevel, tab.id);
      return newMap;
    });
  }, []);

  const getActiveTabForLevel = useCallback(
    (level: number): Tab | null => {
      const tabGroup = groupedTabs.find((group) => group[0]?.tabLevel === level);
      if (!tabGroup || tabGroup.length === 0) return null;

      const activeTabId = activeTabsByLevel.get(level);
      if (activeTabId) {
        const activeTab = tabGroup.find((tab) => tab.id === activeTabId);
        if (activeTab) return activeTab;
      }

      return tabGroup[0];
    },
    [groupedTabs, activeTabsByLevel]
  );

  const filteredGroupedTabs = useMemo(() => {
    return groupedTabs.map((tabGroup) => {
      const currentLevel = tabGroup[0]?.tabLevel;

      if (currentLevel === 0) {
        return tabGroup;
      }

      const parentLevel = currentLevel - 1;
      const activeParentTab = getActiveTabForLevel(parentLevel);

      const filtered = tabGroup.filter((tab) => {
        const shouldShow = shouldShowTab(tab as TabWithParentInfo, activeParentTab);
        return shouldShow;
      });

      return filtered;
    });
  }, [groupedTabs, getActiveTabForLevel]);

  if (!windowData) {
    return <div>{t("common.loadingWindowContent")}</div>;
  }

  const firstExpandedIndex = filteredGroupedTabs.findIndex(
    (tabs) => tabs.length > 0 && activeLevels.includes(tabs[0].tabLevel)
  );

  return (
    <>
      <AppBreadcrumb allTabs={filteredGroupedTabs} />
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {filteredGroupedTabs.map((tabs, index) => {
          if (tabs.length === 0) return null;

          const isTopGroup = index === firstExpandedIndex && firstExpandedIndex !== -1;

          return <Tabs key={tabs[0].id} tabs={tabs} isTopGroup={isTopGroup} onTabChange={handleTabChange} />;
        })}
      </div>
    </>
  );
}
