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
import { ColumnFilterUtils, SearchUtils } from "@workspaceui/api-client/src/utils/search-utils";
import { useCallback, useEffect, useMemo, useState } from "react";

const loadData = async (entity: string, page: number, pageSize: number, params: DatasourceOptions) => {
  const safePageSize = pageSize ?? 1000;
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const processedParams = {
    ...params,
    startRow,
    endRow,
    pageSize: safePageSize,
  };

  return datasource.get(entity, processedParams);
};

const defaultParams: DatasourceOptions = {
  pageSize: 1000,
};

export type UseDatasourceOptions = {
  entity: string;
  params?: DatasourceOptions;
  searchQuery?: string;
  columns?: Column[];
  skip?: boolean;
};

export function useDatasource({ entity, params = defaultParams, columns, searchQuery, skip }: UseDatasourceOptions) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<EntityData[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isImplicitFilterApplied, setIsImplicitFilterApplied] = useState(params.isImplicitFilterApplied ?? false);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);
  const [activeColumnFilters, setActiveColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);

  const removeRecordLocally = useCallback((recordId: string) => {
    setRecords((prevRecords) => prevRecords.filter((record) => String(record.id) !== recordId));
  }, []);

  const fetchMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const updateColumnFilters = useCallback((filters: MRT_ColumnFiltersState) => {
    setActiveColumnFilters(filters);
    setPage(1);
    setRecords([]);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const toggleImplicitFilters = useCallback(() => {
    setIsImplicitFilterApplied((prev) => !prev);
    setPage(1);
  }, []);

  const reinit = useCallback(() => {
    setRecords([]);
    setPage(1);
    setHasMoreRecords(true);
  }, []);

  const columnFilterCriteria = useMemo(() => {
    if (!columns || !activeColumnFilters.length) return [];

    return ColumnFilterUtils.createColumnFilterCriteria(activeColumnFilters, columns);
  }, [activeColumnFilters, columns]);

  const queryParams = useMemo(() => {
    const baseCriteria = params.criteria || [];
    const searchCriteriaArray = searchQuery && columns ? SearchUtils.createSearchCriteria(columns, searchQuery) : [];

    let allCriteria = [...baseCriteria];

    if (searchCriteriaArray.length > 0) {
      allCriteria = [...allCriteria, ...searchCriteriaArray];
    }

    if (columnFilterCriteria.length > 0) {
      allCriteria = [...allCriteria, ...columnFilterCriteria];
    }

    return {
      ...params,
      criteria: allCriteria,
      isImplicitFilterApplied,
    };
  }, [params, searchQuery, columns, columnFilterCriteria, isImplicitFilterApplied]);

  const load = useCallback(() => {
    if (!entity || skip) {
      reinit();
      setLoaded(true);
      return;
    }

    setError(undefined);
    setLoading(true);

    const safePageSize = pageSize ?? 1000;

    const f = async () => {
      try {
        const { ok, data } = await loadData(entity, page, safePageSize, queryParams);

        if (!(ok && data.response.data)) {
          throw data;
        }
        setHasMoreRecords(data.response.data.length >= safePageSize);
        setRecords((prev) => (page === 1 || searchQuery ? data.response.data : prev.concat(data.response.data)));
        setLoaded(true);
      } catch (e) {
        logger.warn(e);

        if (!isImplicitFilterApplied) {
          setError(e as Error);
        } else {
          setIsImplicitFilterApplied(false);
        }
      } finally {
        setLoading(false);
      }
    };

    f();
  }, [entity, isImplicitFilterApplied, page, pageSize, queryParams, reinit, searchQuery, skip]);

  useEffect(() => {
    reinit();
    setLoaded(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    reinit();
    setLoaded(false);
    load();
  }, [load]);

  return {
    loading,
    error,
    fetchMore,
    changePageSize,
    load,
    records,
    loaded,
    isImplicitFilterApplied,
    toggleImplicitFilters,
    updateColumnFilters,
    activeColumnFilters,
    removeRecordLocally,
    refetch,
    hasMoreRecords,
  };
}
