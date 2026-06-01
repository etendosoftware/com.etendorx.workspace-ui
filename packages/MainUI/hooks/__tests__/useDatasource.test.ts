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

  describe("locally-added rows survive refetches", () => {
    // Reproduces the Add Payment / GL Items bug: the user creates a row, the
    // PayScript fires and changes form values, those values feed into
    // datasourceOptions, the hook refetches with new params, and (before the fix)
    // the locally-added row was wiped because page-1 replaced records entirely.

    it("preserves `_locallyAdded` rows when a refetch returns no matching id", async () => {
      const { result, rerender } = renderHook(
        ({ params }: { params: Record<string, unknown> }) => useDatasource({ entity: mockEntity, params }),
        { initialProps: { params: { tabId: "T1" } } }
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.addRecordLocally({ id: "local-1", name: "GL Item draft", _locallyAdded: true });
      });
      expect(result.current.records.some((r) => r.id === "local-1")).toBe(true);

      // PayScript-style refetch trigger: a new params reference reusing the
      // page-1 replace path. Server still returns the original record set.
      rerender({ params: { tabId: "T1", amount_gl_items: "-50.00" } });
      await waitFor(() => expect(datasource.get).toHaveBeenCalledTimes(2));

      expect(result.current.records.some((r) => r.id === "local-1")).toBe(true);
      expect(result.current.records.some((r) => r.id === "1")).toBe(true);
    });

    it("drops `_locallyAdded` row if the same id arrives from the server (avoids duplicates)", async () => {
      (datasource.get as jest.Mock)
        .mockResolvedValueOnce({ ok: true, data: { response: { data: [] } } })
        .mockResolvedValueOnce({
          ok: true,
          data: { response: { data: [{ id: "local-1", name: "Now on server" }] } },
        });

      const { result, rerender } = renderHook(
        ({ params }: { params: Record<string, unknown> }) => useDatasource({ entity: mockEntity, params }),
        { initialProps: { params: { tabId: "T1" } } }
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.addRecordLocally({ id: "local-1", name: "Draft", _locallyAdded: true });
      });

      rerender({ params: { tabId: "T1", x: 1 } });
      await waitFor(() => {
        const rows = result.current.records.filter((r) => r.id === "local-1");
        expect(rows).toHaveLength(1);
        expect(rows[0].name).toBe("Now on server");
      });
    });

    it("does not preserve non-`_locallyAdded` rows on refetch (no behaviour change for server-driven rows)", async () => {
      (datasource.get as jest.Mock)
        .mockResolvedValueOnce({ ok: true, data: { response: { data: mockRecords } } })
        .mockResolvedValueOnce({ ok: true, data: { response: { data: [{ id: "99", name: "Refreshed" }] } } });

      const { result, rerender } = renderHook(
        ({ params }: { params: Record<string, unknown> }) => useDatasource({ entity: mockEntity, params }),
        { initialProps: { params: { tabId: "T1" } } }
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      // No `_locallyAdded` flag → record should be replaced like before.
      act(() => {
        result.current.addRecordLocally({ id: "transient", name: "Just appended" });
      });

      rerender({ params: { tabId: "T1", x: 1 } });
      await waitFor(() => {
        expect(result.current.records.some((r) => r.id === "99")).toBe(true);
        expect(result.current.records.some((r) => r.id === "transient")).toBe(false);
      });
    });
  });
});
