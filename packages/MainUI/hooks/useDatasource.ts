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

import { logger } from "@/utils/logger";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type {
  Column,
  DatasourceOptions,
  EntityData,
  MRT_ColumnFiltersState,
} from "@workspaceui/api-client/src/api/types";
import { LegacyColumnFilterUtils, SearchUtils } from "@workspaceui/api-client/src/utils/search-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const loadData = async (
  entity: string,
  page: number,
  pageSize: number,
  params: DatasourceOptions,
  treeOptions?: {
    isTreeMode: boolean;
    windowId?: string;
    tabId?: string;
    referencedTableId?: string;
    parentId?: string | number;
  },
  _isFiltering = false
) => {
  const safePageSize = pageSize ?? 1000;
  const startRow = (page - 1) * pageSize;
  const endRow = startRow + pageSize;

  const processedParams = {
    ...params,
    _textMatchStyle: "substring",
    startRow,
    endRow,
    pageSize: safePageSize,
  };

  if (treeOptions?.isTreeMode) {
    const parentIdCriteria = {
      fieldName: "parentId",
      operator: "equals",
      value: String(treeOptions.parentId ?? -1),
    };

    // Ensure criteria is an array before spreading. params.criteria can be a
    // single object (not an array) when the caller collapses allCriteria[0]
    // for a single-criterion case — spreading a plain object throws "not iterable".
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCriteria = params.criteria as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentCriteria: any[];
    if (Array.isArray(rawCriteria)) {
      currentCriteria = rawCriteria;
    } else {
      currentCriteria = rawCriteria ? [rawCriteria] : [];
    }
    processedParams.criteria = [...currentCriteria, parentIdCriteria];

    if (treeOptions.tabId) {
      processedParams.tabId = treeOptions.tabId;
    }
    if (treeOptions.windowId) {
      processedParams.windowId = treeOptions.windowId;
    }
    if (treeOptions.referencedTableId) {
      processedParams.referencedTableId = treeOptions.referencedTableId;
    }
  }

  const result = await datasource.get(entity, processedParams);

  return result;
};

const defaultParams: DatasourceOptions = {
  pageSize: 1000,
};

const EMPTY_FILTERS: MRT_ColumnFiltersState = [];

export type UseDatasourceOptions = {
  entity: string;
  params?: DatasourceOptions;
  searchQuery?: string;
  columns?: Column[];
  skip?: boolean;
  treeOptions?: {
    isTreeMode: boolean;
    windowId?: string;
    tabId?: string;
    referencedTableId?: string;
    parentId?: string | number;
  };
  activeColumnFilters?: MRT_ColumnFiltersState;
  isImplicitFilterApplied?: boolean;
  setIsImplicitFilterApplied?: (value: boolean) => void;
  /**
   * Optional override for the refetch-trigger key. When provided, after the
   * first successful fetch the hook only refetches when this string changes;
   * `params` is still read fresh on every render so the request body always
   * reflects the latest values. Use to fold rapidly-changing context into
   * the payload (e.g. payscript-driven form values) without triggering a
   * refetch on every change. Until the first fetch completes (`loaded`),
   * the hook falls back to hashing the full `params` so initialization
   * updates (e.g. onLoad populating form values) still re-trigger the
   * pending fetch and make the initial request payload complete.
   */
  refetchKey?: string;
  /**
   * When an `id` column filter is present, the request normally sets
   * `directNavigation: true` so Classic returns the page positioned on the record
   * (used to place the grid behind an open form). In grid mode we instead want the
   * `id` filter to HARD-filter to exactly that record (e.g. reconstructed ancestor
   * tabs after a linked-item navigation). Pass `false` to disable directNavigation
   * so the retained `id` criterion filters to a single row. Defaults to `true`.
   */
  enableDirectNavigation?: boolean;
};

