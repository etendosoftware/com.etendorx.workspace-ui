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
/**
 * Grid units per persisted row. The grid runs on half-rows so a collapsed widget can shrink to
 * its header; persisted rows/heights are units / ROW_UNITS (halves are stored as e.g. 1.5).
 */
const ROW_UNITS = 2;
/** Half-row height in pixels: 2 units + 1 margin = 120px, the original persisted row height */
const ROW_HEIGHT = 54;
/** Minimum persisted rows a widget can be resized to (prevents broken layouts) */
const MIN_H = 2;
/** Grid units a collapsed widget occupies — just its header */
const COLLAPSED_UNITS = 1;
/** Gap between grid items [x, y] in pixels */
const GRID_MARGIN: [number, number] = [12, 12];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toRglLayout(instances: WidgetInstance[]): Layout {
  return instances.map(
    (w): LayoutItem => ({
      i: w.instanceId,
      x: w.position.col,
      y: Math.round(w.position.row * ROW_UNITS),
      w: w.position.width,
      h: w.collapsed ? COLLAPSED_UNITS : Math.round(w.position.height * ROW_UNITS),
      minW: 1,
      minH: w.collapsed ? COLLAPSED_UNITS : MIN_H * ROW_UNITS,
      maxW: GRID_COLS,
      isResizable: !w.collapsed,
    })
  );
}

function toUpdatePayload(layout: Layout, instances: WidgetInstance[]): UpdateLayoutWidget[] {
  return layout.map((item) => {
    const instance = instances.find((w) => w.instanceId === item.i);
    const collapsed = instance?.collapsed === true;
    return {
      instanceId: item.i,
      col: Math.round(item.x),
      row: item.y / ROW_UNITS,
      width: Math.max(1, Math.round(item.w)),
      // A collapsed item renders 1 unit tall; persist its expanded height so expanding restores it.
      height: collapsed && instance ? instance.position.height : item.h / ROW_UNITS,
      isVisible: true,
      isCollapsed: collapsed,
    };
  });
}

// A selection anchored on mousedown would otherwise grow over the widget content while dragging/resizing.
function clearTextSelection(): void {
  window.getSelection()?.removeAllRanges();
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DashboardGridProps {
  instances: WidgetInstance[];
  widgetData: Record<string, WidgetDataResponse>;
  widgetErrors: Record<string, string>;
  editableClassIds?: Set<string>;
  onRemove: (instanceId: string) => void;
  onEditParams?: (instanceId: string) => void;
  onFetchPage: (instanceId: string, page: number, pageSize: number) => Promise<void>;
  onRefresh?: (instanceId: string) => Promise<void>;
  onUpdateLayout: (widgets: UpdateLayoutWidget[]) => Promise<void>;
  onToggleCollapsed?: (instanceId: string) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardGrid({
  instances,
  widgetData,
  widgetErrors,
  editableClassIds,
  onRemove,
  onEditParams,
  onFetchPage,
  onRefresh,
  onUpdateLayout,
  onToggleCollapsed,
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
      onUpdateLayout(toUpdatePayload(layout, instances));
    },
    [onUpdateLayout, instances]
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
        onDragStart={clearTextSelection}
        onResizeStart={clearTextSelection}
        onDragStop={handleInteractionEnd}
        onResizeStop={handleInteractionEnd}
        autoSize
        data-testid="GridLayout__e6b441">
        {instances.map((instance) => (
          <div key={instance.instanceId} className="h-full" data-testid={`DashboardGrid__cell_${instance.instanceId}`}>
            <WidgetCard
              instance={instance}
              data={widgetData[instance.instanceId]}
              error={widgetErrors[instance.instanceId]}
              hasConfigurableParams={editableClassIds?.has(instance.widgetClassId)}
              onRemove={onRemove}
              onEditParams={onEditParams}
              onFetchPage={(page, pageSize) => onFetchPage(instance.instanceId, page, pageSize)}
              onRefresh={onRefresh}
              onToggleCollapsed={onToggleCollapsed}
              data-testid="WidgetCard__e6b441"
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
