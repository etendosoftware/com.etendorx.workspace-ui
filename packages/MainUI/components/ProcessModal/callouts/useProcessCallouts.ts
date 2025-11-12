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
import { getProcessCallouts } from "./processCallouts";
import type { GridSelectionStructure as ModalGridSelectionStructure } from "../ProcessDefinitionModal";
import { logger } from "@/utils/logger";

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
  enabled?: boolean;
}

/**
 * Hook to handle process callouts
 * Watches form values and grid selection, executing callouts when trigger fields change
 */
export function useProcessCallouts({ processId, form, gridSelection, enabled = true }: UseProcessCalloutsOptions) {
  const callouts = getProcessCallouts(processId);
  const previousValuesRef = useRef<Record<string, unknown>>({});
  const previousGridSelectionRef = useRef<string>("");
  const isExecutingRef = useRef(false);

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

        // Forzamos el tipo solo en este punto, sin usar any
        const updates = await callout.execute(
          formValues,
          form,
          gridSelection as unknown as Parameters<typeof callout.execute>[2]
        );

        // Apply updates to the form
        for (const [field, value] of Object.entries(updates)) {
          form.setValue(field, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        logger.debug(`Callout executed successfully for field: ${changedField}`, updates);
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
   */
  useEffect(() => {
    if (!enabled || callouts.length === 0 || isExecutingRef.current) {
      return;
    }

    // Check if grid selection has changed
    const currentGridSelectionString = JSON.stringify(gridSelection || {});
    const gridSelectionChanged = currentGridSelectionString !== previousGridSelectionRef.current;

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
      const matchingCallouts = callouts.filter((callout) => callout.triggerField === changedField);

      for (const callout of matchingCallouts) {
        executeCallout(callout, changedField);
      }
    }
  }, [formValues, gridSelection, callouts, enabled, executeCallout]);

  return {
    hasCallouts: callouts.length > 0,
    callouts,
  };
}
