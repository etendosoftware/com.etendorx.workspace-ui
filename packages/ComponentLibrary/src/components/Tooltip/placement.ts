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

export type TooltipPosition = "top" | "bottom" | "left" | "right";

/** Gap between the trigger and the tooltip, and between the tooltip and the viewport edges. */
export const TOOLTIP_MARGIN = 8;
/** Closest the arrow gets to a tooltip corner, so it stays on the rounded box. */
const ARROW_EDGE_GAP = 8;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

export interface TooltipPlacement {
  top: number;
  left: number;
  /** Arrow position along the tooltip side that faces the trigger, from its start. */
  arrowOffset: number;
}

/** Keeps `start` so that `start..start+size` fits in `0..viewportSize`, leaving the margin. */
export function clampToViewport(start: number, size: number, viewportSize: number): number {
  const max = viewportSize - size - TOOLTIP_MARGIN;
  return Math.max(TOOLTIP_MARGIN, Math.min(start, max));
}

/** Keeps the arrow pointing at the trigger center once the tooltip has been moved to fit. */
function getArrowOffset(triggerCenter: number, tooltipStart: number, tooltipSize: number): number {
  const max = Math.max(ARROW_EDGE_GAP, tooltipSize - ARROW_EDGE_GAP);
  return Math.max(ARROW_EDGE_GAP, Math.min(triggerCenter - tooltipStart, max));
}

function isVertical(position: TooltipPosition): boolean {
  return position === "top" || position === "bottom";
}

function getMainAxisStart(position: TooltipPosition, trigger: Rect, tooltip: Size): number {
  switch (position) {
    case "top":
      return trigger.top - tooltip.height - TOOLTIP_MARGIN;
    case "bottom":
      return trigger.top + trigger.height + TOOLTIP_MARGIN;
    case "left":
      return trigger.left - tooltip.width - TOOLTIP_MARGIN;
    case "right":
      return trigger.left + trigger.width + TOOLTIP_MARGIN;
  }
}

/**
 * Places the tooltip on the requested side of the trigger, centered on it, and then moves it the
 * least needed to keep it inside the viewport. The arrow follows the trigger center.
 */
export function computeTooltipPlacement(
  position: TooltipPosition,
  trigger: Rect,
  tooltip: Size,
  viewport: Size
): TooltipPlacement {
  const mainStart = getMainAxisStart(position, trigger, tooltip);

  if (isVertical(position)) {
    const center = trigger.left + trigger.width / 2;
    const left = clampToViewport(center - tooltip.width / 2, tooltip.width, viewport.width);
    const top = clampToViewport(mainStart, tooltip.height, viewport.height);
    return { top, left, arrowOffset: getArrowOffset(center, left, tooltip.width) };
  }

  const center = trigger.top + trigger.height / 2;
  const top = clampToViewport(center - tooltip.height / 2, tooltip.height, viewport.height);
  const left = clampToViewport(mainStart, tooltip.width, viewport.width);
  return { top, left, arrowOffset: getArrowOffset(center, top, tooltip.height) };
}
