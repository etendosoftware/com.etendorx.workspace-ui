"use client";

import { useEffect, useCallback } from "react";
import { useNavigationTabs } from "@/contexts/navigationTabs";
import { useSelected } from "@/hooks/useSelected";

/**
 * Hook to memo window state
 */
export function useWindowStateMemorization() {
  const { getActiveTab, updateTabState } = useNavigationTabs();
  const { setTabRecordId } = useSelected();

  const memoizeRecordSelection = useCallback(
    (recordId: string) => {
      const activeTab = getActiveTab();
      if (activeTab && activeTab.type === "window") {
        console.log("Memoizing record selection:", { tabId: activeTab.id, recordId });
        updateTabState(activeTab.id, {
          selectedRecordId: recordId,
        });
      }
    },
    [getActiveTab, updateTabState]
  );

  const memoizeFormData = useCallback(
    (formData: Record<string, any>) => {
      const activeTab = getActiveTab();
      if (activeTab && activeTab.type === "window") {
        console.log("Memoizing form data:", { tabId: activeTab.id, formDataKeys: Object.keys(formData) });
        updateTabState(activeTab.id, {
          formData,
        });
      }
    },
    [getActiveTab, updateTabState]
  );

  const memoizeTableState = useCallback(
    (tableState: {
      page?: number;
      sortBy?: string;
      filters?: Record<string, any>;
    }) => {
      const activeTab = getActiveTab();
      if (activeTab && activeTab.type === "window") {
        console.log("Memoizing table state:", { tabId: activeTab.id, tableState });
        updateTabState(activeTab.id, {
          tableState: {
            ...activeTab.metadata?.windowState?.tableState,
            ...tableState,
          },
        });
      }
    },
    [getActiveTab, updateTabState]
  );

  const memoizeScrollPosition = useCallback(
    (scrollTop: number) => {
      const activeTab = getActiveTab();
      if (activeTab && activeTab.type === "window") {
        updateTabState(activeTab.id, {
          scrollPosition: scrollTop,
        });
      }
    },
    [getActiveTab, updateTabState]
  );

  const restoreTabState = useCallback(() => {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.type === "window" && activeTab.metadata?.windowState) {
      const { selectedRecordId, scrollPosition, formData, tableState } = activeTab.metadata.windowState;

      console.log("Restoring tab state:", {
        tabId: activeTab.id,
        selectedRecordId,
        scrollPosition,
        hasFormData: !!formData,
        hasTableState: !!tableState,
      });

      if (selectedRecordId && activeTab.windowId) {
        setTabRecordId(activeTab.windowId, selectedRecordId);
      }

      if (scrollPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: scrollPosition, behavior: "auto" });
        }, 100);
      }

      return {
        selectedRecordId,
        formData,
        tableState,
        scrollPosition,
      };
    }

    return null;
  }, [getActiveTab, setTabRecordId]);

  useEffect(() => {
    const handleScroll = () => {
      memoizeScrollPosition(window.scrollY);
    };

    const throttledScroll = throttle(handleScroll, 1000);
    window.addEventListener("scroll", throttledScroll);

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [memoizeScrollPosition]);

  return {
    memoizeRecordSelection,
    memoizeFormData,
    memoizeTableState,
    memoizeScrollPosition,
    restoreTabState,
  };
}

function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function (this: any) {
    const args = arguments;
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
