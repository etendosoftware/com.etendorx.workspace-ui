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

import { useState, useCallback } from "react";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { ColumnFilterUtils, type FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";

interface UseTableDirOptionsParams {
  tabId?: string;
  entityName?: string;
}

/**
 * Hook for loading TABLEDIR options for inline editing
 * Based on the same logic used in column filters
 */
export const useTableDirOptions = ({ tabId, entityName }: UseTableDirOptionsParams = {}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [optionsCache, setOptionsCache] = useState<Record<string, FilterOption[]>>({});

  const { fetchFilterOptions } = useColumnFilterData();

  const loadOptions = useCallback(
    async (column: Column, searchQuery?: string, pageSize = 50): Promise<FilterOption[]> => {
      const columnKey = column.id || column.columnName || column.name;
      const cacheKey = `${columnKey}-${searchQuery || ""}-${pageSize}`;

      // Return cached options if available and no search query
      if (optionsCache[cacheKey] && !searchQuery) {
        return optionsCache[cacheKey];
      }

      // Set loading state
      setLoadingStates((prev) => ({ ...prev, [columnKey]: true }));

      try {
        let options: FilterOption[] = [];

        // Use the same logic as loadTableDirFilterOptions
        // First, check if we should use the selector/datasource approach (for fields that reference other entities)
        // Extract from selector object if available, or check column properties
        const selectorDefinitionId =
          (column.selector?.id as string | undefined) || (column.selectorDefinitionId as string | undefined);
        const datasourceId =
          (column.column?.datasourceId as string | undefined) ||
          (column.datasourceId as string | undefined) ||
          column.referencedEntity;

        logger.debug("[useTableDirOptions] Loading options", {
          columnKey,
          selectorDefinitionId,
          datasourceId,
          referencedEntity: column.referencedEntity,
          hasSelector: !!column.selector,
          hasColumn: !!column.column,
          columnKeys: Object.keys(column),
        });

        if (datasourceId) {
          // Use selector/datasource approach for fields that reference other entities (e.g., businessPartner, product)
          options = await fetchFilterOptions(
            String(datasourceId),
            selectorDefinitionId,
            searchQuery,
            pageSize,
            undefined,
            undefined,
            0
          );
        } else if (entityName && tabId && column.columnName) {
          // Fallback to distinct values approach for fields without a referenced entity
          // This queries the main datasource for unique values of this field
          options = await fetchFilterOptions(
            String(entityName),
            undefined,
            searchQuery,
            pageSize,
            column.columnName,
            tabId,
            0
          );
        }

        // Cache the options if no search query (to avoid caching filtered results)
        if (!searchQuery) {
          setOptionsCache((prev) => ({ ...prev, [cacheKey]: options }));
        }

        logger.debug(`[useTableDirOptions] Loaded ${options.length} options for ${columnKey}`, {
          column: columnKey,
          searchQuery,
          optionsCount: options.length,
          usedDatasource: !!datasourceId,
          datasourceId: datasourceId || entityName,
        });

        return options;
      } catch (error) {
        logger.error(`[useTableDirOptions] Failed to load options for ${columnKey}:`, error);
        return [];
      } finally {
        setLoadingStates((prev) => ({ ...prev, [columnKey]: false }));
      }
    },
    [fetchFilterOptions, optionsCache, tabId, entityName]
  );

  const isLoading = useCallback(
    (columnKey: string) => {
      return loadingStates[columnKey] || false;
    },
    [loadingStates]
  );

  const clearCache = useCallback((columnKey?: string) => {
    if (columnKey) {
      setOptionsCache((prev) => {
        const newCache = { ...prev };
        for (const key of Object.keys(newCache)) {
          if (key.startsWith(columnKey)) {
            delete newCache[key];
          }
        }
        return newCache;
      });
    } else {
      setOptionsCache({});
    }
  }, []);

  // Helper to check if a column needs options loading
  const needsOptionsLoading = useCallback((column: Column) => {
    return ColumnFilterUtils.isTableDirColumn(column) && (!column.refList || column.refList.length === 0);
  }, []);

  return {
    loadOptions,
    isLoading,
    clearCache,
    needsOptionsLoading,
  };
};
