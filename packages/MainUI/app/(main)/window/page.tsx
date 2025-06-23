"use client";

import { useEffect, useMemo } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import { WindowTabs } from "@/components/NavigationTabs";
import Tabs from "@/components/window/Tabs";
import { SelectedProvider } from "@/contexts/selected";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useSelected } from "@/hooks/useSelected";
import { useQueryParams } from "@/hooks/useQueryParams";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import AppBreadcrumb from "@/components/Breadcrums";
import Home from "@/screens/Home";

function TabsContainer() {
  const { activeLevels, clearAllStates } = useSelected();
  const { activeWindow } = useMultiWindowURL();
  const { getWindowMetadata } = useMetadataContext();

  const windowData = useMemo(() => {
    return activeWindow ? getWindowMetadata(activeWindow.windowId) : undefined;
  }, [activeWindow, getWindowMetadata]);

  useEffect(() => {
    if (activeWindow?.windowId) {
      clearAllStates();
    }
  }, [activeWindow?.windowId, clearAllStates]);

  if (!windowData) {
    return <div>Loading window content...</div>;
  }

  const groupedTabs = groupTabsByLevel(windowData);
  const firstExpandedIndex = groupedTabs.findIndex((tabs) => activeLevels.includes(tabs[0].tabLevel));

  return (
    <div className="flex flex-col w-full h-full max-h-full">
      {groupedTabs.map((tabs, index) => {
        const isTopGroup = index === firstExpandedIndex && firstExpandedIndex !== -1;

        return <Tabs key={tabs[0].id} tabs={tabs} isTopGroup={isTopGroup} />;
      })}
    </div>
  );
}

function WindowContentWithProvider({ windowId }: { windowId: string }) {
  const { getWindowMetadata, isWindowLoading, getWindowError, loadWindowData } = useMetadataContext();

  const windowData = getWindowMetadata(windowId);
  const isLoading = isWindowLoading(windowId);
  const error = getWindowError(windowId);

  useEffect(() => {
    if (!windowData && !isLoading && !error) {
      loadWindowData(windowId);
    }
  }, [windowId, windowData, isLoading, error, loadWindowData]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorDisplay title={error.message} />;
  if (!windowData) return <ErrorDisplay title="Window not found" />;

  return (
    <SelectedProvider tabs={windowData.tabs} windowId={windowId}>
      <TabsContainer />
    </SelectedProvider>
  );
}

export default function Page() {
  const { loading, error } = useMetadataContext();
  const { windows, activeWindow, openWindow, isHomeRoute } = useMultiWindowURL();
  const { windowId } = useQueryParams<{ windowId?: string }>();

  useEffect(() => {
    if (windowId && windows.length === 0) {
      openWindow(windowId);
    }
  }, [windowId, windows.length, openWindow]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorDisplay title={error?.message ?? "Something went wrong"} />;
  }

  const shouldShowTabs = windows.length > 0;
  const shouldShowBreadcrumb = activeWindow && !isHomeRoute;

  return (
    <div className="flex flex-col w-full h-full max-h-full">
      {shouldShowTabs && <WindowTabs />}

      {shouldShowBreadcrumb && <AppBreadcrumb />}

      <div className="flex-1 overflow-hidden">
        {isHomeRoute || !activeWindow ? <Home /> : <WindowContentWithProvider windowId={activeWindow.windowId} />}
      </div>
    </div>
  );
}
