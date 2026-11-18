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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { computeMenuVerticalPlacement, MENU_VIEWPORT_MARGIN } from "../placement";

const VIEWPORT_HEIGHT = 900;

/**
 * Builds the input for an anchor of 32 px height whose top edge is at `anchorTop`.
 */
const place = (anchorTop: number, menuHeight: number, offsetY = 0) =>
  computeMenuVerticalPlacement({
    anchorTop,
    anchorBottom: anchorTop + 32,
    menuHeight,
    viewportHeight: VIEWPORT_HEIGHT,
    offsetY,
  });

describe("computeMenuVerticalPlacement", () => {
  it("opens below the anchor when the menu fits there", () => {
    expect(place(100, 300, 4)).toEqual({ y: 136, maxHeight: null });
  });

  it("opens above the anchor when it only fits there", () => {
    expect(place(700, 400)).toEqual({ y: 300, maxHeight: null });
  });

  it("keeps a tall menu attached below an anchor near the top", () => {
    const anchorBottom = 132;
    const result = place(100, 1200);

    expect(result.maxHeight).toBe(VIEWPORT_HEIGHT - anchorBottom - MENU_VIEWPORT_MARGIN * 2);
    expect(result.y).toBe(anchorBottom);
  });

  it("keeps a tall menu attached above an anchor near the bottom", () => {
    const result = place(800, 1200);

    expect(result.maxHeight).toBe(800 - MENU_VIEWPORT_MARGIN * 2);
    expect(result.y).toBe(MENU_VIEWPORT_MARGIN * 2);
  });

  it("never places the menu above the top margin", () => {
    expect(place(10, 2000).y).toBeGreaterThanOrEqual(MENU_VIEWPORT_MARGIN);
  });
});
