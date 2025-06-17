"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";
import ChevronLeftIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-left.svg";
import ChevronRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import PlusIcon from "@workspaceui/componentlibrary/src/assets/icons/plus.svg";
import NavigationTabItem from "./navigationTabItem";

export function NavigationTabs() {
  const { tabs, switchToTab, closeTab, isReady } = useNavigationTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: -200, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: 200, behavior: "smooth" });
  }, []);

  const handleTabSelect = useCallback(
    (tabId: string) => {
      if (!isReady) return;

      switchToTab(tabId);

      setTimeout(() => {
        const container = scrollContainerRef.current;
        const activeTab = container?.querySelector('[aria-selected="true"]') as HTMLElement;

        if (container && activeTab) {
          const containerRect = container.getBoundingClientRect();
          const tabRect = activeTab.getBoundingClientRect();

          if (tabRect.left < containerRect.left) {
            container.scrollBy({
              left: tabRect.left - containerRect.left - 20,
              behavior: "smooth",
            });
          } else if (tabRect.right > containerRect.right) {
            container.scrollBy({
              left: tabRect.right - containerRect.right + 20,
              behavior: "smooth",
            });
          }
        }
      }, 100);
    },
    [switchToTab, isReady]
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      if (!isReady) return;
      closeTab(tabId);
    },
    [closeTab, isReady]
  );

  const handleNewTab = useCallback(() => {
    if (!isReady) return;

    const homeTab = tabs.find((tab) => tab.type === "home");
    if (homeTab) {
      switchToTab(homeTab.id);
    }
  }, [tabs, switchToTab, isReady]);

  useEffect(() => {
    checkScrollButtons();
  }, [tabs, checkScrollButtons]);

  if (!isReady || tabs.length <= 1) {
    return null;
  }

  return (
    <div
      className="bg-gray-100 border-b border-gray-200 flex items-center"
      role="tablist"
      aria-label="Tabs de navegación">
      {showLeftScroll && (
        <button
          type="button"
          onClick={scrollLeft}
          className="p-2 hover:bg-gray-200 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Scroll hacia la izquierda"
          aria-label="Scroll hacia la izquierda">
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide flex-1"
        onScroll={checkScrollButtons}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}>
        {tabs.map((tab) => (
          <NavigationTabItem key={tab.id} tab={tab} onSelect={handleTabSelect} onClose={handleTabClose} />
        ))}
      </div>
      {showRightScroll && (
        <button
          type="button"
          onClick={scrollRight}
          className="p-2 hover:bg-gray-200 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Scroll hacia la derecha"
          aria-label="Scroll hacia la derecha">
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}
      <button
        type="button"
        onClick={handleNewTab}
        className="p-2 hover:bg-gray-200 transition-colors flex-shrink-0 border-l border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Ir a inicio"
        aria-label="Ir a inicio">
        <PlusIcon className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}

export default NavigationTabs;
