"use client";
import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useQueryParams } from "@/hooks/useQueryParams";
import Home from "@/screens/Home";
import { useTranslation } from "@/hooks/useTranslation";
import Window from "@/components/window/Window";

export default function Page() {
  const { loading, error } = useMetadataContext();
  const { windows, activeWindow, isHomeRoute, openWindow } = useMultiWindowURL();
  const { windowId } = useQueryParams<{ windowId?: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (windowId && windows.length === 0) {
      openWindow(windowId);
    }
  }, [windowId, windows.length, openWindow]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorDisplay title={error?.message ?? t("errors.internalServerError.title")} />;
  }

  const shouldShowTabs = windows.length > 0;

  return (
    <div className="flex flex-col w-full h-full max-h-full">
      {shouldShowTabs && <WindowTabs />}

      <div className="flex-1 overflow-hidden">
        {isHomeRoute || !activeWindow ? <Home /> : <Window windowId={activeWindow.windowId} />}
      </div>
    </div>
  );
}
