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

import { useCallback, useState } from "react";
import type { Tab, EntityData, Field } from "@workspaceui/api-client/src/api/types";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import {
  buildFormInitializationParams,
  buildFormInitializationPayload,
  fetchFormInitialization,
} from "@/utils/hooks/useFormInitialization/utils";
import { logger } from "@/utils/logger";
import { useTabContext } from "@/contexts/tab";
import useFormParent from "@/hooks/useFormParent";
import { FieldName } from "@/hooks/types";

interface UseInlineEditInitializationProps {
  tab: Tab;
}

interface InlineEditInitializationResult {
  fetchInitialData: (rowId: string, isNew: boolean) => Promise<EntityData | null>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch form initialization data for inline editing
 * Uses the same utilities as useFormInitialization but adapted for inline editing
 */
export function useInlineEditInitialization({ tab }: UseInlineEditInitializationProps): InlineEditInitializationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { parentRecord } = useTabContext();
  const parentData = useFormParent(FieldName.INPUT_NAME);

  /**
   * Finds the primary key column field in the tab's field configuration
   */
  const findEntityKeyColumn = useCallback((fields: Tab["fields"]): Field | undefined => {
    return Object.values(fields).find((field) => field?.column?.keyColumn);
  }, []);

  // Remove custom mapping function - use existing utilities instead

  /**
   * Processes form initialization response into EntityData format
   * Uses the exact same logic as useFormInitialState for consistency
   */
  const processFormInitializationData = useCallback(
    (formInitialization: any, tab: Tab): EntityData => {
      const fieldsByColumnName = getFieldsByColumnName(tab);
      const acc = { ...formInitialization.sessionAttributes } as EntityData;

      logger.info(`[InlineEdit] Processing form initialization data`, {
        auxiliaryInputValuesKeys: Object.keys(formInitialization.auxiliaryInputValues || {}),
        columnValuesKeys: Object.keys(formInitialization.columnValues || {}),
        sessionAttributesKeys: Object.keys(formInitialization.sessionAttributes || {}),
        fieldsByColumnNameKeys: Object.keys(fieldsByColumnName || {}),
      });

      // Process auxiliary input values - exact same logic as useFormInitialState
      for (const [key, valueObj] of Object.entries(formInitialization.auxiliaryInputValues || {})) {
        const { value } = valueObj as { value: any };
        const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;

        logger.debug(`[InlineEdit] Processing auxiliary input: ${key} -> ${newKey}`, {
          originalKey: key,
          mappedKey: newKey,
          value,
          hasField: !!fieldsByColumnName?.[key],
          fieldHqlName: fieldsByColumnName?.[key]?.hqlName,
        });

        acc[newKey] = value;
      }

      // Process column values with identifiers - exact same logic as useFormInitialState
      for (const [key, valueObj] of Object.entries(formInitialization.columnValues || {})) {
        const { value, identifier } = valueObj as { value: any; identifier?: string };
        const field = fieldsByColumnName?.[key];
        const newKey = field?.hqlName ?? key;

        logger.debug(`[InlineEdit] Processing column value: ${key} -> ${newKey}`, {
          originalKey: key,
          mappedKey: newKey,
          value,
          identifier,
          hasField: !!field,
          fieldHqlName: field?.hqlName,
        });

        acc[newKey] = value;

        if (identifier) {
          acc[`${newKey}$_identifier`] = identifier;
        } else if (value !== null && value !== undefined && value !== "") {
          acc[`${newKey}$_identifier`] = "";
        }
      }

      // Include parent data
      const processedParentData = { ...parentData };
      const finalData = { ...acc, ...processedParentData };

      logger.info(`[InlineEdit] Final processed data`, {
        totalFields: Object.keys(finalData).length,
        fieldNames: Object.keys(finalData),
        sampleValues: Object.fromEntries(
          Object.entries(finalData)
            .slice(0, 5)
            .map(([key, value]) => [key, value])
        ),
      });

      return finalData;
    },
    [parentData]
  );

  const fetchInitialData = useCallback(
    async (rowId: string, isNew: boolean): Promise<EntityData | null> => {
      setLoading(true);
      setError(null);

      try {
        const mode = isNew ? FormMode.NEW : FormMode.EDIT;
        const recordId = isNew ? undefined : rowId;
        const parentId = parentRecord?.id?.toString();

        logger.info(`[InlineEdit] Fetching initialization data for ${mode} mode, rowId: ${rowId}`);

        // Build params for form initialization
        const params = buildFormInitializationParams({
          tab,
          mode,
          recordId,
          parentId,
        });

        // Find entity key column
        const entityKeyColumn = findEntityKeyColumn(tab.fields);
        if (!entityKeyColumn) {
          throw new Error("Missing key column for form initialization");
        }

        // Build payload using the same logic as useFormInitialization
        const payload = buildFormInitializationPayload(tab, mode, parentData, entityKeyColumn);

        // Fetch initialization data
        const formInitializationResponse = await fetchFormInitialization(params, payload);

        // Process the response into EntityData format
        const initializedData = processFormInitializationData(formInitializationResponse, tab);

        logger.info(`[InlineEdit] Successfully fetched and processed initialization data`, {
          rowId,
          processedFields: Object.keys(initializedData).length,
          hasAuxiliaryInputValues: !!formInitializationResponse.auxiliaryInputValues,
          hasColumnValues: !!formInitializationResponse.columnValues,
        });

        setLoading(false);
        return initializedData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch initialization data");
        logger.error(`[InlineEdit] Error fetching initialization data:`, error);
        setError(error);
        setLoading(false);
        return null;
      }
    },
    [tab, parentRecord, parentData, findEntityKeyColumn, processFormInitializationData]
  );

  return {
    fetchInitialData,
    loading,
    error,
  };
}
