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

type FetchFilterOptionsFunction = (
  datasource: string,
  selectorDefinitionId?: string,
  searchQuery?: string,
  pageSize?: number,
  distinctField?: string,
  tabId?: string,
  offset?: number
) => Promise<FilterOption[]>;

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
}: LoadTableDirFilterOptionsParams): Promise<FilterOption[]> => {
  try {
    let options: FilterOption[] = [];

    if (ColumnFilterUtils.needsDistinctValues(column)) {
      const currentDatasource = entityName;
      const tabIdStr = tabId;
      const distinctField = column.columnName;

      options = await fetchFilterOptions(
        String(currentDatasource),
        undefined,
        searchQuery,
        pageSize,
        distinctField,
        tabIdStr,
        offset
      );
    } else {
      const selectorDefinitionId = column.selectorDefinitionId as string | undefined;
      const datasourceId = column.datasourceId || column.referencedEntity;

      if (datasourceId) {
        options = await fetchFilterOptions(
          String(datasourceId),
          selectorDefinitionId,
          searchQuery,
          pageSize,
          undefined,
          undefined,
          offset
        );
      }
    }

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
