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

/**
 * @fileoverview useProcessFICCallout
 *
 * Generic hook that replicates Classic ERP's FormInitializationComponent MODE=CHANGE
 * callout mechanism for process parameters in REPORT_AND_PROCESS processes opened from
 * the sidebar menu.
 *
 * In Classic, when a field changes in a REPORT_AND_PROCESS window, the FIC servlet is
 * called with the new value and returns updated columnValues (field updates) and
 * dynamicCols (display/readonly logic changes). This hook implements that mechanism
 * generically for any process that provides a tabId in its metadata.
 *
 * If a parameter does not have a Java callout attached in Classic, the FIC call is a
 * no-op and returns the current values unchanged — so it is safe to call for all fields.
 */

import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

const FIC_ACTION = "org.openbravo.client.application.window.FormInitializationComponent";

export interface FICCalloutResponse {
  columnValues: Record<string, { value: string; classicValue?: string; identifier?: string }>;
  dynamicCols: string[];
  auxiliaryInputValues?: Record<string, { value: string; classicValue?: string }>;
}

export interface UseProcessFICCalloutOptions {
  /** Tab ID of the process window (from meta/report-and-process response) */
  tabId: string;
  parameters: Record<string, ProcessParameter>;
  form: UseFormReturn<Record<string, unknown>>;
  enabled: boolean;
  /** Called with the parsed FIC response after a field change callout */
  onCalloutResponse: (response: FICCalloutResponse) => void;
}

/**
 * Builds the payload for a FIC MODE=CHANGE request.
 * Maps current form values to their DB column names (inp-prefixed) as Classic expects.
 */
function buildFICPayload(
  formValues: Record<string, unknown>,
  parameters: Record<string, ProcessParameter>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [formKey, value] of Object.entries(formValues)) {
    // Find the corresponding parameter to get the DB column name
    const param = Object.values(parameters).find((p) => p.name === formKey || p.dBColumnName === formKey);
    const columnName = param?.dBColumnName || formKey;

    // Classic FIC expects inp-prefixed column names
    const inpKey = columnName.startsWith("inp") ? columnName : `inp${columnName}`;
    payload[inpKey] = value ?? "";
  }

  return payload;
}

/**
 * Hook that fires FormInitializationComponent MODE=CHANGE when a process parameter
 * value changes. This replicates Classic callout behavior generically.
 */
export function useProcessFICCallout({
  tabId,
  parameters,
  form,
  enabled,
  onCalloutResponse,
}: UseProcessFICCalloutOptions): void {
  const previousValuesRef = useRef<Record<string, unknown>>({});
  const isExecutingRef = useRef(false);
  const isInitialMountRef = useRef(true);

  const formValues = form.watch();

  const executeCallout = useCallback(
    async (changedField: string) => {
      if (isExecutingRef.current) return;

      const param = Object.values(parameters).find((p) => p.name === changedField || p.dBColumnName === changedField);
      if (!param) return;

      const columnName = param.dBColumnName || param.name;
      const payload = buildFICPayload(formValues, parameters);

      const ficParams = new URLSearchParams({
        _action: FIC_ACTION,
        MODE: "CHANGE",
        TAB_ID: tabId,
        CHANGED_COLUMN: columnName,
      });

      try {
        isExecutingRef.current = true;
        logger.debug(`[useProcessFICCallout] Firing FIC for field: ${changedField} (column: ${columnName})`);

        const response = await Metadata.kernelClient.post(`?${ficParams}`, payload);

        // Unwrap the FIC response envelope
        const rawData = response?.data;
        if (!rawData) return;

        let data = null;
        if (rawData.columnValues !== undefined) {
          data = rawData;
        } else if (rawData.response?.columnValues !== undefined) {
          data = rawData.response;
        }

        if (data?.columnValues) {
          logger.debug(`[useProcessFICCallout] Received FIC response for: ${changedField}`, data.columnValues);
          onCalloutResponse({
            columnValues: data.columnValues,
            dynamicCols: data.dynamicCols || [],
            auxiliaryInputValues: data.auxiliaryInputValues,
          });
        }
      } catch (error) {
        logger.warn(`[useProcessFICCallout] Error calling FIC for field "${changedField}":`, error);
      } finally {
        isExecutingRef.current = false;
      }
    },
    [tabId, parameters, formValues, onCalloutResponse]
  );

  useEffect(() => {
    if (!enabled || !tabId) return;

    // Skip on initial mount to avoid overwriting values just set from DefaultsProcessActionHandler
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousValuesRef.current = { ...formValues };
      return;
    }

    if (isExecutingRef.current) return;

    // Detect which fields changed since last render
    const changedFields = Object.keys(formValues).filter((key) => {
      const curr = formValues[key];
      const prev = previousValuesRef.current[key];
      if (typeof curr === "object" && curr !== null) {
        return JSON.stringify(curr) !== JSON.stringify(prev);
      }
      return curr !== prev;
    });

    previousValuesRef.current = { ...formValues };

    if (changedFields.length === 0) return;

    // Fire the FIC callout for each changed field sequentially
    // (matching Classic behavior: one callout per changed field)
    for (const changedField of changedFields) {
      executeCallout(changedField);
    }
  }, [formValues, enabled, tabId, executeCallout]);
}
