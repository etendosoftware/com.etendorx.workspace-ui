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

/**
 * @jest-environment jsdom
 */

// Bypass TS module resolution for root dependency
const { renderHook } = require("@testing-library/react");
import { useColumnFilterData } from "../useColumnFilterData";
import { datasource } from "../../api/datasource";

jest.mock("../../api/datasource", () => ({
  datasource: {
    get: jest.fn(),
  },
}));

describe("hooks/useColumnFilterData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches filter options with basic params", async () => {
    const mockOptions = [
      { id: "1", _identifier: "Item 1" },
      { id: "2", _identifier: "Item 2" },
    ];
    (datasource.get as jest.Mock).mockResolvedValue({
      ok: true,
      data: { response: { data: mockOptions } },
    });

    const { result } = renderHook(() => useColumnFilterData());
    const options = await result.current.fetchFilterOptions({ datasourceId: "ProductDS" });

    expect(datasource.get).toHaveBeenCalledWith(
      "ProductDS",
      expect.objectContaining({
        dataSource: "ProductDS",
        operationType: "fetch",
        startRow: 0,
        endRow: 19,
      })
    );
    expect(options).toEqual([
      { id: "1", label: "Item 1", value: "Item 1" },
      { id: "2", label: "Item 2", value: "Item 2" },
    ]);
  });

  it("handles distinctField and tabId", async () => {
    const mockOptions = [{ id: "1", category: "A", category$_identifier: "Category A" }];
    (datasource.get as jest.Mock).mockResolvedValue({
      ok: true,
      data: { response: { data: mockOptions } },
    });

    const { result } = renderHook(() => useColumnFilterData());
    const options = await result.current.fetchFilterOptions({
      datasourceId: "ProductDS",
      searchQuery: "search",
      limit: 10,
      distinctField: "category",
      tabId: "TAB1",
    });

    expect(datasource.get).toHaveBeenCalledWith(
      "ProductDS",
      expect.objectContaining({
        _distinct: "category",
        tabId: "TAB1",
        _selectedProperties: "id,category,category$_identifier",
      })
    );

    expect(options[0]).toEqual({
      id: "A",
      label: "Category A",
      value: "A",
    });
  });

  it("handles empty/error response", async () => {
    (datasource.get as jest.Mock).mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useColumnFilterData());

    const options = await result.current.fetchFilterOptions({ datasourceId: "DS" });
    expect(options).toEqual([]);
  });

  it("logs error and returns empty array on failure", async () => {
    const error = new Error("Fetch failed");
    (datasource.get as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useColumnFilterData());
    const options = await result.current.fetchFilterOptions({ datasourceId: "DS" });

    expect(options).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching filter options:", error);
    consoleSpy.mockRestore();
  });
  describe("characteristics tree", () => {
    const TREE_DS = "BE2735798ECC4EF88D131F16F1C4EC72";
    const NAME_CRITERIA = { fieldName: "name", operator: "iContains", value: "Cola" };

    const mockTreeResponse = (data: Record<string, unknown>[]) =>
      (datasource.get as jest.Mock).mockResolvedValue({ ok: true, data: { response: { data } } });

    it("keeps the characteristic of each value", async () => {
      mockTreeResponse([
        { id: "C1", _identifier: "Formato", isCharacteristic: true },
        {
          id: "V1",
          _identifier: "330 ml",
          parentId: "C1",
          characteristic: "C1",
          characteristic$_identifier: "Formato",
        },
      ]);

      const { result } = renderHook(() => useColumnFilterData());
      const options = await result.current.fetchFilterOptions({ datasourceId: TREE_DS });

      expect(options).toEqual([
        { id: "C1", label: "Formato", value: "Formato", isCharacteristic: true },
        {
          id: "V1",
          label: "330 ml",
          value: "330 ml",
          parentId: "C1",
          characteristic: "C1",
          characteristicName: "Formato",
        },
      ]);
    });

    it("sends the grid parameters and criteria instead of a search", async () => {
      mockTreeResponse([]);

      const { result } = renderHook(() => useColumnFilterData());
      await result.current.fetchFilterOptions({
        datasourceId: TREE_DS,
        searchQuery: "ignored",
        treeParams: {
          _parentDSIdentifier: "Product",
          _propertyPath: "e",
          _processId: undefined,
          _buttonOwnerContextInfo: "",
          criteria: [NAME_CRITERIA],
        },
      });

      const params = (datasource.get as jest.Mock).mock.calls[0][1];
      expect(params).toEqual(
        expect.objectContaining({
          _parentDSIdentifier: "Product",
          _propertyPath: "e",
          criteria: [NAME_CRITERIA],
          operator: "and",
          _constructor: "AdvancedCriteria",
        })
      );
      expect(params).not.toHaveProperty("_processId");
      expect(params).not.toHaveProperty("_buttonOwnerContextInfo");
    });

    it("sends no criteria when the grid has none", async () => {
      mockTreeResponse([]);

      const { result } = renderHook(() => useColumnFilterData());
      await result.current.fetchFilterOptions({
        datasourceId: TREE_DS,
        treeParams: { _processId: "P1", criteria: [] },
      });

      const params = (datasource.get as jest.Mock).mock.calls[0][1];
      expect(params._processId).toBe("P1");
      expect(params).not.toHaveProperty("criteria");
    });
  });
});
