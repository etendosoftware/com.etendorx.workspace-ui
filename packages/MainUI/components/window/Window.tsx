/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import { SelectedProvider } from "@/contexts/selected";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useTranslation } from "@/hooks/useTranslation";

import TabsContainer from "@/components/window/TabsContainer";
import { useState, useEffect, useMemo, useRef } from "react";
import type { Etendo } from "@workspaceui/api-client/src/api/metadata";
import type { WindowState } from "@/utils/window/constants";
import { useWindowContext } from "@/contexts/window";

export default function Window({ window }: { window: WindowState }) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { windowId, windowIdentifier } = window;
  const { error, loading, getWindowMetadata } = useMetadataContext();
  const { isRecoveryLoading, recoveryError } = useWindowContext();

  const { t } = useTranslation();

  const previousWindowIdentifier = useRef(windowIdentifier);

  /**
   * Calculate window metadata based on windowId.
   * This is memoized to avoid unnecessary recalculations.
   */
  const windowData: Etendo.WindowMetadata | undefined = useMemo(() => {
    try {
      return getWindowMetadata(windowId);
    } catch (error) {
      console.error("Error fetching window metadata for windowId:", windowId, error);
      return undefined;
    }
  }, [windowId, getWindowMetadata]);

  /**
   * Handle windowIdentifier changes to show loading state during transitions.
   *
   * When windowIdentifier changes, it indicates a new window session or navigation state
   * that requires showing a loading state even if the windowId remains the same.
   */
  useEffect(() => {
    if (previousWindowIdentifier.current !== windowIdentifier) {
      setIsTransitioning(true);
      previousWindowIdentifier.current = windowIdentifier;

      // Reset transition state after a brief moment to show loading
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [windowIdentifier]);

  if (loading || !windowData || isTransitioning || isRecoveryLoading) {
    return <Loading data-testid="Loading__56042a" />;
  }

  // Show error if metadata loading failed
  if (error) {
    return (
      <ErrorDisplay
        title={error?.message ?? t("errors.internalServerError.title")}
        data-testid="ErrorDisplay__56042a"
      />
    );
  }

  // Show error if recovery failed
  if (recoveryError) {
    return (
      <ErrorDisplay
        title={t("errors.recoveryFailed.title")}
        description={recoveryError}
        data-testid="ErrorDisplay__RecoveryError"
      />
    );
  }

  // Show error if window metadata is empty
  if (windowData === ({} as Etendo.WindowMetadata)) {
    return (
      <ErrorDisplay
        title={t("errors.windowNotFound.title")}
        description={t("errors.windowNotFound.description")}
        data-testid="ErrorDisplay__56042a"
      />
    );
  }

  return (
    <SelectedProvider
      tabs={windowData.tabs}
      windowId={windowId}
      windowIdentifier={windowIdentifier}
      data-testid="SelectedProvider__56042a">
      <TabsContainer windowData={windowData} windowIdentifier={windowIdentifier} data-testid="TabsContainer__56042a" />
    </SelectedProvider>
  );
}