export function useDatasource({
  entity,
  params = defaultParams,
  columns,
  searchQuery,
  skip,
  treeOptions,
  activeColumnFilters = EMPTY_FILTERS,
  isImplicitFilterApplied = false,
  setIsImplicitFilterApplied,
  refetchKey,
  enableDirectNavigation = true,
}: UseDatasourceOptions) {
  // Detect if user is filtering (search or column filters)
  const isFiltering = useMemo(() => {
    return (!!searchQuery && searchQuery.trim().length > 0) || (activeColumnFilters && activeColumnFilters.length > 0);
  }, [searchQuery, activeColumnFilters]);

  const [loading, setLoading] = useState(!skip);
  const [loaded, setLoaded] = useState(false);
  // Distinct from `loaded` — that one is also flipped true while `skip` is
  // active so consumers don't show a spinner during the skip phase. This flag
  // tracks "has a real fetch completed yet?" and is used by the `refetchKey`
  // opt-in to know when it's safe to lock the refetch trigger to the narrow
  // key (vs. the full params hash, which is used during initialization so
  // onLoad-populated form values can still re-trigger the pending fetch).
  const [hasFirstFetchCompleted, setHasFirstFetchCompleted] = useState(false);
  const [records, setRecords] = useState<EntityData[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const fetchInProgressRef = useRef(false);
  // Tracks whether at least one successful fetch has completed. Used to skip
  // redundant re-fetches triggered by initialization effects in useTableData
  // (e.g. setTableColumnSorting, setTableColumnVisibility) that re-run this
  // effect even when the query params haven't changed.
  const dataLoadedRef = useRef(false);
  // Tracks the previous "query identity" (everything except page) to detect
  // filter/entity changes. When the query changes while page > 1 we fetch
  // page 1 directly and guard against the re-run caused by setPage(1).
  const prevQueryKeyRef = useRef("");
  const skipPageResetFetchRef = useRef(false);
  // When a fetch is requested while another is already in flight (e.g. a default
  // saved-view's filters land in the store just after the initial unfiltered fetch
  // started), we remember the requested page here and re-run the fetch once the
  // in-flight one settles. Without this the guarded-out fetch is silently dropped
  // and never retried, leaving the grid showing unfiltered records until a manual
  // refresh. `fetchDataRef` always points at the latest fetchData closure so the
  // retry uses the current queryParams, not the stale in-flight one.
  const pendingFetchRef = useRef<number | null>(null);
  const fetchDataRef = useRef<((targetPage?: number) => Promise<void>) | null>(null);
  const removeRecordLocally = useCallback((recordId: string) => {
    setRecords((prevRecords) => prevRecords.filter((record) => String(record.id) !== recordId));
  }, []);

  // Update a specific record in-place by ID
  const updateRecordLocally = useCallback((recordId: string, updatedRecord: EntityData) => {
    setRecords((prevRecords) => prevRecords.map((record) => (String(record.id) === recordId ? updatedRecord : record)));
  }, []);

  // Add a new record at the beginning of the array
  const addRecordLocally = useCallback((newRecord: EntityData) => {
    setRecords((prevRecords) => [newRecord, ...prevRecords]);
  }, []);

  const fetchMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  // Sync pageSize with params
  useEffect(() => {
    if (params.pageSize && params.pageSize !== pageSize) {
      setPageSize(params.pageSize);
    }
  }, [params.pageSize, pageSize]);

  const reinit = useCallback(() => {
    setRecords([]);
    setPage(1);
    setHasMoreRecords(true);
    dataLoadedRef.current = false;
  }, []);

  // The MRT filter id `"id"` does NOT always mean "the entity's raw primary key
  // column" — some grids (e.g. WindowReferenceGrid's generic Order/Invoice
  // reference column) legitimately have a real `Column` whose `id` happens to be
  // `"id"` but whose actual queryable field (`filterFieldName`) is something else
  // entirely (e.g. a text reference). For those, createColumnFilterCriteria below
  // already resolves the filter correctly and must be left alone. Only fall back to
  // a raw `id` equality (further down) when NO such Column exists — e.g. reconstructed
  // ancestor tabs from a linked-item navigation, whose primary key is virtually never
  // a real AD_Field/column, so the lookup below would otherwise silently drop it.
  const idColumnFilter = useMemo(() => activeColumnFilters.find((f) => f.id === "id"), [activeColumnFilters]);
  const hasIdColumn = useMemo(
    () => (columns ?? []).some((col) => col.id === "id" || col.columnName === "id"),
    [columns]
  );

  const columnFilterCriteria = useMemo(() => {
    if (!columns || !activeColumnFilters.length) {
      return [];
    }
    return LegacyColumnFilterUtils.createColumnFilterCriteria(activeColumnFilters, columns);
  }, [activeColumnFilters, columns]);

  // Memoize treeOptions to prevent unnecessary reference changes
  const memoizedTreeOptions = useMemo(
    () => treeOptions,
    [
      treeOptions?.isTreeMode,
      treeOptions?.windowId,
      treeOptions?.tabId,
      treeOptions?.referencedTableId,
      treeOptions?.parentId,
    ]
  );

  // Stabilize params to prevent unnecessary fetches.
  // Until the first real fetch completes (`hasFirstFetchCompleted === false`),
  // use the full JSON.stringify of `params` so initialization-time mutations
  // (e.g. onLoad populating form values that get folded into the request
  // body) correctly re-trigger the pending fetch and produce a complete
  // initial request. After the first fetch settles, if the caller provided
  // a `refetchKey`, honor it: only re-trigger when that key changes
  // (filter/sort/etc.), ignoring rapidly-changing context like
  // payscript-driven form scalars.
  const stableParamsTriggerKey =
    !hasFirstFetchCompleted || refetchKey === undefined ? JSON.stringify(params) : refetchKey;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [stableParamsTriggerKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryParams = useMemo(() => {
    const rawCriteria = stableParams.criteria;
    const baseCriteria = [rawCriteria].flat().filter(Boolean);
    const searchCriteriaArray = (
      searchQuery && columns ? SearchUtils.createSearchCriteria(columns, searchQuery) : []
    ) as any[];

    let allCriteria: any[] = [...baseCriteria];

    if (searchCriteriaArray.length > 0) {
      allCriteria = [...allCriteria, ...searchCriteriaArray];
    }

    if (columnFilterCriteria.length > 0) {
      allCriteria = [...allCriteria, ...(columnFilterCriteria as any[])];
    }

    // A real Column for "id" means createColumnFilterCriteria above already resolved
    // this filter correctly (via filterFieldName) — don't also inject a raw equality
    // on top of it, and don't treat it as an id-navigation filter below.
    const missingIdColumn = Boolean(idColumnFilter) && !hasIdColumn;
    if (missingIdColumn) {
      allCriteria = [...allCriteria, { fieldName: "id", operator: "equals", value: idColumnFilter?.value }];
    }
    const hasIdFilter = missingIdColumn;
    // Only position-navigate when enabled (form mode). In grid mode the retained
    // `id` criterion (added above) hard-filters to the single record instead.
    const idParams =
      hasIdFilter && enableDirectNavigation ? { targetRecordId: idColumnFilter?.value, directNavigation: true } : {};

    const finalParams: any = {
      ...stableParams,
      ...idParams,
      ...(allCriteria.length > 0 ? { criteria: allCriteria.length === 1 ? allCriteria[0] : allCriteria } : {}),
      isImplicitFilterApplied: isImplicitFilterApplied,
      noActiveFilter: true,
    };

    return finalParams;
    // activeColumnFilters is intentionally omitted: it's already captured by
    // columnFilterCriteria and idColumnFilter, both listed above and changing
    // whenever filters do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stableParams,
    searchQuery,
    columns,
    columnFilterCriteria,
    idColumnFilter,
    hasIdColumn,
    isImplicitFilterApplied,
    enableDirectNavigation,
  ]);

  const fetchData = useCallback(
    async (targetPage: number = page) => {
      // Prevent duplicate fetches. If another fetch is already running, remember
      // this request so it runs once the in-flight fetch settles (see finally) —
      // otherwise a query change arriving mid-flight is dropped and never retried.
      if (fetchInProgressRef.current) {
        pendingFetchRef.current = targetPage;
        return;
      }

      fetchInProgressRef.current = true;
      const safePageSize = pageSize ?? 1000;

      try {
        const { ok, data } = (await loadData(
          entity,
          targetPage,
          safePageSize,
          queryParams,
          memoizedTreeOptions,
          isFiltering
        )) as {
          ok: boolean;
          data: { response: { data: EntityData[] } };
        };

        if (!(ok && data.response.data)) {
          throw data;
        }
        setHasMoreRecords(data.response.data.length >= safePageSize);
        setRecords((prev) => {
          const fetched = data.response.data;
          if (targetPage !== 1 && !searchQuery) {
            return prev.concat(fetched);
          }
          // Page-1 replace (default and search refetches). Preserve `_locallyAdded`
          // rows so user-created rows in Pick & Execute input grids (e.g. GL Items
          // in Add Payment) survive datasource refetches triggered by unrelated
          // param changes (form values folded into datasourceOptions).
          const locallyAdded = prev.filter((r) => r._locallyAdded);
          if (locallyAdded.length === 0) return fetched;
          const fetchedIds = new Set(fetched.map((r) => String(r.id)));
          const survivors = locallyAdded.filter((r) => !fetchedIds.has(String(r.id)));
          return survivors.length === 0 ? fetched : [...survivors, ...fetched];
        });
        setLoaded(true);
        setHasFirstFetchCompleted(true);
        dataLoadedRef.current = true;
      } catch (e) {
        logger.warn(e);

        if (!isImplicitFilterApplied) {
          setError(e as Error);
        } else {
          setIsImplicitFilterApplied?.(false);
        }
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
        // If a fetch was requested while this one was in flight, run it now with
        // the latest closure (current queryParams), so the most recent query wins.
        if (pendingFetchRef.current !== null) {
          const nextPage = pendingFetchRef.current;
          pendingFetchRef.current = null;
          fetchDataRef.current?.(nextPage);
        }
      }
    },
    [
      entity,
      page,
      pageSize,
      queryParams,
      memoizedTreeOptions,
      isImplicitFilterApplied,
      searchQuery,
      setIsImplicitFilterApplied,
    ]
  );

  // Keep a stable pointer to the latest fetchData so the retry in fetchData's
  // finally block runs against the current queryParams, not a stale closure.
  fetchDataRef.current = fetchData;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (skip) {
      setRecords([]);
      setPage(1);
      setHasMoreRecords(true);
      setLoaded(true);
      return;
    }

    // When a filter/entity change causes page to reset to 1 inside this effect,
    // React will re-run the effect with the new page value. Skip that extra run
    // to avoid a redundant network request.
    if (skipPageResetFetchRef.current) {
      skipPageResetFetchRef.current = false;
      return;
    }

    // Compute a key that represents "what data" we want, independent of page.
    // activeColumnFilters and searchQuery are already baked into queryParams so
    // they don't need to be listed separately in the dependency array.
    const queryKey = `${entity}|${pageSize}|${JSON.stringify(queryParams)}|${JSON.stringify(memoizedTreeOptions)}|${String(isImplicitFilterApplied)}`;
    const queryChanged = queryKey !== prevQueryKeyRef.current;
    prevQueryKeyRef.current = queryKey;

    setError(undefined);

    if (queryChanged && page !== 1) {
      // Query (filters/search/entity) changed while on a page > 1.
      // Fetch page 1 directly instead of first fetching the wrong page and then
      // resetting — this replaces the old two-request pattern with one correct request.
      setLoading(true);
      skipPageResetFetchRef.current = true;
      setPage(1);
      setHasMoreRecords(true);
      fetchData(1);
    } else if (queryChanged || page > 1 || !dataLoadedRef.current) {
      // Fetch when: query changed on page 1, loading more pages, or initial load.
      // Skip when: initialization effects re-run this effect with the same query on
      // page 1 and data is already loaded — avoids redundant loading-state flashes.
      setLoading(true);
      fetchData();
    }
  }, [entity, page, pageSize, queryParams, skip, memoizedTreeOptions, isImplicitFilterApplied]);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent === true;

      // Always bypass the response cache on an explicit refetch (e.g. after a
      // process completes) so the updated record state is always fetched fresh.
      datasource.clearCacheForEntity(entity);

      if (!isSilent) {
        reinit();
        setLoading(true);
      } else {
        setPage(1);
        setHasMoreRecords(true);
        // Notice we don't setLoading(true) for silent refetches
      }

      setError(undefined);

      await fetchData(1);
    },
    [reinit, fetchData, entity]
  );

  return {
    loading,
    error,
    fetchMore,
    changePageSize,
    records,
    loaded,
    hasFirstFetchCompleted,
    activeColumnFilters,
    removeRecordLocally,
    updateRecordLocally,
    addRecordLocally,
    refetch,
    hasMoreRecords,
  };
}
