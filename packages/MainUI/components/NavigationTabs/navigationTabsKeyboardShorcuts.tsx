"use client";

import { useEffect } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";

/**
 * Component to handle shorcuts in tabs
 */
export function NavigationTabsKeyboardShortcuts() {
  const { tabs, switchToTab, closeTab, activeTabId } = useNavigationTabs();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const tabIndex = Number.parseInt(event.key) - 1;
        if (tabs[tabIndex]) {
          switchToTab(tabs[tabIndex].id);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "w") {
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        if (activeTab && activeTab.canClose) {
          event.preventDefault();
          closeTab(activeTabId);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "t") {
        event.preventDefault();
        const homeTab = tabs.find((tab) => tab.type === "home");
        if (homeTab) {
          switchToTab(homeTab.id);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Tab") {
        event.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        switchToTab(tabs[nextIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, switchToTab, closeTab, activeTabId]);

  return null;
}
