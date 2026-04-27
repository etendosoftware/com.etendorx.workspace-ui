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

import { useCallback, useEffect, useRef, useState } from "react";
import { GridLayout } from "react-grid-layout";
import type { Layout, LayoutItem } from "react-grid-layout";
import type { WidgetInstance, WidgetDataResponse, UpdateLayoutWidget } from "@workspaceui/api-client/src/api/dashboard";
import WidgetCard from "./WidgetCard";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Matches the backend model: 4 logical columns per row */
const GRID_COLS = 4;
/** Visual row height in pixels */
const ROW_HEIGHT = 120;
/** Minimum rows a widget can be resized to (prevents broken layouts) */
const MIN_H = 2;
/** Gap between grid items [x, y] in pixels */
const GRID_MARGIN: [number, number] = [12, 12];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toRglLayout(instances: WidgetInstance[]): Layout {
  return instances.map(
    (w): LayoutItem => ({
      i: w.instanceId,
      x: w.position.col,
      y: w.position.row,
      w: w.position.width,
      h: w.position.height,
      minW: 1,
      minH: MIN_H,
      maxW: GRID_COLS,
    })
  );
}

function toUpdatePayload(layout: Layout): UpdateLayoutWidget[] {
  return layout.map((item) => ({
    instanceId: item.i,
    col: Math.round(item.x),
    row: Math.round(item.y),
    width: Math.max(1, Math.round(item.w)),
    height: Math.max(1, Math.round(item.h)),
    isVisible: true,
  }));
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DashboardGridProps {
  instances: WidgetInstance[];
  widgetData: Record<string, WidgetDataResponse>;
  widgetErrors: Record<string, string>;
  onRemove: (instanceId: string) => void;
  onFetchPage: (instanceId: string, page: number, pageSize: number) => Promise<void>;
  onUpdateLayout: (widgets: UpdateLayoutWidget[]) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardGrid({
  instances,
  widgetData,
  widgetErrors,
  onRemove,
  onFetchPage,
  onUpdateLayout,
}: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Track container width for responsive layout
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  // Only fires when the user explicitly finishes a drag or resize interaction.
  // Using onDragStop + onResizeStop (instead of onLayoutChange) avoids spurious
  // PUT requests triggered by programmatic re-renders (e.g. after addWidget).
  const handleInteractionEnd = useCallback(
    (layout: Layout) => {
      onUpdateLayout(toUpdatePayload(layout));
    },
    [onUpdateLayout]
  );

  const rglLayout = toRglLayout(instances);

  return (
    <div ref={containerRef} className="w-full" data-testid="DashboardGrid__container">
      <GridLayout
        layout={rglLayout}
        width={containerWidth}
        gridConfig={{
          cols: GRID_COLS,
          rowHeight: ROW_HEIGHT,
          margin: GRID_MARGIN,
          containerPadding: [0, 0],
          maxRows: Number.POSITIVE_INFINITY,
        }}
        dragConfig={{
          enabled: true,
          handle: ".widget-drag-handle",
          bounded: false,
        }}
        resizeConfig={{
          enabled: true,
          handles: ["se"],
        }}
        onDragStop={handleInteractionEnd}
        onResizeStop={handleInteractionEnd}
        autoSize>
        {instances.map((instance) => (
          <div key={instance.instanceId} className="h-full" data-testid={`DashboardGrid__cell_${instance.instanceId}`}>
            <WidgetCard
              instance={instance}
              data={widgetData[instance.instanceId]}
              error={widgetErrors[instance.instanceId]}
              onRemove={onRemove}
              onFetchPage={(page, pageSize) => onFetchPage(instance.instanceId, page, pageSize)}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
