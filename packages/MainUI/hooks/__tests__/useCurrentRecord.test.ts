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

  // Capture registered "selected" event listeners so tests can simulate graph events.
  let selectedListeners: Array<(...args: any[]) => void> = [];

  const mockGraph = {
    getRecord: jest.fn(),
    setSelected: jest.fn(),
    setSelectedMultiple: jest.fn(),
    on: jest.fn((event: string, listener: (...args: any[]) => void) => {
      if (event === "selected") {
        selectedListeners.push(listener);
      }
    }),
    off: jest.fn((event: string, listener: (...args: any[]) => void) => {
      if (event === "selected") {
        selectedListeners = selectedListeners.filter((l) => l !== listener);
      }
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    selectedListeners = [];
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

  it("should update record immediately via setRecord when graph emits selected with a new _identifier", async () => {
    // Simulate the initial state: record is loaded from cache with original identifier.
    const initialRecord = { id: "record1", _identifier: "Old Name", name: "Old Name" };
    mockGraph.getRecord.mockReturnValue(initialRecord);

    const { result } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: "record1" }));

    // Verify initial state
    expect(result.current.record).toEqual(initialRecord);

    // Simulate save: graph.setSelected is called with the updated record (new _identifier).
    // This emits the "selected" event, which the hook's listener catches.
    const updatedRecord = { id: "record1", _identifier: "New Name", name: "New Name" };
    await act(async () => {
      for (const listener of selectedListeners) {
        listener(mockTab, updatedRecord);
      }
    });

    // The hook must update record state immediately without waiting for a re-fetch,
    // so that AppBreadcrumb re-renders and shows the new _identifier.
    expect(result.current.record).toEqual(updatedRecord);
    expect((result.current.record as any)._identifier).toBe("New Name");
  });

  it("should NOT update record a second time when graph emits selected with the same _identifier again", async () => {
    const initialRecord = { id: "record1", _identifier: "Old Name", name: "Old Name" };
    mockGraph.getRecord.mockReturnValue(initialRecord);

    const { result } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: "record1" }));

    // First event: identifier changes from null → "New Name". State updates.
    const updatedRecord = { id: "record1", _identifier: "New Name", name: "New Name" };
    await act(async () => {
      for (const listener of selectedListeners) {
        listener(mockTab, updatedRecord);
      }
    });
    expect((result.current.record as any)._identifier).toBe("New Name");

    // Second event: same identifier "New Name" again — no state update expected.
    const sameAgainRecord = { id: "record1", _identifier: "New Name", name: "Some other change" };
    const recordBeforeSecondEvent = result.current.record;
    await act(async () => {
      for (const listener of selectedListeners) {
        listener(mockTab, sameAgainRecord);
      }
    });

    // Record object reference and content should be unchanged (setRecord was not called again)
    expect(result.current.record).toBe(recordBeforeSecondEvent);
    expect((result.current.record as any)._identifier).toBe("New Name");
  });

  it("should NOT update record when graph emits selected for a different tab", async () => {
    const initialRecord = { id: "record1", _identifier: "Old Name" };
    mockGraph.getRecord.mockReturnValue(initialRecord);

    const { result } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: "record1" }));

    const differentTab = { ...mockTab, id: "differentTabId" };
    const updatedRecord = { id: "record1", _identifier: "New Name" };
    await act(async () => {
      for (const listener of selectedListeners) {
        listener(differentTab, updatedRecord);
      }
    });

    // Record must NOT change since the event was for a different tab
    expect(result.current.record).toEqual(initialRecord);
  });
});
