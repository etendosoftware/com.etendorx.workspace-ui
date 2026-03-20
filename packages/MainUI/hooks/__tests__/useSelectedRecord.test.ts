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

import { renderHook, act } from "@testing-library/react";
import { useSelectedRecord } from "../useSelectedRecord";
import { useSelected } from "../useSelected";

// Mock useSelected
jest.mock("../useSelected");

describe("useSelectedRecord", () => {
  const mockTab = { id: "tab1" } as any;
  const mockRecord = { id: "rec1" } as any;

  let mockListeners: Record<string, Function[]> = {};
  const mockGraph = {
    getSelected: jest.fn(() => undefined),
    addListener: jest.fn((event, cb) => {
      if (!mockListeners[event]) mockListeners[event] = [];
      mockListeners[event].push(cb);
      return mockGraph;
    }),
    removeListener: jest.fn((event, cb) => {
      if (mockListeners[event]) {
        mockListeners[event] = mockListeners[event].filter((l) => l !== cb);
      }
      return mockGraph;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockListeners = {};
    mockGraph.getSelected.mockReturnValue(undefined);
    (useSelected as jest.Mock).mockReturnValue({ graph: mockGraph });
  });

  it("should initialize with currently selected record from graph", () => {
    mockGraph.getSelected.mockReturnValue(mockRecord);
    const { result } = renderHook(() => useSelectedRecord(mockTab));
    expect(result.current).toBe(mockRecord);
    expect(mockGraph.getSelected).toHaveBeenCalledWith(mockTab);
  });

  it("should update when a record is selected in the graph", async () => {
    const { result } = renderHook(() => useSelectedRecord(mockTab));
    expect(result.current).toBeUndefined();

    act(() => {
      if (mockListeners["selected"]) {
        mockListeners["selected"].forEach((cb) => cb(mockTab, mockRecord));
      }
    });

    expect(result.current).toBe(mockRecord);
  });

  it("should update to undefined when a record is unselected in the graph", () => {
    mockGraph.getSelected.mockReturnValue(mockRecord);
    const { result } = renderHook(() => useSelectedRecord(mockTab));
    expect(result.current).toBe(mockRecord);

    act(() => {
      if (mockListeners["unselected"]) {
        mockListeners["unselected"].forEach((cb) => cb(mockTab));
      }
    });

    expect(result.current).toBeUndefined();
  });

  it("should not update if the event is for a different tab", () => {
    const { result } = renderHook(() => useSelectedRecord(mockTab));

    act(() => {
      if (mockListeners["selected"]) {
        mockListeners["selected"].forEach((cb) => cb({ id: "otherTab" }, mockRecord));
      }
    });

    expect(result.current).toBeUndefined();
  });

  it("should cleanup listeners on unmount", () => {
    const { unmount } = renderHook(() => useSelectedRecord(mockTab));
    unmount();
    expect(mockGraph.removeListener).toHaveBeenCalledTimes(2);
  });
});
