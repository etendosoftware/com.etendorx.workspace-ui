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

import { renderHook, waitFor } from "@testing-library/react";
import { useCurrentRecord } from "../useCurrentRecord";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock datasource
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: {
    get: jest.fn(),
  },
}));

describe("useCurrentRecord", () => {
  const mockTab = {
    id: "tab1",
    entityName: "TestEntity",
    window: "window1",
  } as Tab;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch record when not in cache", async () => {
    const recordId = "record_test_1";
    const recordData = { id: recordId, name: "Test Record 1" };

    (datasource.get as jest.Mock).mockResolvedValue({
      data: {
        response: {
          data: [recordData],
          totalResults: 1,
        },
        status: 200,
      },
    });

    const { result } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: recordId }));

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.record).toEqual(recordData);
    expect(datasource.get).toHaveBeenCalledTimes(1);
  });

  it("should use cached record on subsequent calls", async () => {
    const recordId = "record_test_2";
    const recordData = { id: recordId, name: "Test Record 2" };

    (datasource.get as jest.Mock).mockResolvedValue({
      data: {
        response: {
          data: [recordData],
          totalResults: 1,
        },
        status: 200,
      },
    });

    // First render to populate cache
    const { unmount } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: recordId }));

    await waitFor(() => {
      expect(datasource.get).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Second render with same params
    const { result } = renderHook(() => useCurrentRecord({ tab: mockTab, recordId: recordId }));

    // Should not be loading and should have data immediately
    expect(result.current.loading).toBe(false);
    expect(result.current.record).toEqual(recordData);

    // Should not have called datasource again (still 1 from first call)
    expect(datasource.get).toHaveBeenCalledTimes(1);
  });

  it("should fetch new record when params change", async () => {
    const recordId1 = "record_test_3a";
    const recordData1 = { id: recordId1, name: "Test Record 3a" };
    const recordId2 = "record_test_3b";
    const recordData2 = { id: recordId2, name: "Test Record 3b" };

    (datasource.get as jest.Mock).mockImplementation((entity, params) => {
      const id = params.criteria[0].value;
      if (id === recordId1) {
        return Promise.resolve({
          data: { response: { data: [recordData1], totalResults: 1 }, status: 200 },
        });
      }
      if (id === recordId2) {
        return Promise.resolve({
          data: { response: { data: [recordData2], totalResults: 1 }, status: 200 },
        });
      }
      return Promise.resolve({ data: { response: { data: [], totalResults: 0 }, status: 200 } });
    });

    // First fetch
    const { result, rerender } = renderHook(({ id }) => useCurrentRecord({ tab: mockTab, recordId: id }), {
      initialProps: { id: recordId1 },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.record).toEqual(recordData1);

    // Change record ID
    rerender({ id: recordId2 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.record).toEqual(recordData2);
    });

    // Should be called twice in total
    expect(datasource.get).toHaveBeenCalledTimes(2);
  });
});
