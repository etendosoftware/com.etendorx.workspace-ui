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

import {
  findFirstFilterInput,
  isGridBodyTarget,
  isGridHeaderTarget,
  isGridTarget,
} from "@/utils/table/gridShortcutScope";
import { buildGridDom } from "@/utils/table/test-utils/gridDom";

describe("gridShortcutScope", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("tells the rows from the filter row of the closest grid", () => {
    const { grid, cell, filterInput } = buildGridDom();

    expect(isGridBodyTarget(grid)).toBe(true);
    expect(isGridBodyTarget(cell)).toBe(true);
    expect(isGridBodyTarget(filterInput)).toBe(false);
    expect(isGridHeaderTarget(filterInput)).toBe(true);
    expect(isGridHeaderTarget(cell)).toBe(false);
    expect(isGridTarget(cell)).toBe(true);
    expect(isGridTarget(filterInput)).toBe(true);
  });

  it("only accepts elements of the given container", () => {
    const { cell } = buildGridDom();
    const other = buildGridDom();

    expect(isGridTarget(cell, other.grid)).toBe(false);
    expect(isGridTarget(cell, null)).toBe(false);
  });

  it("rejects targets outside any grid and non elements", () => {
    expect(isGridTarget(document.body)).toBe(false);
    expect(isGridTarget(document)).toBe(false);
    expect(isGridBodyTarget(null)).toBe(false);
    expect(isGridHeaderTarget(null)).toBe(false);
  });

  it("finds the first enabled filter field", () => {
    const { grid, filterInput, disabledFilterInput } = buildGridDom();

    expect(findFirstFilterInput(grid)).toBe(filterInput);
    expect(disabledFilterInput.disabled).toBe(true);
    expect(findFirstFilterInput(null)).toBeNull();
  });
});
