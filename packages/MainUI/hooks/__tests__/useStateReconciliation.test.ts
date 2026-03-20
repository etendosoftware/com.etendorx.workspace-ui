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
import { useStateReconciliation } from "../useStateReconciliation";
import { useWindowContext } from "@/contexts/window";
import { useSelected } from "@/hooks/useSelected";

jest.mock("@/contexts/window");
jest.mock("@/hooks/useSelected");
jest.mock("@/utils/logger");

describe("useStateReconciliation", () => {
  const mockTab = { id: "tab1", window: "win1" } as any;
  const mockRecords = [{ id: "r1" }, { id: "r2" }] as any[];
  const mockClearSelectedRecord = jest.fn();
  const mockSetSelectedRecord = jest.fn();
  const mockGetSelectedRecord = jest.fn();

  const mockGraph = {
    getParent: jest.fn(() => null),
    getSelected: jest.fn(),
    clearSelected: jest.fn(),
    clearSelectedMultiple: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWindowContext as jest.Mock).mockReturnValue({
      clearSelectedRecord: mockClearSelectedRecord,
      setSelectedRecord: mockSetSelectedRecord,
      getSelectedRecord: mockGetSelectedRecord,
    });
    (useSelected as jest.Mock).mockReturnValue({ graph: mockGraph });
  });

  const defaultProps = {
    records: mockRecords,
    tab: mockTab,
    windowId: "win1",
    currentWindowId: "win1",
  };

  it("should initialize recordsMap correctly", () => {
    const { result } = renderHook(() => useStateReconciliation(defaultProps));
    expect(result.current.recordsMap.size).toBe(2);
    expect(result.current.recordsMap.has("r1")).toBe(true);
  });

  it("should reconcile URL only: clear URL if record not found", () => {
    const { result } = renderHook(() => useStateReconciliation(defaultProps));

    act(() => {
      result.current.reconcileStates("r3", []);
    });

    expect(mockClearSelectedRecord).toHaveBeenCalledWith("win1", "tab1");
  });

  it("should reconcile Table only: update URL if record exists", () => {
    const { result } = renderHook(() => useStateReconciliation(defaultProps));

    act(() => {
      result.current.reconcileStates(null, ["r1"]);
    });

    expect(mockSetSelectedRecord).toHaveBeenCalledWith("win1", "tab1", "r1");
  });

  it("should not reconcile if parent selection is missing", () => {
    mockGraph.getParent.mockReturnValue({ id: "parentTab" });
    mockGraph.getSelected.mockReturnValue(null); // No parent selection

    const { result } = renderHook(() => useStateReconciliation(defaultProps));

    act(() => {
      result.current.reconcileStates(null, ["r1"]);
    });

    expect(mockSetSelectedRecord).not.toHaveBeenCalled();
  });

  it("should handle sync errors by clearing state", () => {
    const { result } = renderHook(() => useStateReconciliation(defaultProps));

    act(() => {
      result.current.handleSyncError(new Error("test"), "context");
    });

    expect(mockClearSelectedRecord).toHaveBeenCalled();
    expect(mockGraph.clearSelected).toHaveBeenCalledWith(mockTab);
  });
});
