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

import { renderHook } from "@testing-library/react";
import type { DatasourceOptions, Tab } from "@workspaceui/api-client/src/api/types";
import { DEFAULT_TABLE_STATE, useWindowStore } from "@/stores/windowStore";
import { exportGridToCsv } from "@/utils/export/csvExport";
import { useGridCsvExport } from "../useGridCsvExport";

jest.mock("@/utils/export/csvExport", () => ({ exportGridToCsv: jest.fn() }));
jest.mock("@/stores/windowStore", () => ({
  DEFAULT_TABLE_STATE: { filters: [], sorting: [] },
  useWindowStore: { getState: jest.fn() },
}));

const WINDOW_IDENTIFIER = "143_1";
const mockTab = { id: "186", entityName: "Order" } as unknown as Tab;
const gridParams: DatasourceOptions = { criteria: [{ fieldName: "documentNo", operator: "iContains", value: "10" }] };
const getRequestParams = jest.fn(() => gridParams);
const mockGetState = useWindowStore.getState as jest.Mock;

const renderExport = (windowIdentifier: string | null) =>
  renderHook(() => useGridCsvExport({ tab: mockTab, windowIdentifier, getRequestParams })).result.current;

describe("useGridCsvExport", () => {
  beforeEach(() => jest.clearAllMocks());

  it("exports the tab with the grid's current query and table state", async () => {
    const tableState = { sorting: [{ id: "documentNo", desc: true }] };
    mockGetState.mockReturnValue({
      windows: { [WINDOW_IDENTIFIER]: { tabs: { [mockTab.id]: { table: tableState } } } },
    });

    await renderExport(WINDOW_IDENTIFIER)();

    expect(exportGridToCsv).toHaveBeenCalledWith({ tab: mockTab, tableState, gridParams });
  });

  it("falls back to the default table state when the tab has none yet", async () => {
    mockGetState.mockReturnValue({ windows: {} });

    await renderExport(WINDOW_IDENTIFIER)();

    expect(exportGridToCsv).toHaveBeenCalledWith({ tab: mockTab, tableState: DEFAULT_TABLE_STATE, gridParams });
  });

  it("fails without a window context", async () => {
    await expect(renderExport(null)()).rejects.toThrow("Window context not found");
    expect(exportGridToCsv).not.toHaveBeenCalled();
  });
});
