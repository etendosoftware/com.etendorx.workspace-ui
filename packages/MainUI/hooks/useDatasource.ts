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
  MRT_SortingState,
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
  isFiltering = false
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

    // Ensure criteria is an array and append parentId criteria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentCriteria = (params.criteria as any[]) || [];
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

export type UseDatasourceTreeOptions = {
  isTreeMode: boolean;
  windowId?: string;
  tabId?: string;
  referencedTableId?: string;
  parentId?: string | number;
};

export type UseDatasourceOptions = {
  entity: string;
  params?: DatasourceOptions;
  searchQuery?: string;
  columns?: Column[];
  skip?: boolean;
  treeOptions?: UseDatasourceTreeOptions;
  activeColumnFilters?: MRT_ColumnFiltersState;
  activeSorting?: MRT_SortingState;
  isImplicitFilterApplied?: boolean;
  setIsImplicitFilterApplied?: (value: boolean) => void;
  isFiltering?: boolean;
};

export function useDatasource({
  entity,
  params = defaultParams,
  searchQuery,
  columns,
  skip,
  treeOptions,
  activeColumnFilters = EMPTY_FILTERS,
  activeSorting,
  isImplicitFilterApplied = false,
  setIsImplicitFilterApplied,
  isFiltering: isFilteringProp,
}: UseDatasourceOptions) {
  // Detect if user is filtering (search or column filters)
  const isFiltering = useMemo(() => {
    return (
      isFilteringProp ||
      (!!searchQuery && searchQuery.trim().length > 0) ||
      (activeColumnFilters && activeColumnFilters.length > 0)
    );
  }, [isFilteringProp, searchQuery, activeColumnFilters]);

  const [loading, setLoading] = useState(!skip);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<EntityData[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const fetchInProgressRef = useRef(false);
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

    const filterById = columnFilterCriteria.find((criteria) => criteria.fieldName === "id");
    const hasIdFilter = Boolean(filterById);
    const idParams = hasIdFilter ? { targetRecordId: filterById?.value, directNavigation: true } : {};

    const getMergedCriteria = () => {
      if (allCriteria.length === 0) {
        return stableParams.criteria;
      }

      // Extract existing criteria as an array
      let existingCriteria: any[] = [];
      if (stableParams.criteria) {
        existingCriteria = Array.isArray(stableParams.criteria) ? stableParams.criteria : [stableParams.criteria];
      }

      const merged = [...existingCriteria, ...allCriteria];
      return merged.length === 1 ? merged[0] : merged;
    };

    const finalParams: any = {
      ...stableParams,
      ...idParams,
      isImplicitFilterApplied,
      noActiveFilter: true,
      criteria: getMergedCriteria(),
    };

    if (activeSorting && activeSorting.length > 0) {
      const sort = activeSorting[0];
      finalParams.sortBy = sort.desc ? `-${sort.id}` : sort.id;
      finalParams.isSorting = true;
    }

    return finalParams;
  }, [
    stableParams,
    searchQuery,
    columns,
    columnFilterCriteria,
    isImplicitFilterApplied,
    activeColumnFilters,
    activeSorting,
  ]);

  const fetchData = useCallback(
    async (targetPage: number = page) => {
      // Prevent duplicate fetches
      if (fetchInProgressRef.current) {
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
        setRecords((prev) => (targetPage === 1 ? data.response.data : prev.concat(data.response.data)));
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

    setError(undefined);
    setLoading(true);

    fetchData();
  }, [entity, page, pageSize, queryParams, skip, memoizedTreeOptions, isImplicitFilterApplied, activeColumnFilters]);

  useEffect(() => {
    // Reset pagination but keep existing records visible until new data arrives,
    // avoiding the blank-grid flash that reinit() would cause.
    setPage(1);
    setHasMoreRecords(true);
  }, [activeColumnFilters, searchQuery, activeSorting]);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent === true;

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
    [reinit, fetchData]
  );

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
    setHasMoreRecords,
    setPage,
  };
}
