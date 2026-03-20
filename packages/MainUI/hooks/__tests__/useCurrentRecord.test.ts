/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook, act } from "@testing-library/react";
import { useCurrentRecord } from "../useCurrentRecord";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useSelected } from "../useSelected";

jest.mock("@workspaceui/api-client/src/api/datasource");
jest.mock("../useSelected");

describe("useCurrentRecord", () => {
  const mockTab = {
    id: "tabId",
    entityName: "testEntity",
    window: "windowId",
    fields: {},
  } as any;

  const mockGraph = {
    getRecord: jest.fn(),
    setSelected: jest.fn(),
    setSelectedMultiple: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSelected as jest.Mock).mockReturnValue({ graph: mockGraph });
  });

  it("should return empty record and loading false if no tab or recordId", () => {
    const { result } = renderHook(() => useCurrentRecord({}));
    expect(result.current.record).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  it("should return cached record from graph if available and no property fields", () => {
    const cachedRecord = { id: "record1", name: "test" };
    mockGraph.getRecord.mockReturnValue(cachedRecord);

    const { result } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: "record1" }));

    expect(mockGraph.getRecord).toHaveBeenCalledWith(mockTab, "record1");
    expect(result.current.record).toEqual(cachedRecord);
    expect(result.current.loading).toBe(false);
  });

  it("should fetch record from datasource if not in cache", async () => {
    mockGraph.getRecord.mockReturnValue(null);
    const fetchedRecord = { id: "record1", name: "fetched" };
    (datasource.get as jest.Mock).mockResolvedValue({
      data: {
        response: {
          data: [fetchedRecord],
        },
      },
    });

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: "record1" }));
    });

    expect(datasource.get).toHaveBeenCalledWith(
      "testEntity",
      expect.objectContaining({
        criteria: [{ fieldName: "id", operator: "equals", value: "record1" }],
      })
    );

    expect(hookResult.result.current.record).toEqual(fetchedRecord);
    expect(hookResult.result.current.loading).toBe(false);
  });

  it("should bypass cache and fetch from datasource if tab has property fields", async () => {
    const tabWithProps = {
      ...mockTab,
      fields: {
        field1: {
          displayed: true,
          hqlName: "field1",
          column: { propertyPath: "file.type" },
        },
      },
    };

    const fetchedRecord = { id: "record1", file$type: "RF" };
    (datasource.get as jest.Mock).mockResolvedValue({
      data: {
        response: {
          data: [fetchedRecord],
        },
      },
    });

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useCurrentRecord({ tab: tabWithProps, recordId: "record1" }));
    });

    expect(mockGraph.getRecord).not.toHaveBeenCalled();
    expect(datasource.get).toHaveBeenCalledWith(
      "testEntity",
      expect.objectContaining({
        extraProperties: "file.type",
      })
    );

    // Check normalization
    expect(hookResult.result.current.record).toEqual({ id: "record1", field1: "RF" });
  });

  it("should handle fetch errors gracefully", async () => {
    mockGraph.getRecord.mockReturnValue(null);
    (datasource.get as jest.Mock).mockRejectedValue(new Error("Network error"));

    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: "record1" }));
    });

    expect(hookResult.result.current.record).toEqual({});
    expect(hookResult.result.current.loading).toBe(false);
  });
});
