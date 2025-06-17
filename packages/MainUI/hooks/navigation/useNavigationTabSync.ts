"use client";

import { useEffect } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";

/**
 * Hook to sync router navigation with tab navigation
 */
export function useNavigationTabsSync() {
  const { tabs } = useNavigationTabs();

  useEffect(() => {
    console.log("NavigationTabs sync active, tabs:", tabs.length);
  }, [tabs]);

  return null;
}
