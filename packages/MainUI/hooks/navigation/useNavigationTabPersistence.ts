"use client";

import { useEffect, useCallback } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";
import { NavigationTabsUtils } from "@/utils/navigationTabsUtils";

/**
 * Hook para manejar la persistencia de tabs
 */
export function useNavigationTabPersistence() {
  const { tabs, openTab } = useNavigationTabs();

  // Guardar tabs cuando cambien
  useEffect(() => {
    NavigationTabsUtils.saveTabs(tabs);
  }, [tabs]);

  // Restaurar tabs al inicializar
  const restoreTabs = useCallback(() => {
    const persistedTabs = NavigationTabsUtils.loadTabs();

    persistedTabs.forEach((tabData) => {
      if (tabData.windowId) {
        openTab({
          title: tabData.title || "Loading...",
          windowId: tabData.windowId,
          recordId: tabData.recordId,
          url: tabData.url || `/window?windowId=${tabData.windowId}`,
          type: tabData.type || "window",
          canClose: true,
          metadata: tabData.metadata,
          icon: tabData.icon,
        });
      }
    });
  }, [openTab]);

  return {
    restoreTabs,
    clearPersistedTabs: NavigationTabsUtils.clearPersistedTabs,
  };
}
