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

interface TabWithParentInfo extends Tab {
  parentTabId?: string;
  column?: string;
  active?: boolean;
}

function shouldShowTab(tab: TabWithParentInfo, activeParentTab: Tab | null): boolean {
  if (tab.tabLevel === 0) {
    return true;
  }

  if (!activeParentTab) {
    return false;
  }

  if (tab.active === false) {
    return false;
  }

  if (tab.parentTabId) {
    return tab.parentTabId === activeParentTab.id;
  }

  if (tab.parentColumns && tab.parentColumns.length > 0) {
    const parentEntityLower = activeParentTab.entityName?.toLowerCase() || "";
    const parentTableName = activeParentTab.table$_identifier?.toLowerCase() || "";

    return tab.parentColumns.some((parentColumn) => {
      const columnLower = parentColumn.toLowerCase();

      const normalizedColumn = columnLower.replace(/_id$/, "").replace(/[_-]/g, "");

      const normalizedEntity = parentEntityLower
        .replace(/^(fin|mgmt|financial|management)/gi, "")
        .replace(/([A-Z])/g, (p1, offset) => (offset > 0 ? `_${p1}` : p1))
        .toLowerCase()
        .replace(/[_-]/g, "");

      const normalizedTable = parentTableName.replace(/^c_/, "").replace(/[_-]/g, "");

      return (
        normalizedColumn.includes(normalizedEntity) ||
        normalizedEntity.includes(normalizedColumn) ||
        normalizedColumn.includes(normalizedTable) ||
        normalizedTable.includes(normalizedColumn)
      );
    });
  }

  return false;
}

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

      if (!activeParentTab || !activeLevels.includes(parentLevel)) {
        return [];
      }

      const filtered = tabGroup.filter((tab) => {
        const shouldShow = shouldShowTab(tab as TabWithParentInfo, activeParentTab);
        return shouldShow;
      });

      return filtered;
    });
  }, [groupedTabs, activeLevels, getActiveTabForLevel]);

  const firstExpandedIndex = useMemo(() => {
    return filteredGroupedTabs.findIndex((tabs) => tabs.length > 0 && activeLevels.includes(tabs[0].tabLevel));
  }, [filteredGroupedTabs, activeLevels]);

  if (!windowData) {
    return <div>{t("common.loadingWindowContent")}</div>;
  }

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
