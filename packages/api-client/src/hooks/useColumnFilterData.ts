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

import { useCallback } from "react";
import { datasource } from "../api/datasource";
import type { Column } from "../api/types";
import type { FilterOption } from "../utils/column-filter-utils";

/**
 * Hook for fetching column filter data using the same pattern as useDatasource
 * but optimized for simple filter queries
 */
export const useColumnFilterData = () => {
  const fetchFilterOptions = useCallback(async (
    datasourceId: string,
    selectorDefinitionId?: string,
    searchQuery?: string,
    limit = 20
  ): Promise<FilterOption[]> => {
    try {
      // Construct params without _ prefix since datasource.get() will add them automatically
      const params: Record<string, unknown> = {
        startRow: 0,
        endRow: limit,
        textMatchStyle: "substring",
        requestId: 1,
        dataSource: datasourceId,
      };

      // Add selector definition ID if available
      if (selectorDefinitionId) {
        params.selectorDefinitionId = selectorDefinitionId;
        params.filterClass = "org.openbravo.userinterface.selector.SelectorDataSourceFilter";
      }

      // Add search criteria if provided
      if (searchQuery?.trim()) {
        params.currentValue = searchQuery.trim();
      }

      console.log(`Fetching filter options for ${datasourceId}:`, {
        datasourceId,
        selectorDefinitionId,
        params
      });

      // Use the same datasource.get method that useDatasource uses
      const response = await datasource.get(datasourceId, params);
      
      console.log(`Response for ${datasourceId}:`, response);

      if (response.ok && response.data?.response?.data) {
        const options = response.data.response.data.map((item: Record<string, unknown>) => ({
          id: String(item.id),
          label: String(
            item._identifier ||
            item.name ||
            item[Object.keys(item).find(key => key.endsWith('$_identifier')) || 'id'] ||
            item.id
          ),
          value: String(item.id),
        }));
        
        console.log(`Mapped filter options for ${datasourceId}:`, options);
        return options;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching filter options for ${datasourceId}:`, error);
      return [];
    }
  }, []);

  return { fetchFilterOptions };
};