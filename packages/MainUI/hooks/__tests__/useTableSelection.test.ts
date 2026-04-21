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

import { renderHook } from "@testing-library/react";
import useTableSelection from "../useTableSelection";
import { useSelected } from "@/hooks/useSelected";
import { useUserContext } from "@/hooks/useUserContext";
import { useWindowContext } from "@/contexts/window";
import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";

// Mocks
jest.mock("@/hooks/useSelected");
jest.mock("@/hooks/useUserContext");
jest.mock("@/contexts/window");
jest.mock("@/utils/hooks/useTableSelection/sessionSync");
jest.mock("@/utils/logger");
jest.mock("@/utils/structures", () => ({
  mapBy: jest.fn((arr, key) => {
    const map: Record<string, any> = {};
    arr.forEach((item) => {
      map[item[key]] = item;
    });
    return map;
  }),
}));

const SESSION_SYNC_DEBOUNCE_MS = 250;
const mockSyncSelectedRecordsToSession = syncSelectedRecordsToSession as jest.MockedFunction<
  typeof syncSelectedRecordsToSession
>;

describe("useTableSelection", () => {
  const mockTab = { id: "tab1", window: "win1" } as any;
  const mockRecords = [{ id: "r1" }, { id: "r2" }] as any[];
  const mockSetSelectedRecord = jest.fn();
  const mockClearSelectedRecord = jest.fn();
  const mockGetSelectedRecord = jest.fn();

  const mockGraph = {
    getParent: jest.fn(() => null),
    getSelected: jest.fn(),
    setSelected: jest.fn(),
    clearSelected: jest.fn(),
    setSelectedMultiple: jest.fn(),
    clearSelectedMultiple: jest.fn(),
    getChildren: jest.fn(() => []),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSelected as jest.Mock).mockReturnValue({ graph: mockGraph });
    (useUserContext as jest.Mock).mockReturnValue({
      setSession: jest.fn(),
      setSessionSyncLoading: jest.fn(),
    });
    (useWindowContext as jest.Mock).mockReturnValue({
      activeWindow: { windowId: "win1", windowIdentifier: "win_1" },
      setSelectedRecord: mockSetSelectedRecord,
      clearSelectedRecord: mockClearSelectedRecord,
      getSelectedRecord: mockGetSelectedRecord,
    });
  });

  it("should sync selection to window context and graph", () => {
    const rowSelection = { r1: true };
    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

    expect(mockSetSelectedRecord).toHaveBeenCalledWith("win_1", "tab1", "r1");
    expect(mockGraph.setSelected).toHaveBeenCalledWith(mockTab, mockRecords[0]);
  });

  it("should clear selection when rowSelection is empty", () => {
    mockGraph.getSelected.mockReturnValue(mockRecords[0]); // Ensure graph thinks something is selected
    const { rerender } = renderHook(({ selection }) => useTableSelection(mockTab, mockRecords, selection), {
      initialProps: { selection: { r1: true } },
    });

    jest.clearAllMocks();
    rerender({ selection: {} });

    expect(mockClearSelectedRecord).toHaveBeenCalledWith("win_1", "tab1");
    expect(mockGraph.clearSelected).toHaveBeenCalledWith(mockTab);
  });

  it("should do nothing if window is inactive", () => {
    (useWindowContext as jest.Mock).mockReturnValue({
      activeWindow: { windowId: "win-different", windowIdentifier: "diff" },
      setSelectedRecord: mockSetSelectedRecord,
      clearSelectedRecord: mockClearSelectedRecord,
      getSelectedRecord: mockGetSelectedRecord,
    });

    const rowSelection = { r1: true };
    renderHook(() => useTableSelection(mockTab, mockRecords, rowSelection));

    expect(mockSetSelectedRecord).not.toHaveBeenCalled();
  });

  describe("session sync debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should fire session sync once after the debounce window for a single selection change", () => {
      renderHook(() => useTableSelection(mockTab, mockRecords, { r1: true }));

      expect(mockSyncSelectedRecordsToSession).not.toHaveBeenCalled();
      jest.advanceTimersByTime(SESSION_SYNC_DEBOUNCE_MS);
      expect(mockSyncSelectedRecordsToSession).toHaveBeenCalledTimes(1);
      expect(mockSyncSelectedRecordsToSession).toHaveBeenCalledWith(
        expect.objectContaining({ selectedRecords: [mockRecords[0]] })
      );
    });

    it("should collapse rapid selection changes into a single session sync", () => {
      const { rerender } = renderHook(({ selection }) => useTableSelection(mockTab, mockRecords, selection), {
        initialProps: { selection: { r1: true } as Record<string, boolean> },
      });

      jest.advanceTimersByTime(SESSION_SYNC_DEBOUNCE_MS - 50);
      rerender({ selection: { r2: true } });
      jest.advanceTimersByTime(SESSION_SYNC_DEBOUNCE_MS - 50);
      rerender({ selection: { r1: true } });
      expect(mockSyncSelectedRecordsToSession).not.toHaveBeenCalled();

      jest.advanceTimersByTime(SESSION_SYNC_DEBOUNCE_MS);
      expect(mockSyncSelectedRecordsToSession).toHaveBeenCalledTimes(1);
      expect(mockSyncSelectedRecordsToSession).toHaveBeenCalledWith(
        expect.objectContaining({ selectedRecords: [mockRecords[0]] })
      );
    });
  });
});
