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
    const options = await result.current.fetchFilterOptions("ProductDS");

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
    const options = await result.current.fetchFilterOptions("ProductDS", undefined, "search", 10, "category", "TAB1");

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

    const options = await result.current.fetchFilterOptions("DS");
    expect(options).toEqual([]);
  });

  it("logs error and returns empty array on failure", async () => {
    const error = new Error("Fetch failed");
    (datasource.get as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useColumnFilterData());
    const options = await result.current.fetchFilterOptions("DS");

    expect(options).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching filter options:", error);
    consoleSpy.mockRestore();
  });
});
