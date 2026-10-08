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

import { GRID_FOCUS_TARGET_ATTRIBUTE } from "@/utils/window/splitView";

/**
 * Builds, in the document body, the DOM of a grid as the grid shortcuts see it: a focusable
 * container marked as grid, a header with a disabled and an enabled filter field, and a body cell.
 */
export const buildGridDom = () => {
  const grid = document.createElement("div");
  grid.setAttribute(GRID_FOCUS_TARGET_ATTRIBUTE, "");
  grid.tabIndex = -1;
  grid.innerHTML =
    "<table><thead><tr><th><input disabled /></th><th><input /></th></tr></thead>" +
    "<tbody><tr><td tabindex='-1'>cell</td></tr></tbody></table>";
  document.body.appendChild(grid);

  const [disabledFilterInput, filterInput] = Array.from(grid.querySelectorAll("input"));
  const cell = grid.querySelector("td") as HTMLElement;
  return { grid, filterInput, disabledFilterInput, cell };
};
