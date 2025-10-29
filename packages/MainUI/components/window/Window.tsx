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

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import { SelectedProvider } from "@/contexts/selected";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useTranslation } from "@/hooks/useTranslation";
import TabsContainer from "@/components/window/TabsContainer";

export default function Window({
  windowId,
  windowIdentifier,
}: {
  windowId: string;
  windowIdentifier: string;
}) {
  const { error, loading, getWindowMetadata } = useMetadataContext();
  const { t } = useTranslation();

  const windowData = getWindowMetadata(windowId);

  if (loading) {
    return <Loading data-testid="Loading__56042a" />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title={error?.message ?? t("errors.internalServerError.title")}
        data-testid="ErrorDisplay__56042a"
      />
    );
  }

  if (!windowData) {
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
      <TabsContainer windowData={windowData} data-testid="TabsContainer__56042a" />
    </SelectedProvider>
  );
}
