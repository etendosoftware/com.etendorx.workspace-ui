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
import type { FilterOption } from "../utils/column-filter-utils";

/**
 * Hook for fetching column filter data optimized for simple filter queries.
 */
export const useColumnFilterData = () => {
  const fetchFilterOptions = useCallback(
    async (
      datasourceId: string,
      selectorDefinitionId?: string,
      searchQuery?: string,
      limit = 20,
      distinctField?: string,
      tabId?: string,
      offset = 0
    ): Promise<FilterOption[]> => {
      try {
        const params: Record<string, unknown> = {
          startRow: offset,
          endRow: offset + limit - 1,
          textMatchStyle: "substring",
          operationType: "fetch",
          dataSource: datasourceId,
        };

        if (distinctField && tabId) {
          params.distinct = distinctField;
          params.tabId = tabId;
          params.operator = "and";
          params._constructor = "AdvancedCriteria";

          if (searchQuery?.trim()) {
            params.criteria = JSON.stringify({
              fieldName: `${distinctField}$_identifier`,
              operator: "iContains",
              value: searchQuery.trim(),
              _constructor: "AdvancedCriteria",
            });
          } else {
            params.criteria = JSON.stringify({
              fieldName: "_dummy",
              operator: "equals",
              value: Date.now(),
              _constructor: "AdvancedCriteria",
            });
          }
        } else {
          if (selectorDefinitionId) {
            params.selectorDefinitionId = selectorDefinitionId;
            params.filterClass = "org.openbravo.userinterface.selector.SelectorDataSourceFilter";
          }

          if (searchQuery?.trim()) {
            params.criteria = JSON.stringify({
              fieldName: "_identifier",
              operator: "iContains",
              value: searchQuery.trim(),
              _constructor: "AdvancedCriteria",
            });

            params.operator = "and";
            params._constructor = "AdvancedCriteria";
          }
        }

        const response = (await datasource.get(datasourceId, params)) as any;

        if (response.ok && response.data?.response?.data) {
          const options = response.data.response.data.map((item: Record<string, unknown>) => {
            if (distinctField) {
              const fieldValue = item[distinctField];
              const identifierKey = `${distinctField}$_identifier`;
              const identifier = String(item[identifierKey] || fieldValue || item._identifier || item.id);

              return {
                id: String(fieldValue || item.id),
                label: identifier,
                value: String(fieldValue || identifier),
              };
            }

            const identifier = String(
              item._identifier ||
                item.name ||
                item[Object.keys(item).find((key) => key.endsWith("$_identifier")) || "id"] ||
                item.id
            );

            return {
              id: String(item.id),
              label: identifier,
              value: identifier,
            };
          });

          return options;
        }

        return [];
      } catch (error) {
        console.error("Error fetching filter options:", error);
        return [];
      }
    },
    []
  );

  return { fetchFilterOptions };
};
