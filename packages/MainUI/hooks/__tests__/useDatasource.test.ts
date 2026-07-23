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
import type { Column, MRT_ColumnFiltersState } from "@workspaceui/api-client/src/api/types";

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

  it("retries a fetch requested while another was in flight (default-view filter race)", async () => {
    // Make filter criteria reflect the active filters so changing them changes queryParams.
    const { LegacyColumnFilterUtils } = require("@workspaceui/api-client/src/utils/search-utils");
    (LegacyColumnFilterUtils.createColumnFilterCriteria as jest.Mock).mockImplementation((filters: MRT_ColumnFiltersState) =>
      (filters ?? []).map((f) => ({ fieldName: f.id, operator: "equals", value: f.value }))
    );

    // The initial (unfiltered) fetch stays in flight until we resolve it manually.
    let resolveFirst: (v: unknown) => void = () => {};
    const firstPromise = new Promise((res) => {
      resolveFirst = res;
    });
    (datasource.get as jest.Mock)
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValue({ ok: true, data: { response: { data: mockRecords } } });

    const columns = [{ id: "name", columnName: "name", accessorKey: "name" }] as unknown as Column[];
    const { rerender } = renderHook(
      ({ filters }: { filters: MRT_ColumnFiltersState }) =>
        useDatasource({ entity: mockEntity, columns, activeColumnFilters: filters }),
      { initialProps: { filters: [] as MRT_ColumnFiltersState } }
    );

    // Initial fetch fired and is still in flight.
    await waitFor(() => expect(datasource.get).toHaveBeenCalledTimes(1));

    // Default-view filters land WHILE the initial fetch is in flight.
    rerender({ filters: [{ id: "name", value: "Order 1" }] });

    // That filtered fetch is guarded out (a fetch is in progress) — queued, not sent yet.
    expect(datasource.get).toHaveBeenCalledTimes(1);

    // The initial fetch settles -> the queued filtered fetch must run automatically.
    await act(async () => {
      resolveFirst({ ok: true, data: { response: { data: mockRecords } } });
      await firstPromise;
    });

    await waitFor(() => expect(datasource.get).toHaveBeenCalledTimes(2));

    // The retried request carried the filter criteria (the whole point of the fix).
    const secondCallParams = (datasource.get as jest.Mock).mock.calls[1][1];
    expect(JSON.stringify(secondCallParams)).toContain("Order 1");
  });

  describe("directNavigation gating", () => {
    const columns = [{ id: "id", columnName: "id" }] as unknown as Column[];
    const idFilter = [{ id: "id", value: "REC1" }] as MRT_ColumnFiltersState;

    beforeEach(() => {
      const { LegacyColumnFilterUtils } = require("@workspaceui/api-client/src/utils/search-utils");
      (LegacyColumnFilterUtils.createColumnFilterCriteria as jest.Mock).mockImplementation(() => [
        { fieldName: "id", operator: "equals", value: "REC1" },
      ]);
    });

    it("sets directNavigation when enabled (form mode)", async () => {
      renderHook(() =>
        useDatasource({ entity: mockEntity, columns, activeColumnFilters: idFilter, enableDirectNavigation: true })
      );
      await waitFor(() => expect(datasource.get).toHaveBeenCalled());
      const params = (datasource.get as jest.Mock).mock.calls[0][1];
      expect(params.directNavigation).toBe(true);
      expect(params.targetRecordId).toBe("REC1");
    });

    it("hard-filters without directNavigation when disabled (grid mode), keeping the id criterion", async () => {
      renderHook(() =>
        useDatasource({ entity: mockEntity, columns, activeColumnFilters: idFilter, enableDirectNavigation: false })
      );
      await waitFor(() => expect(datasource.get).toHaveBeenCalled());
      const params = (datasource.get as jest.Mock).mock.calls[0][1];
      expect(params.directNavigation).toBeUndefined();
      expect(params.targetRecordId).toBeUndefined();
      // The id criterion is still sent, so the grid hard-filters to the single record.
      expect(JSON.stringify(params.criteria)).toContain("REC1");
    });
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

  describe("hasFirstFetchCompleted", () => {
    // Distinguishes "a real datasource fetch has delivered a result" from the
    // pre-fetch placeholder (initial state or the `skip` phase). Consumers gate
    // load-time lifecycle hooks on it so an empty result set is fired only once
    // a genuine fetch completed — not on the empty placeholder.

    it("is false before the first fetch resolves and true once it completes", async () => {
      const { result } = renderHook(() => useDatasource({ entity: mockEntity }));

      expect(result.current.hasFirstFetchCompleted).toBe(false);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasFirstFetchCompleted).toBe(true);
    });

    it("stays false while `skip` is active even though `loaded` flips true", async () => {
      const { result } = renderHook(() => useDatasource({ entity: mockEntity, skip: true }));

      // `loaded` is flipped true during skip so consumers hide the spinner, but
      // no real fetch ran, so `hasFirstFetchCompleted` must remain false.
      await waitFor(() => expect(result.current.loaded).toBe(true));

      expect(result.current.hasFirstFetchCompleted).toBe(false);
      expect(datasource.get).not.toHaveBeenCalled();
    });

    it("becomes true even when the fetch returns zero rows", async () => {
      (datasource.get as jest.Mock).mockResolvedValue({ ok: true, data: { response: { data: [] } } });

      const { result } = renderHook(() => useDatasource({ entity: mockEntity }));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.records).toEqual([]);
      expect(result.current.hasFirstFetchCompleted).toBe(true);
    });
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
