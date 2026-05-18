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
import { useSelectedRecords } from "../useSelectedRecords";
import { useSelected } from "@/hooks/useSelected";

// Mock useSelected
jest.mock("@/hooks/useSelected");

describe("useSelectedRecords", () => {
  const mockTab = { id: "tab1" } as any;
  const mockRecords = [{ id: "rec1" }, { id: "rec2" }] as any[];

  let mockListeners: Record<string, Function[]> = {};
  const mockGraph = {
    getSelectedMultiple: jest.fn(() => []),
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
    mockGraph.getSelectedMultiple.mockReturnValue([]);
    (useSelected as jest.Mock).mockReturnValue({ graph: mockGraph });
  });

  it("should initialize with selected records from graph", () => {
    mockGraph.getSelectedMultiple.mockReturnValue(mockRecords);
    const { result } = renderHook(() => useSelectedRecords(mockTab));
    expect(result.current).toBe(mockRecords);
  });

  it("should update when multiple records are selected in the graph", () => {
    const { result } = renderHook(() => useSelectedRecords(mockTab));
    expect(result.current).toEqual([]);

    act(() => {
      if (mockListeners["selectedMultiple"]) {
        mockListeners["selectedMultiple"].forEach((cb) => cb(mockTab, mockRecords));
      }
    });

    expect(result.current).toBe(mockRecords);
  });

  it("should clear when multiple records are unselected in the graph", () => {
    mockGraph.getSelectedMultiple.mockReturnValue(mockRecords);
    const { result } = renderHook(() => useSelectedRecords(mockTab));
    expect(result.current).toBe(mockRecords);

    act(() => {
      if (mockListeners["unselectedMultiple"]) {
        mockListeners["unselectedMultiple"].forEach((cb) => cb(mockTab));
      }
    });

    expect(result.current).toEqual([]);
  });
});
