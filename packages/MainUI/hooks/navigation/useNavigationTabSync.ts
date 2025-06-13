"use client";

import { useEffect } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";

/**
 * Hook to sync router navigation with tab navigation
 */
export function useNavigationTabsSync() {
  const { tabs } = useNavigationTabs();

  // Simplemente marcar que el hook está activo para debugging
  useEffect(() => {
    console.log("NavigationTabs sync active, tabs:", tabs.length);
  }, [tabs]);

  // La sincronización real se hace en el contexto
  return null;
}
