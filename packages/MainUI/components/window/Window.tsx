"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import { SelectedProvider } from "@/contexts/selected";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useTranslation } from "@/hooks/useTranslation";
import TabsContainer from "@/components/window/TabsContainer";

export default function Window({ windowId }: { windowId: string }) {
  const { getWindowMetadata, isWindowLoading, getWindowError, loadWindowData } = useMetadataContext();
  const { t } = useTranslation();

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
  if (!windowData)
    return (
      <ErrorDisplay title={t("errors.windowNotFound.title")} description={t("errors.windowNotFound.description")} />
    );

  return (
    <SelectedProvider tabs={windowData.tabs} windowId={windowId}>
      <TabsContainer />
    </SelectedProvider>
  );
}
