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
import type { TabDataCache } from "@/utils/window/constants";

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
  }
) => {
  const safePageSize = pageSize ?? 1000;
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const processedParams = {
    ...params,
    startRow,
    endRow,
    pageSize: safePageSize,
  };

  if (treeOptions?.isTreeMode) {
    processedParams.parentId = treeOptions.parentId ?? -1;
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
  cachedData?: TabDataCache;
  onCacheUpdate?: (cache: TabDataCache) => void;
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
  cachedData,
  onCacheUpdate,
}: UseDatasourceOptions) {
  const [loading, setLoading] = useState(!skip);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<EntityData[]>(cachedData?.records ?? []);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(cachedData?.page ?? 1);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);
  const [hasMoreRecords, setHasMoreRecords] = useState(cachedData?.hasMoreRecords ?? true);
  const fetchInProgressRef = useRef(false);
  const initialCacheKeyRef = useRef(cachedData?.cacheKey);
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

  const reinit = useCallback(() => {
    setRecords([]);
    setPage(1);
    setHasMoreRecords(true);
  }, []);

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

  // Stabilize params to prevent unnecessary fetches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [JSON.stringify(params)]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryParams = useMemo(() => {
    const baseCriteria = stableParams.criteria || ([] as any[]);
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

    const filterById = columnFilterCriteria.find((criteria) => criteria.fieldName === "id");
    const hasIdFilter = Boolean(filterById);
    const idParams = hasIdFilter ? { targetRecordId: filterById?.value, directNavigation: true } : {};

    const finalParams = {
      ...stableParams,
      ...idParams,
      criteria: allCriteria,
      isImplicitFilterApplied,
      noActiveFilter: true,
    };

    return finalParams;
  }, [stableParams, searchQuery, columns, columnFilterCriteria, isImplicitFilterApplied, activeColumnFilters]);

  // Generate cache key for invalidation checks
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      entity,
      queryParams,
      isImplicitFilterApplied,
    });
  }, [entity, queryParams, isImplicitFilterApplied]);

  // Check if cache is valid
  const isCacheValid = useMemo(() => {
    if (!cachedData || !cachedData.records.length) return false;
    const valid = cachedData.cacheKey === cacheKey;
    console.log(`[useDatasource] Cache validation for ${entity}: ${valid}`, {
      cachedKey: cachedData.cacheKey,
      currentKey: cacheKey,
    });
    return valid;
  }, [cachedData, cacheKey, entity]);

  const fetchData = useCallback(
    async (targetPage: number = page) => {
      // Prevent duplicate fetches
      if (fetchInProgressRef.current) {
        return;
      }

      fetchInProgressRef.current = true;
      const safePageSize = pageSize ?? 1000;

      try {
        const { ok, data } = (await loadData(entity, targetPage, safePageSize, queryParams, memoizedTreeOptions)) as {
          ok: boolean;
          data: { response: { data: EntityData[] } };
        };

        if (!(ok && data.response.data)) {
          throw data;
        }
        const newHasMoreRecords = data.response.data.length >= safePageSize;
        setHasMoreRecords(newHasMoreRecords);
        const newRecords = targetPage === 1 || searchQuery ? data.response.data : records.concat(data.response.data);
        setRecords(newRecords);

        // Update cache after successful fetch
        if (onCacheUpdate) {
          onCacheUpdate({
            records: newRecords,
            cacheKey,
            timestamp: Date.now(),
            hasMoreRecords: newHasMoreRecords,
            page: targetPage,
          });
        }
        setLoaded(true);
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
      cacheKey,
      onCacheUpdate,
    ]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (skip) {
      setRecords([]);
      setPage(1);
      setHasMoreRecords(true);
      setLoaded(true);
      return;
    }

    console.log(`[useDatasource] Effect triggered for ${entity}`, {
      isCacheValid,
      initialCacheKey: initialCacheKeyRef.current,
      currentCacheKey: cacheKey,
      skip,
    });

    // Skip fetch if cache is valid and this is the initial load
    if (isCacheValid && initialCacheKeyRef.current === cacheKey) {
      console.log(`[useDatasource] Skipping fetch for ${entity} (cache valid and initial load)`);
      setLoaded(true);
      setLoading(false);
      return;
    }

    // Clear initial cache key ref after first check
    initialCacheKeyRef.current = undefined;

    setError(undefined);
    setLoading(true);

    console.log(`[useDatasource] Calling fetchData for ${entity}`);
    fetchData();
  }, [
    entity,
    page,
    pageSize,
    queryParams,
    skip,
    memoizedTreeOptions,
    isImplicitFilterApplied,
    activeColumnFilters,
    isCacheValid,
    cacheKey,
  ]);

  // Track previous values to detect actual changes (not initial mount)
  const prevFiltersRef = useRef(activeColumnFilters);
  const prevSearchRef = useRef(searchQuery);

  useEffect(() => {
    // Track previous values to detect actual changes (not initial mount)
    const prevFiltersStr = JSON.stringify(prevFiltersRef.current);
    const currentFiltersStr = JSON.stringify(activeColumnFilters);
    const filtersChanged = prevFiltersStr !== currentFiltersStr;
    const searchChanged = prevSearchRef.current !== searchQuery;

    // Update refs
    prevFiltersRef.current = activeColumnFilters;
    prevSearchRef.current = searchQuery;

    // Only reinit if something actually changed (not on initial mount)
    if (filtersChanged || searchChanged) {
      console.log(`[useDatasource] Reinit triggered for ${entity}`, {
        filtersChanged,
        searchChanged,
      });
      reinit();
    }
  }, [activeColumnFilters, searchQuery, reinit]);

  const refetch = useCallback(async () => {
    reinit();
    setError(undefined);
    setLoading(true);

    await fetchData(1);
  }, [reinit, fetchData]);

  return {
    loading,
    error,
    fetchMore,
    changePageSize,
    records,
    loaded,
    activeColumnFilters,
    removeRecordLocally,
    updateRecordLocally,
    addRecordLocally,
    refetch,
    hasMoreRecords,
  };
}
