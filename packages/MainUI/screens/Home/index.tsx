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

import { useCallback } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import CTABanner from "./widgets/CTABanner";
import WidgetCard from "./widgets/WidgetCard";

const LOADING_SKELETON_COUNT = 4;

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="Home__loading_skeleton">
      {Array.from({ length: LOADING_SKELETON_COUNT }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
        <div key={i} className="rounded-2xl bg-baseline-10 p-5 h-40 animate-pulse">
          <div className="h-3 rounded bg-transparent-neutral-10 w-1/3 mb-4" />
          <div className="h-3 rounded bg-transparent-neutral-10 w-3/4 mb-2" />
          <div className="h-3 rounded bg-transparent-neutral-10 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { layout, widgetData, widgetErrors, isLoadingLayout, layoutError, removeWidget } = useDashboard();

  const handleRemove = useCallback(
    (instanceId: string) => {
      removeWidget(instanceId);
    },
    [removeWidget]
  );

  const sortedLayout = [...layout].sort((a, b) => a.seqno - b.seqno);

  return (
    <div className="flex flex-col gap-4 w-full h-full overflow-y-auto p-4" data-testid="Home__container">
      <CTABanner data-testid="CTABanner__dashboard" />

      {isLoadingLayout && <LoadingSkeleton />}

      {layoutError && !isLoadingLayout && (
        <div
          className="rounded-2xl bg-error-contrast-text p-5 text-sm text-error-main"
          data-testid="Home__layout_error">
          {t("dashboard.loadError")}
        </div>
      )}

      {!isLoadingLayout && !layoutError && sortedLayout.length === 0 && (
        <p className="text-sm text-baseline-50 p-2" data-testid="Home__no_widgets">
          {t("dashboard.noWidgets")}
        </p>
      )}

      {!isLoadingLayout && !layoutError && sortedLayout.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="Home__widget_grid">
          {sortedLayout.map((instance) => (
            <div
              key={instance.instanceId}
              className={instance.position.width >= 3 ? "md:col-span-2" : ""}
              data-testid={`Home__widget_cell_${instance.instanceId}`}>
              <WidgetCard
                instance={instance}
                data={widgetData[instance.instanceId]}
                error={widgetErrors[instance.instanceId]}
                onRemove={handleRemove}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
