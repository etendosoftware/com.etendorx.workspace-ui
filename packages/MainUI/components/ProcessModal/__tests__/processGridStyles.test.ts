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

import { PROCESS_GRID_FRAME_SX, type GridSx, getProcessGridRowSx, getProcessGridSx } from "../processGridStyles";

const windowGridSx: GridSx = {
  tablePaper: { display: "flex", borderLeft: "1px solid red" },
  tableHeadCell: { fontSize: "0.8rem" },
  tableBodyCell: { height: "32px" },
  tableBody: { cursor: "pointer" },
  rowSelected: { backgroundColor: "var(--ui-row-selected)" },
};

describe("processGridStyles", () => {
  it("reuses the header, cell and body styles of the window grid", () => {
    const sx = getProcessGridSx(windowGridSx, 300);

    expect(sx.headCell).toBe(windowGridSx.tableHeadCell);
    expect(sx.bodyCell).toBe(windowGridSx.tableBodyCell);
    expect(sx.body).toBe(windowGridSx.tableBody);
  });

  it("keeps the window grid surface but closes its frame, since the grid stands alone in the modal", () => {
    expect(getProcessGridSx(windowGridSx, 300).paper).toEqual({
      display: "flex",
      ...PROCESS_GRID_FRAME_SX,
      flex: "none",
      height: "300px",
      maxHeight: "300px",
    });
    expect(getProcessGridSx(windowGridSx, 300).paper).not.toHaveProperty("borderLeft", "1px solid red");
  });

  it("paints only selected rows, with the selected colour of the window grid", () => {
    expect(getProcessGridRowSx(windowGridSx, true)).toBe(windowGridSx.rowSelected);
    expect(getProcessGridRowSx(windowGridSx, false)).toBeUndefined();
  });
});
