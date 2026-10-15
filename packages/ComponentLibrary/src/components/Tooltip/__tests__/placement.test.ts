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

import { clampToViewport, computeTooltipPlacement, TOOLTIP_MARGIN } from "../placement";

const VIEWPORT = { width: 1000, height: 800 };
const TOOLTIP = { width: 200, height: 30 };
const MIDDLE_TRIGGER = { top: 400, left: 490, width: 20, height: 20 };
const RIGHT_EDGE_TRIGGER = { top: 400, left: 970, width: 20, height: 20 };

describe("clampToViewport", () => {
  it("keeps a position that already fits", () => {
    expect(clampToViewport(100, 200, 1000)).toBe(100);
  });

  it("moves the tooltip back inside both edges", () => {
    expect(clampToViewport(-50, 200, 1000)).toBe(TOOLTIP_MARGIN);
    expect(clampToViewport(900, 200, 1000)).toBe(1000 - 200 - TOOLTIP_MARGIN);
  });

  it("pins a tooltip wider than the viewport to the start edge", () => {
    expect(clampToViewport(0, 2000, 1000)).toBe(TOOLTIP_MARGIN);
  });
});

describe("computeTooltipPlacement", () => {
  it("centers the tooltip below the trigger with the arrow in the middle", () => {
    expect(computeTooltipPlacement("bottom", MIDDLE_TRIGGER, TOOLTIP, VIEWPORT)).toEqual({
      top: 420 + TOOLTIP_MARGIN,
      left: 400,
      arrowOffset: 100,
    });
  });

  it("keeps a tooltip near the right edge on screen, with the arrow on the trigger", () => {
    const placement = computeTooltipPlacement("bottom", RIGHT_EDGE_TRIGGER, TOOLTIP, VIEWPORT);

    expect(placement.left).toBe(VIEWPORT.width - TOOLTIP.width - TOOLTIP_MARGIN);
    expect(placement.left + placement.arrowOffset).toBe(980);
  });

  it("keeps the arrow on the box when the trigger is past the tooltip end", () => {
    const placement = computeTooltipPlacement("bottom", { ...RIGHT_EDGE_TRIGGER, left: 1100 }, TOOLTIP, VIEWPORT);

    expect(placement.arrowOffset).toBe(TOOLTIP.width - 8);
  });

  it("places the tooltip above the trigger, inside the top edge", () => {
    expect(computeTooltipPlacement("top", MIDDLE_TRIGGER, TOOLTIP, VIEWPORT).top).toBe(400 - 30 - TOOLTIP_MARGIN);
    expect(computeTooltipPlacement("top", { ...MIDDLE_TRIGGER, top: 0 }, TOOLTIP, VIEWPORT).top).toBe(TOOLTIP_MARGIN);
  });

  it("places side tooltips centered vertically, with the arrow on the trigger", () => {
    expect(computeTooltipPlacement("left", MIDDLE_TRIGGER, TOOLTIP, VIEWPORT)).toEqual({
      top: 395,
      left: 490 - 200 - TOOLTIP_MARGIN,
      arrowOffset: 15,
    });
    expect(computeTooltipPlacement("right", MIDDLE_TRIGGER, TOOLTIP, VIEWPORT).left).toBe(510 + TOOLTIP_MARGIN);
  });

  it("flips nothing but clamps a right tooltip that would leave the screen", () => {
    const placement = computeTooltipPlacement("right", RIGHT_EDGE_TRIGGER, TOOLTIP, VIEWPORT);

    expect(placement.left).toBe(VIEWPORT.width - TOOLTIP.width - TOOLTIP_MARGIN);
  });
});
