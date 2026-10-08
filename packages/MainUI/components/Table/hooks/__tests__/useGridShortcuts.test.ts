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

import { renderHook } from "@testing-library/react";
import type { MRT_Row, MRT_TableInstance } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { focusGridRows, getSingleSelectedRow, useGridShortcuts } from "../useGridShortcuts";
import { type KeyPress, pressKey } from "@/utils/keyboard/test-utils/keyboardEvents";
import { buildGridDom } from "@/utils/table/test-utils/gridDom";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";

type GridTable = MRT_TableInstance<EntityData>;

const F2: KeyPress = { key: "F2" };
const CTRL_F2: KeyPress = { key: "F2", ctrl: true };
const ESCAPE: KeyPress = { key: "Escape" };
const ALT_DELETE: KeyPress = { key: "Delete", alt: true };

const makeRow = (id: string) => ({ id, original: { id } }) as unknown as MRT_Row<EntityData>;

const makeTable = (selected: MRT_Row<EntityData>[], rows: MRT_Row<EntityData>[] = selected) =>
  ({
    getSelectedRowModel: () => ({ rows: selected }),
    getRowModel: () => ({ rows }),
    setRowSelection: jest.fn(),
    setColumnFilters: jest.fn(),
    toggleAllRowsSelected: jest.fn(),
  }) as unknown as GridTable & Record<string, jest.Mock>;

const renderGridShortcuts = (table: GridTable | null, enabled = true) => {
  const dom = buildGridDom();
  const handlers = { onNewRow: jest.fn(), onEditRow: jest.fn(), onOpenInForm: jest.fn() };
  renderHook(() =>
    useGridShortcuts({ containerRef: { current: dom.grid }, tableRef: { current: table }, enabled, ...handlers })
  );
  return { ...dom, ...handlers };
};

describe("useGridShortcuts", () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("edits the selected row inline with F2 and in the form with Ctrl+F2", () => {
    const row = makeRow("1");
    const { cell, onEditRow, onOpenInForm } = renderGridShortcuts(makeTable([row]));

    pressKey(F2, cell);
    pressKey(CTRL_F2, cell);

    expect(onEditRow).toHaveBeenCalledWith(row);
    expect(onOpenInForm).toHaveBeenCalledWith(row);
  });

  it("does not edit without exactly one selected row", () => {
    const { cell, onEditRow } = renderGridShortcuts(makeTable([makeRow("1"), makeRow("2")]));

    pressKey(F2, cell);

    expect(onEditRow).not.toHaveBeenCalled();
  });

  it("selects and unselects all rows from the rows", () => {
    const table = makeTable([]);
    const { grid } = renderGridShortcuts(table);

    pressKey({ key: "A", code: "KeyA", alt: true, shift: true }, grid);
    pressKey({ key: "N", code: "KeyN", alt: true, shift: true }, grid);

    expect(table.toggleAllRowsSelected).toHaveBeenNthCalledWith(1, true);
    expect(table.toggleAllRowsSelected).toHaveBeenNthCalledWith(2, false);
  });

  it("leaves the row shortcuts alone in the filter row", () => {
    const { filterInput, onEditRow } = renderGridShortcuts(makeTable([makeRow("1")]));

    const event = pressKey(F2, filterInput);

    expect(onEditRow).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("moves between the rows and the filter row", () => {
    const { cell, filterInput, grid } = renderGridShortcuts(makeTable([makeRow("1")]));

    pressKey({ key: "F", code: "KeyF", ctrl: true, shift: true }, cell);
    expect(document.activeElement).toBe(filterInput);

    pressKey(ESCAPE, filterInput);
    expect(document.activeElement).toBe(grid);
  });

  it("does not take Escape outside the filter row", () => {
    const { cell } = renderGridShortcuts(makeTable([]));

    expect(pressKey(ESCAPE, cell).defaultPrevented).toBe(false);
  });

  it("clears the column filters from the rows and from the filter row", () => {
    const table = makeTable([]);
    const { cell, filterInput } = renderGridShortcuts(table);

    pressKey(ALT_DELETE, cell);
    pressKey(ALT_DELETE, filterInput);

    expect(table.setColumnFilters).toHaveBeenCalledTimes(2);
    expect(table.setColumnFilters).toHaveBeenCalledWith([]);
  });

  it("ignores grid shortcuts coming from outside the grid", () => {
    const table = makeTable([]);
    renderGridShortcuts(table);

    pressKey(ALT_DELETE, document.body);

    expect(table.setColumnFilters).not.toHaveBeenCalled();
  });

  it("adds a new row with Ctrl+I from anywhere in the tab", () => {
    const { onNewRow } = renderGridShortcuts(makeTable([]));

    pressKey({ key: "i", code: "KeyI", ctrl: true });

    expect(onNewRow).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled", () => {
    const { cell, onNewRow, onEditRow } = renderGridShortcuts(makeTable([makeRow("1")]), false);

    pressKey({ key: "i", code: "KeyI", ctrl: true });
    pressKey(F2, cell);

    expect(onNewRow).not.toHaveBeenCalled();
    expect(onEditRow).not.toHaveBeenCalled();
  });

  it("survives a table that is not ready", () => {
    const { cell, onEditRow } = renderGridShortcuts(null);

    pressKey(F2, cell);
    pressKey(ALT_DELETE, cell);

    expect(onEditRow).not.toHaveBeenCalled();
  });
});

describe("getSingleSelectedRow", () => {
  it("returns the row only when exactly one is selected", () => {
    const row = makeRow("1");
    expect(getSingleSelectedRow(makeTable([row]))).toBe(row);
    expect(getSingleSelectedRow(makeTable([]))).toBeNull();
    expect(getSingleSelectedRow(null)).toBeNull();
  });
});

describe("focusGridRows", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("selects the first row when nothing is selected", () => {
    const { grid } = buildGridDom();
    const table = makeTable([], [makeRow("1"), makeRow("2")]);

    focusGridRows(grid, table);

    expect(document.activeElement).toBe(grid);
    expect(table.setRowSelection).toHaveBeenCalledWith({ 1: true });
  });

  it("keeps an existing selection", () => {
    const table = makeTable([makeRow("2")]);

    focusGridRows(null, table);

    expect(table.setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing on an empty grid or without a table", () => {
    const table = makeTable([], []);

    focusGridRows(null, table);
    focusGridRows(null, null);

    expect(table.setRowSelection).not.toHaveBeenCalled();
  });
});
