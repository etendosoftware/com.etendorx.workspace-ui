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

import type { Column } from "@workspaceui/api-client/src/api/types";
import { ColumnFilterUtils, type FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import type { FetchFilterOptionsParams } from "@workspaceui/api-client/src/hooks/useColumnFilterData";

type FetchFilterOptionsFunction = (params: FetchFilterOptionsParams) => Promise<FilterOption[]>;

interface LoadTableDirFilterOptionsParams {
  column: Column;
  columnId: string;
  searchQuery?: string;
  tabId?: string;
  entityName?: string;
  fetchFilterOptions: FetchFilterOptionsFunction;
  setFilterOptions: (columnId: string, options: FilterOption[], hasMore: boolean, append: boolean) => void;
  offset?: number;
  pageSize?: number;
  isImplicitFilterApplied?: boolean;
  extraParams?: Record<string, unknown>;
}

/**
 * Loads filter options for SELECT columns
 */
export const loadSelectFilterOptions = (
  column: Column,
  columnId: string,
  searchQuery: string | undefined,
  setFilterOptions: (columnId: string, options: FilterOption[], hasMore: boolean, append: boolean) => void
): FilterOption[] => {
  const allOptions = ColumnFilterUtils.getSelectOptions(column);
  const filteredOptions = searchQuery
    ? allOptions.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : allOptions;

  setFilterOptions(columnId, filteredOptions, false, false);
  return filteredOptions;
};

interface FetchViaReferencedDatasourceParams {
  column: Column;
  datasourceId: unknown;
  searchQuery?: string;
  pageSize: number;
  offset: number;
  fetchFilterOptions: FetchFilterOptionsFunction;
  isImplicitFilterApplied?: boolean;
  extraParams?: Record<string, unknown>;
}

interface FetchViaDistinctParams {
  column: Column;
  entityName?: string;
  tabId?: string;
  searchQuery?: string;
  pageSize: number;
  offset: number;
  fetchFilterOptions: FetchFilterOptionsFunction;
  extraParams?: Record<string, unknown>;
}

/**
 * Fallback for TABLEDIR/Search columns when there is no grid entity to run a distinct
 * query against (e.g. no tabId/entityName in scope): fetches the full list of the
 * referenced entity's own records (e.g. all rows of "ETCRM_LeadStatus"). This returns
 * every possible lookup value, not just the ones present in the grid's records — it is
 * a "better than nothing" fallback, not Classic's behavior for the column filter dropdown.
 */
const fetchViaReferencedDatasource = ({
  column,
  datasourceId,
  searchQuery,
  pageSize,
  offset,
  fetchFilterOptions,
  isImplicitFilterApplied,
  extraParams,
}: FetchViaReferencedDatasourceParams): Promise<FilterOption[]> => {
  if (!datasourceId) return Promise.resolve([]);

  const selectorDefinitionId = column.selectorDefinitionId as string | undefined;

  return fetchFilterOptions({
    datasourceId: String(datasourceId),
    selectorDefinitionId,
    searchQuery,
    limit: pageSize,
    offset,
    isImplicitFilterApplied,
    extraParams,
  });
};

/**
 * Primary strategy for TABLEDIR/Search column filters, matching Etendo Classic: runs a
 * `_distinct` query on the grid's own entity, scoped to the tab's context, returning only
 * the values of this column that actually occur among the grid's records (e.g. only the
 * 2 "leadStatus" values present among Leads, not the full "ETCRM_LeadStatus" catalog).
 * Classic always applies the tab's implicit filter (org/security/active-record scoping)
 * for this kind of pick-list query, so `isImplicitFilterApplied` is fixed to `true` here
 * regardless of the grid's own (unrelated) implicit-filter toggle state.
 * Classic backend expects HQL property names (e.g. "businessPartner"), not DB column names.
 * filterFieldName is set from field._key (HQL property name) in WindowReferenceGrid rawColumns.
 */
const fetchViaDistinct = ({
  column,
  entityName,
  tabId,
  searchQuery,
  pageSize,
  offset,
  fetchFilterOptions,
  extraParams,
}: FetchViaDistinctParams): Promise<FilterOption[]> => {
  if (!entityName || !column.columnName) return Promise.resolve([]);

  const distinctField = (column as any).filterFieldName || column.columnName;

  return fetchFilterOptions({
    datasourceId: String(entityName),
    searchQuery,
    limit: pageSize,
    distinctField,
    tabId,
    offset,
    isImplicitFilterApplied: true,
    extraParams,
  });
};

/**
 * Loads filter options for TABLEDIR columns
 */
export const loadTableDirFilterOptions = async ({
  column,
  columnId,
  searchQuery,
  tabId,
  entityName,
  fetchFilterOptions,
  setFilterOptions,
  offset = 0,
  pageSize = 20,
  isImplicitFilterApplied,
  extraParams,
}: LoadTableDirFilterOptionsParams): Promise<FilterOption[]> => {
  try {
    const options = entityName
      ? await fetchViaDistinct({
          column,
          entityName,
          tabId,
          searchQuery,
          pageSize,
          offset,
          fetchFilterOptions,
          extraParams,
        })
      : await fetchViaReferencedDatasource({
          column,
          datasourceId: column.datasourceId || column.referencedEntity,
          searchQuery,
          pageSize,
          offset,
          fetchFilterOptions,
          isImplicitFilterApplied,
          extraParams,
        });

    const hasMore = options.length === pageSize;
    const append = offset > 0;
    setFilterOptions(columnId, options, hasMore, append);
    return options;
  } catch (error) {
    console.error("Error loading filter options:", error);
    setFilterOptions(columnId, [], false, offset > 0);
    return [];
  }
};
