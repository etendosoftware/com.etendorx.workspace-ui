"use client";

import { useEffect } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { NavigationTabsUtils } from "@/utils/navigationTabsUtils";

/**
 * Hook para actualizar metadatos de tabs basado en la ventana actual
 */
export function useWindowTabMetadata() {
  const { updateTabTitle, activeTabId, getTabById, updateTabMetadata } = useNavigationTabs();
  const { window, loading } = useMetadataContext();

  useEffect(() => {
    if (window && !loading) {
      const activeTab = getTabById(activeTabId);

      if (activeTab && activeTab.type === "window" && activeTab.windowId === window.id) {
        // Actualizar título con información más inteligente
        const windowName = window.window$_identifier || window.name;

        if (windowName && (activeTab.title === "Loading..." || activeTab.title !== windowName)) {
          const smartTitle = NavigationTabsUtils.generateSmartTitle(
            windowName,
            activeTab.recordId,
            window.tabs[0]?.entityName
          );

          updateTabTitle(activeTabId, smartTitle);

          updateTabMetadata(activeTabId, {
            ...activeTab.metadata,
            entityName: window.tabs[0]?.entityName,
          });
        }
      }
    }
  }, [window, loading, activeTabId, getTabById, updateTabTitle, updateTabMetadata]);
}
