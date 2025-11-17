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

interface UseInlineTableDirOptionsParams {
  tabId?: string;
  windowId?: string;
}

/**
 * Hook for loading TABLEDIR options for inline editing
 * Based on the same logic used in FormView's useTableDirDatasource
 */
export const useInlineTableDirOptions = ({ tabId, windowId }: UseInlineTableDirOptionsParams = {}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [optionsCache, setOptionsCache] = useState<Record<string, RefListField[]>>({});

  const loadOptions = useCallback(
    async (field: Field, searchQuery?: string, contextData?: Record<string, unknown>, pageSize = 75): Promise<RefListField[]> => {
      const fieldKey = field.name || field.hqlName;
      // Include organization in cache key so different orgs have different caches
      const orgId = contextData?.organization || 'no-org';
      const cacheKey = `${fieldKey}-${orgId}-${searchQuery || ""}-${pageSize}`;

      logger.debug(`[useInlineTableDirOptions] loadOptions called`, {
        fieldKey,
        fieldType: field.type,
        hasRefList: !!field.refList,
        refListLength: field.refList?.length || 0,
        referencedEntity: field.referencedEntity,
        searchQuery,
        hasContextData: !!contextData,
        orgId,
      });

      // Return cached options if available and no search query
      if (optionsCache[cacheKey] && !searchQuery) {
        logger.debug(`[useInlineTableDirOptions] Returning cached options for ${fieldKey}`, {
          count: optionsCache[cacheKey].length,
          cacheKey,
        });
        return optionsCache[cacheKey];
      }

      // Set loading state
      setLoadingStates((prev) => ({ ...prev, [fieldKey]: true }));

      try {
        // Use selector's datasourceName ONLY if it's explicitly set and different from referencedEntity
        // This handles special datasources like ProductByPriceAndWarehouse
        // For regular fields, use referencedEntity
        const selectorDatasource = (field.selector as any)?.datasourceName;
        const useSpecialDatasource = selectorDatasource && selectorDatasource !== field.referencedEntity;
        const datasourceName = useSpecialDatasource ? selectorDatasource : field.referencedEntity;

        if (!datasourceName) {
          logger.warn(`[useInlineTableDirOptions] No datasource or referencedEntity found for field ${fieldKey}`);
          return [];
        }

        logger.debug(`[useInlineTableDirOptions] Using datasource: ${datasourceName}`, {
          fieldKey,
          hasSelector: !!field.selector,
          selectorDatasourceName: (field.selector as any)?.datasourceName,
          useSpecialDatasource,
          referencedEntity: field.referencedEntity
        });

        // Build request body with selector configuration if available
        const baseBody: Record<string, string> = {
          _startRow: "0",
          _endRow: String(pageSize),
          _operationType: "fetch",
          _noCount: "true",
          _textMatchStyle: "substring",
        };

        // Add selector-specific parameters ONLY when using a special datasource (e.g., ProductByPriceAndWarehouse)
        // For regular datasources, these params can cause issues
        const selector = field.selector as any;
        if (selector && useSpecialDatasource) {
          // Only add safe, universal selector properties
          const safeParams = [
            '_selectorDefinitionId',
            'filterClass',
            'fieldId',
            'datasourceName',
            'displayField',
            'valueField',
            'moduleId',
            '_selectedProperties',
            '_extraProperties',
            'extraSearchFields'
          ];

          safeParams.forEach(param => {
            if (selector[param] !== null && selector[param] !== undefined) {
              baseBody[param] = String(selector[param]);
            }
          });

          logger.debug(`[useInlineTableDirOptions] Added ${safeParams.filter(p => selector[p] !== undefined).length} selector params for special datasource ${fieldKey}`);
        }

        // Add tab and window context if available
        if (tabId) baseBody.tabId = tabId;
        if (tabId) baseBody.inpTabId = tabId;
        if (windowId) baseBody.windowId = windowId;
        if (windowId) baseBody.inpwindowId = windowId;

        // Add organization context for filtering
        // The backend uses _org parameter to filter results by organization
        if (contextData?.organization) {
          baseBody._org = String(contextData.organization);
          logger.debug(`[useInlineTableDirOptions] Added _org parameter:`, {
            fieldKey,
            org: contextData.organization,
          });
        }

        // Apply search criteria if provided
        if (searchQuery) {
          // Use basic search on common fields
          baseBody._identifier = searchQuery;
          baseBody.name = searchQuery;
        }

        const body = new URLSearchParams(baseBody);

        logger.debug("[useInlineTableDirOptions] Fetching options", {
          fieldKey,
          datasourceName,
          searchQuery,
          baseBodyKeys: Object.keys(baseBody),
          requestBody: Object.fromEntries(body.entries()),
        });

        const { data } = await datasource.client.request(`/api/datasource/${datasourceName}`, {
          method: "POST",
          body,
        });

        logger.debug("[useInlineTableDirOptions] Response received", {
          fieldKey,
          hasData: !!data,
          hasResponse: !!data?.response,
          dataKeys: data ? Object.keys(data) : [],
          responseKeys: data?.response ? Object.keys(data.response) : [],
          recordCount: data?.response?.data?.length || 0,
          sampleRecord: data?.response?.data?.[0],
          hasError: !!data?.response?.error,
          error: data?.response?.error,
          status: data?.response?.status,
        });

        // Check for errors in the response
        if (data?.response?.error) {
          logger.error(`[useInlineTableDirOptions] Server returned error for ${fieldKey}:`, data.response.error);
        }

        // Process response
        const records = data?.response?.data || [];

        // Determine which field to use as the value
        // selector.valueField tells us which field contains the actual ID
        // e.g., "bpid" for BusinessPartner, "product$id" for Product
        const valueField = (field.selector as any)?.valueField;

        const options: RefListField[] = records.map((record: Record<string, unknown>) => {
          // Use displayField from selector, or fallback to _identifier/name/id
          const displayField = (field.selector as any)?.displayField;
          const displayValue = displayField ? record[displayField] : (record._identifier || record.name || record.id);

          // Use valueField from selector if specified, otherwise use id
          // For nested fields like "product$id", extract the value
          let idValue = record.id;
          if (valueField) {
            // Handle nested field names like "product$id"
            const fieldParts = valueField.split('$');
            let value: any = record;
            for (const part of fieldParts) {
              value = value?.[part];
            }
            idValue = value || record.id;
          }

          // Debug log for businessPartner to see what we're mapping
          if (fieldKey === 'Business Partner' || fieldKey === 'businessPartner') {
            logger.info(`[useInlineTableDirOptions] Mapping BP option:`, {
              valueField,
              recordId: record.id,
              recordBpid: (record as any).bpid,
              recordValue: (record as any).value,
              extractedIdValue: idValue,
              displayValue,
              record
            });
          }

          // Preserve all record fields for use in callouts (especially product data)
          // This allows callouts to access fields like standardPrice, netListPrice, uOM, currency, etc.
          return {
            id: String(idValue),
            value: String(idValue),
            label: String(displayValue),
            ...record, // Spread all other fields from the record
          };
        });

        // Cache the options if no search query (to avoid caching filtered results)
        if (!searchQuery) {
          setOptionsCache((prev) => ({ ...prev, [cacheKey]: options }));
        }

        logger.debug(`[useInlineTableDirOptions] Loaded ${options.length} options for ${fieldKey}`, {
          fieldKey,
          searchQuery,
          optionsCount: options.length,
          datasourceName,
        });

        return options;
      } catch (error) {
        logger.error(`[useInlineTableDirOptions] Failed to load options for ${fieldKey}:`, error);
        return [];
      } finally {
        setLoadingStates((prev) => ({ ...prev, [fieldKey]: false }));
      }
    },
    [optionsCache, tabId, windowId]
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
