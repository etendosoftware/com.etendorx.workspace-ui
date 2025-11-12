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
    async (field: Field, searchQuery?: string, pageSize = 75): Promise<RefListField[]> => {
      const fieldKey = field.name || field.hqlName;
      const cacheKey = `${fieldKey}-${searchQuery || ""}-${pageSize}`;

      logger.debug(`[useInlineTableDirOptions] loadOptions called`, {
        fieldKey,
        fieldType: field.type,
        hasRefList: !!field.refList,
        refListLength: field.refList?.length || 0,
        referencedEntity: field.referencedEntity,
        searchQuery,
      });

      // Return cached options if available and no search query
      if (optionsCache[cacheKey] && !searchQuery) {
        logger.debug(`[useInlineTableDirOptions] Returning cached options for ${fieldKey}`, {
          count: optionsCache[cacheKey].length,
        });
        return optionsCache[cacheKey];
      }

      // Set loading state
      setLoadingStates((prev) => ({ ...prev, [fieldKey]: true }));

      try {
        // When selector is undefined, we query the referenced entity directly without filters
        // This is different from FormView where selector has full configuration
        const datasourceName = field.referencedEntity;

        if (!datasourceName) {
          logger.warn(`[useInlineTableDirOptions] No referencedEntity found for field ${fieldKey}`);
          return [];
        }

        // Build minimal request body - no filters, just basic pagination and sort
        const baseBody: Record<string, string> = {
          _startRow: "0",
          _endRow: String(pageSize),
          _operationType: "fetch",
          _noCount: "true",
          _textMatchStyle: "substring",
        };

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
        const options: RefListField[] = records.map((record: Record<string, unknown>) => {
          // Use standard fields for display and value
          const displayValue = record._identifier || record.name || record.id;
          const idValue = record.id;

          return {
            id: String(idValue),
            value: String(idValue),
            label: String(displayValue),
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
