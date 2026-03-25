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

import { renderHook, act, waitFor } from "@testing-library/react";
import { useDatasource } from "../useDatasource";
import { datasource } from "@workspaceui/api-client/src/api/datasource";

// Mocks
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: {
    get: jest.fn(),
  },
}));
jest.mock("@/utils/logger");
jest.mock("@workspaceui/api-client/src/utils/search-utils", () => ({
  LegacyColumnFilterUtils: { createColumnFilterCriteria: jest.fn(() => []) },
  SearchUtils: { createSearchCriteria: jest.fn(() => []) },
}));

describe("useDatasource hook", () => {
  const mockEntity = "Order";
  const mockRecords = [{ id: "1", name: "Order 1" }];

  beforeEach(() => {
    jest.clearAllMocks();
    (datasource.get as jest.Mock).mockResolvedValue({
      ok: true,
      data: { response: { data: mockRecords } },
    });
  });

  it("should fetch data on mount", async () => {
    const { result } = renderHook(() => useDatasource({ entity: mockEntity }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(datasource.get).toHaveBeenCalledWith(mockEntity, expect.any(Object));
    expect(result.current.records).toEqual(mockRecords);
  });

  it("should handle error during fetch", async () => {
    (datasource.get as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useDatasource({ entity: mockEntity }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeDefined();
  });

  it("should add a record locally", async () => {
    const { result } = renderHook(() => useDatasource({ entity: mockEntity }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addRecordLocally({ id: "2", name: "New Order" });
    });

    expect(result.current.records).toHaveLength(2);
    expect(result.current.records[0].id).toBe("2");
  });

  it("should remove a record locally", async () => {
    const { result } = renderHook(() => useDatasource({ entity: mockEntity }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.removeRecordLocally("1");
    });

    expect(result.current.records).toHaveLength(0);
  });
});
