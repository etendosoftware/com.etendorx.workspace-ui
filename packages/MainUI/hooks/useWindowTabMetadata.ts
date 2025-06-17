"use client";

import { useEffect } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { NavigationTabsUtils } from "@/utils/navigationTabsUtils";

/**
 * Hook to update metadata
 */
export function useWindowTabMetadata() {
  const { updateTabTitle, getActiveTab, updateTabMetadata } = useNavigationTabs();
  const { window, loading } = useMetadataContext();

  useEffect(() => {
    if (window && !loading) {
      const activeTab = getActiveTab();

      console.log("useWindowTabMetadata - Effect triggered:", {
        hasWindow: !!window,
        hasActiveTab: !!activeTab,
        activeTabType: activeTab?.type,
        activeTabWindowId: activeTab?.windowId,
        windowId: window.id,
        windowName: window.name || window.window$_identifier,
      });

      if (activeTab && activeTab.type === "window" && activeTab.windowId === window.id) {
        const windowName = window.window$_identifier || window.name;

        if (windowName && activeTab.title === "Loading...") {
          const smartTitle = NavigationTabsUtils.generateSmartTitle(
            windowName,
            activeTab.recordId,
            window.tabs[0]?.entityName
          );

          console.log("useWindowTabMetadata - Updating title to:", smartTitle);

          updateTabTitle(activeTab.id, smartTitle);

          updateTabMetadata(activeTab.id, {
            entityName: window.tabs[0]?.entityName,
          });
        }
      }
    }
  }, [window, loading, getActiveTab, updateTabTitle, updateTabMetadata]);
}
