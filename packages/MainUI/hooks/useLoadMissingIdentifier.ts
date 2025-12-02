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

import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { EntityData, Field } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { logger } from "@/utils/logger";
import { useTabContext } from "@/contexts/tab";
import useFormParent from "@/hooks/useFormParent";
import { FieldName } from "@/hooks/types";
import { useFormInitializationContext } from "@/contexts/FormInitializationContext";

/**
 * Hook that automatically loads the missing identifier (display name)
 * when a field has a value but no identifier.
 * This happens when the backend returns default values in NEW mode
 * but doesn't include the identifier field.
 *
 * First tries to find it in loaded records, then fetches from the datasource if needed.
 *
 * @param field - The field configuration
 * @param records - Available records from the datasource
 */
export const useLoadMissingIdentifier = (field: Field, records: EntityData[]) => {
  const { watch, setValue } = useFormContext();
  const { tab } = useTabContext();
  const { setIsSettingInitialValues } = useFormInitializationContext();
  const currentValue = watch(field.hqlName);
  const currentIdentifier = watch(`${field.hqlName}$_identifier`);
  const parentData = useFormParent(FieldName.INPUT_NAME);
  const attemptedRef = useRef(false);

  // Extract field configuration to prevent effect re-runs from field object recreation
  const hqlName = field.hqlName;
  const datasourceName = field.selector?.datasourceName;
  const displayField = field.selector?.displayField ?? "_identifier";
  const valueField = field.selector?.valueField ?? "id";
  const windowId = tab?.window;

  useEffect(() => {
    // Skip if already attempted or if identifier is already present
    if (attemptedRef.current || currentIdentifier) {
      return;
    }

    // Skip if no value
    if (!currentValue) {
      return;
    }

    const matchingRecord = records.find((record) => String(record[valueField]) === String(currentValue));

    if (matchingRecord) {
      const identifier = matchingRecord[displayField] as string;
      if (identifier) {
        setValue(`${hqlName}$_identifier`, identifier, { shouldDirty: false });
        attemptedRef.current = true;
      }
      return;
    }

    // If no matching record found in loaded records, fetch from datasource
    attemptedRef.current = true;
    setIsSettingInitialValues(true);
    (async () => {
      try {
        if (!datasourceName) {
          logger.warn(`[useLoadMissingIdentifier] No datasourceName found for field ${hqlName}`);
          setIsSettingInitialValues(false);
          return;
        }

        // Check for required context
        if (!windowId || !field.module || !field.tab || !field.column?.table) {
          setIsSettingInitialValues(false);
          return;
        }

        // Build complete request body following useTableDirDatasource pattern
        const requestBody = {
          _startRow: "0",
          _endRow: "1",
          _operationType: "fetch",
          ...field.selector,
          moduleId: field.module,
          windowId,
          tabId: field.tab,
          inpTabId: field.tab,
          inpwindowId: windowId,
          inpTableId: field.column.table,
          initiatorField: hqlName,
          _constructor: "AdvancedCriteria",
          _OrExpression: "true",
          _currentValue: currentValue,
          _textMatchStyle: "exact",
          ...parentData,
        };

        const body = new URLSearchParams();
        for (const [key, value] of Object.entries(requestBody)) {
          if (value !== undefined && value !== null) {
            body.append(key, String(value));
          }
        }

        const { data } = await datasource.client.request(`/api/datasource/${datasourceName}`, {
          method: "POST",
          body,
        });

        const record = data?.response?.data?.[0];
        if (record) {
          const identifier = record[displayField] as string;
          if (identifier) {
            setValue(`${hqlName}$_identifier`, identifier, { shouldDirty: false });
          }
        }
      } catch (error) {
        logger.warn(`Failed to load identifier for field ${hqlName}:`, error);
      } finally {
        setIsSettingInitialValues(false);
      }
    })();
  }, [
    currentValue,
    currentIdentifier,
    hqlName,
    datasourceName,
    displayField,
    valueField,
    records,
    setValue,
    windowId,
    field.module,
    field.tab,
    field.column,
    field.selector,
    parentData,
    setIsSettingInitialValues,
  ]);
};
