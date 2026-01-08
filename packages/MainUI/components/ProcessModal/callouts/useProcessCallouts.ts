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

import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { getProcessCallouts } from "./processCallouts";
import type { GridSelectionStructure as ModalGridSelectionStructure } from "../ProcessDefinitionModal";
import { logger } from "@/utils/logger";
import {
  getDbColumnName,
  mapFormValuesToContext,
  mapUpdatesToFormFields,
} from "../utils/processParameterMapping";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

/**
 * Tipo local que hace compatible ambas definiciones de GridSelectionStructure.
 * No se usa `any`, solo `unknown`, para mantener la seguridad de tipos.
 */
type CompatibleGridSelection =
  | {
      _selection: unknown[];
      _allRows: unknown[];
    }
  | ModalGridSelectionStructure
  | undefined;

interface UseProcessCalloutsOptions {
  processId: string;
  form: UseFormReturn<Record<string, unknown>>;
  gridSelection?: CompatibleGridSelection;
  parameters?: Record<string, ProcessParameter>;
  enabled?: boolean;
  onGridUpdate?: (gridName: string, data: unknown) => void;
}

/**
 * Hook to handle process callouts
 * Watches form values and grid selection, executing callouts when trigger fields change
 */
export function useProcessCallouts({
  processId,
  form,
  gridSelection,
  parameters,
  enabled = true,
  onGridUpdate,
}: UseProcessCalloutsOptions) {
  const callouts = getProcessCallouts(processId);
  const previousValuesRef = useRef<Record<string, unknown>>({});
  const previousGridSelectionRef = useRef<string>("");
  const isExecutingRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Watch all form values
  const formValues = form.watch();

  /**
   * Execute a single callout
   */
  const executeCallout = useCallback(
    async (callout: (typeof callouts)[0], changedField: string) => {
      if (isExecutingRef.current) {
        return;
      }

      try {
        isExecutingRef.current = true;
        logger.debug(`Executing callout for field: ${changedField}`);

        // Prepare context values (map form parameter names to DB column names)
        const contextValues = parameters ? mapFormValuesToContext(formValues, parameters) : formValues;

        // Forzamos el tipo solo en este punto, sin usar any
        const updates = await callout.execute(
          contextValues,
          form,
          gridSelection as unknown as Parameters<typeof callout.execute>[2]
        );

        // Map updates back to form field names
        const mappedUpdates = parameters ? mapUpdatesToFormFields(updates, parameters) : updates;

        // Apply updates to the form or grid
        for (const [field, value] of Object.entries(mappedUpdates)) {
          // Find the parameter that corresponds to this field name
          const parameter = parameters && Object.values(parameters).find(p => p.name === field);
          
          // Check if this field corresponds to a grid parameter
          const isGridParameter = parameter && parameter.reference === FIELD_REFERENCE_CODES.WINDOW;

          // We also need to handle 'order_invoice' explicitly if mapping missing or specific key usage
          // The most robust way is to check if we have an onGridUpdate handler AND if the value looks like grid data (array)
          // EXCEPTION: _validations is an array but it is form metadata, not a grid
          const isArrayData = Array.isArray(value) && field !== '_validations';
          
          if (onGridUpdate && (isGridParameter || isArrayData)) {
              // Use dBColumnName for grid updates if available (WindowReferenceGrid uses dBColumnName as key)
              // fallback to field name if not found
              const gridKey = parameter?.dBColumnName || field;
              onGridUpdate(gridKey, value);
          } else {
              form.setValue(field, value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
          }
        }

        logger.debug(`Callout executed successfully for field: ${changedField}`, mappedUpdates);
      } catch (error) {
        logger.warn(`Error executing callout for field ${changedField}:`, error);
      } finally {
        isExecutingRef.current = false;
      }
    },
    [formValues, form, gridSelection]
  );

  /**
   * Check for field changes and trigger callouts
   * Also handles initial execution when modal opens with pre-existing data
   */
  useEffect(() => {
    if (!enabled || callouts.length === 0 || isExecutingRef.current) {
      return;
    }

    // Check if grid selection has changed
    const currentGridSelectionString = JSON.stringify(gridSelection || {});
    const gridSelectionChanged = currentGridSelectionString !== previousGridSelectionRef.current;

    // On initial mount: only execute grid-based callouts to calculate totals
    // Skip field-based callouts to preserve initial values from server
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousValuesRef.current = { ...formValues };
      previousGridSelectionRef.current = currentGridSelectionString;

      // Execute only grid selection trigger on initial load if grid has data
      if (gridSelectionChanged && currentGridSelectionString !== "{}") {
        const gridCallouts = callouts.filter((c) => c.triggerField === "_internalGridSelectionTrigger");
        for (const callout of gridCallouts) {
          executeCallout(callout, "_internalGridSelectionTrigger");
        }
      }
      return;
    }

    // Find which fields have changed
    const changedFields = Object.keys(formValues).filter((key) => {
      const currentValue = formValues[key];
      const previousValue = previousValuesRef.current[key];

      // Deep comparison for objects/arrays
      if (typeof currentValue === "object" && currentValue !== null) {
        return JSON.stringify(currentValue) !== JSON.stringify(previousValue);
      }

      return currentValue !== previousValue;
    });

    // Update previous values reference
    previousValuesRef.current = { ...formValues };
    previousGridSelectionRef.current = currentGridSelectionString;

    // If grid selection changed, add special trigger field
    if (gridSelectionChanged) {
      changedFields.push("_internalGridSelectionTrigger");
    }

    // If no fields changed, don't trigger callouts
    if (changedFields.length === 0) {
      return;
    }

    // Execute callouts for changed fields
    for (const changedField of changedFields) {
      // Map changed field to DB column name for matching
      const changedFieldDbName = parameters ? getDbColumnName(changedField, parameters) : changedField;

      // Match with exact field name OR with/without 'inp' prefix
      const matchingCallouts = callouts.filter((callout) => {
        const trigger = callout.triggerField;
        if (trigger === changedField) return true;
        if (trigger === changedFieldDbName) return true;

        // Try matching with inp prefix variations
        if (changedField.startsWith("inp") && trigger === changedField.substring(3)) return true;
        if (trigger.startsWith("inp") && changedField === trigger.substring(3)) return true;
        if (`inp${trigger}` === changedField) return true;
        if (`inp${changedField}` === trigger) return true;

        return false;
      });

      for (const callout of matchingCallouts) {
        executeCallout(callout, changedField);
      }
    }
  }, [formValues, gridSelection, callouts, enabled, executeCallout, parameters]);

  return {
    hasCallouts: callouts.length > 0,
    callouts,
  };
}
