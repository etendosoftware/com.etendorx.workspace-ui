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
import type { Field, RefListField } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";
import { datasource } from "@workspaceui/api-client/src/api/datasource";

import type { Tab } from "@workspaceui/api-client/src/api/types";

interface UseInlineTableDirOptionsParams {
  tabId?: string;
  windowId?: string;
  tab?: Tab;
}


/**
 * Hook for loading TABLEDIR options for inline editing
 * Based on the same logic used in FormView's useTableDirDatasource
 */

import { transformValueToClassicFormat } from "@/utils/datasourceUtils";

/**
 * Hook for loading TABLEDIR options for inline editing
 * Based on the same logic used in FormView's useTableDirDatasource
 */

export const useInlineTableDirOptions = ({ tabId, windowId, tab }: UseInlineTableDirOptionsParams = {}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [optionsCache, setOptionsCache] = useState<Record<string, RefListField[]>>({});

  /**
   * Get datasource name from field configuration
   */
  const getDatasourceName = useCallback((field: Field): string | undefined => {
    const selectorDatasource = (field.selector as any)?.datasourceName;
    const useSpecialDatasource = selectorDatasource && selectorDatasource !== field.referencedEntity;
    return useSpecialDatasource ? selectorDatasource : field.referencedEntity;
  }, []);

  /**
   * Build request body with selector parameters
   */
  const buildRequestBody = useCallback(
    (
      field: Field,
      pageSize: number,
      searchQuery?: string,
      contextData?: Record<string, unknown>,
      useSpecialDatasource?: boolean,
      datasourceName?: string
    ): Record<string, string> => {
      const baseBody: Record<string, string> = {
        _startRow: "0",
        _endRow: String(pageSize),
        _operationType: "fetch",
        _noCount: "true",
        _textMatchStyle: "substring",
        _sortBy: "_identifier",
        _constructor: "AdvancedCriteria",
      };

      const selector = field.selector as any;
      const isComboTableDatasource = datasourceName === "ComboTableDatasourceService";

      // For ComboTableDatasourceService, ALWAYS include these critical parameters
      if (isComboTableDatasource && selector) {
        if (selector.fieldId) {
          baseBody.fieldId = String(selector.fieldId);
        }
        if (selector.datasourceName) {
          baseBody.datasourceName = String(selector.datasourceName);
        }
        // moduleId is required for ComboTableDatasourceService, default to "0" if not provided
        baseBody.moduleId = selector.moduleId !== null && selector.moduleId !== undefined 
          ? String(selector.moduleId) 
          : "0";
      }

      // Add selector-specific parameters ONLY when using a special datasource
      if (selector && useSpecialDatasource) {
        const safeParams = [
          "_selectorDefinitionId",
          "filterClass",
          "fieldId",
          "datasourceName",
          "displayField",
          "valueField",
          "moduleId",
          "_selectedProperties",
          "_extraProperties",
          "extraSearchFields",
        ];

        for (const param of safeParams) {
          if (selector[param] !== null && selector[param] !== undefined) {
            baseBody[param] = String(selector[param]);
          }
        }
      }

      // Add tab and window context if available
      if (tabId) {
        baseBody.tabId = tabId;
        baseBody.inpTabId = tabId;
      }
      if (windowId) {
        baseBody.windowId = windowId;
        baseBody.inpwindowId = windowId;
      }

      // Add organization context for filtering
      if (contextData?.organization) {
        baseBody._org = String(contextData.organization);
        baseBody.inpadOrgId = String(contextData.organization);
      }

      // Include ALL row context data as form fields (similar to Classic UI)
      // This is critical for selector datasources to apply proper filters
      if (contextData && tab?.fields) {
        for (const [key, value] of Object.entries(contextData)) {
          // Skip internal fields and already processed fields
          if (key.startsWith("_") || key === "organization" || key === "id") {
            continue;
          }

          // Find the field definition to get the inputName
          const fieldDef = tab.fields[key];
          const inputName = fieldDef?.inputName || key;

          // Transform value to Classic backend format (dates, booleans, etc.)
          const transformedValue = transformValueToClassicFormat(value);
          baseBody[inputName] = transformedValue;
        }
      } else if (contextData) {
        // Fallback: if no tab info, just use the keys as-is
        for (const [key, value] of Object.entries(contextData)) {
          if (key.startsWith("_") || key === "organization" || key === "id") {
            continue;
          }
          const transformedValue = transformValueToClassicFormat(value);
          baseBody[key] = transformedValue;
        }
      }

      // Apply search criteria if provided
      if (searchQuery) {
        baseBody._identifier = searchQuery;
        baseBody.name = searchQuery;
      }

      return baseBody;
    },
    [tabId, windowId, tab?.fields]
  );

  /**
   * Extract value from nested field path (e.g., "product$id")
   */
  const extractNestedValue = useCallback((record: Record<string, unknown>, fieldPath: string): any => {
    const fieldParts = fieldPath.split("$");
    let value: any = record;
    for (const part of fieldParts) {
      value = value?.[part];
    }
    return value || record.id;
  }, []);

  /**
   * Transform datasource records to RefListField format
   */
  const transformRecordsToOptions = useCallback(
    (records: Record<string, unknown>[], field: Field): RefListField[] => {
      const valueField = (field.selector as any)?.valueField;
      const displayField = (field.selector as any)?.displayField;

      return records.map((record: Record<string, unknown>) => {
        const displayValue = displayField ? record[displayField] : record._identifier || record.name || record.id;

        const idValue = valueField ? extractNestedValue(record, valueField) : record.id;

        return {
          id: String(idValue),
          value: String(idValue),
          label: String(displayValue),
          ...record,
        };
      });
    },
    [extractNestedValue]
  );

  const loadOptions = useCallback(
    async (
      field: Field,
      searchQuery?: string,
      contextData?: Record<string, unknown>,
      pageSize = 75
    ): Promise<RefListField[]> => {
      const fieldKey = field.name || field.hqlName;
      const orgId = contextData?.organization || "no-org";
      const cacheKey = `${fieldKey}-${orgId}-${searchQuery || ""}-${pageSize}`;

      // Return cached options if available and no search query
      if (optionsCache[cacheKey] && !searchQuery) {
        return optionsCache[cacheKey];
      }

      // Set loading state
      setLoadingStates((prev) => ({ ...prev, [fieldKey]: true }));

      try {
        const datasourceName = getDatasourceName(field);

        if (!datasourceName) {
          logger.warn(`[useInlineTableDirOptions] No datasource or referencedEntity found for field ${fieldKey}`);
          return [];
        }

        const selectorDatasource = (field.selector as any)?.datasourceName;
        const useSpecialDatasource = selectorDatasource && selectorDatasource !== field.referencedEntity;

        const baseBody = buildRequestBody(field, pageSize, searchQuery, contextData, useSpecialDatasource, datasourceName);

        const body = new URLSearchParams(baseBody);
        const { data } = await datasource.client.request(`/api/datasource/${datasourceName}`, {
          method: "POST",
          body,
        });

        // Check for errors in the response
        if (data?.response?.error) {
          logger.error(`[useInlineTableDirOptions] Server returned error for ${fieldKey}:`, data.response.error);
        }

        const records = data?.response?.data || [];
        const options = transformRecordsToOptions(records, field);

        // Cache the options if no search query
        if (!searchQuery) {
          setOptionsCache((prev) => ({ ...prev, [cacheKey]: options }));
        }
        return options;
      } catch (error) {
        logger.error(`[useInlineTableDirOptions] Failed to load options for ${fieldKey}:`, error);
        return [];
      } finally {
        setLoadingStates((prev) => ({ ...prev, [fieldKey]: false }));
      }
    },
    [optionsCache, getDatasourceName, buildRequestBody, transformRecordsToOptions]
  );

  const isLoading = useCallback(
    (fieldName: string) => {
      return loadingStates[fieldName] || false;
    },
    [loadingStates]
  );

  const clearCache = useCallback((fieldKey?: string) => {
    if (fieldKey) {
      setOptionsCache((prev) => {
        const newCache = { ...prev };
        for (const key of Object.keys(newCache)) {
          if (key.startsWith(fieldKey)) {
            delete newCache[key];
          }
        }
        return newCache;
      });
    } else {
      setOptionsCache({});
    }
  }, []);

  return {
    loadOptions,
    isLoading,
    clearCache,
  };
};
