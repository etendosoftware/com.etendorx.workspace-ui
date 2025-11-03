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

import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { UseFormReturn } from "react-hook-form";

/**
 * Grid selection structure type
 */
export type GridSelectionStructure = {
  [entityName: string]: {
    _selection: EntityData[];
    _allRows: EntityData[];
  };
};

/**
 * Callout function type
 * Takes the current form values, form instance, and selected grid records
 * Returns updates to be applied to the form
 */
export type ProcessCalloutFunction = (
  formValues: Record<string, unknown>,
  form: UseFormReturn<Record<string, unknown>>,
  gridSelection?: GridSelectionStructure
) => Record<string, unknown> | Promise<Record<string, unknown>>;

/**
 * Callout configuration for a specific process
 */
export interface ProcessCallout {
  /** The field that triggers this callout */
  triggerField: string;
  /** The callout function to execute */
  execute: ProcessCalloutFunction;
}

/**
 * Process callouts configuration
 * Maps processId to array of callouts for that process
 */
export type ProcessCalloutsConfig = Record<string, ProcessCallout[]>;

/**
 * Process callouts registry
 * Add your process-specific callouts here
 *
 * Example:
 * ```typescript
 * "your-process-id": [
 *   {
 *     triggerField: "parameterName",
 *     execute: async (formValues, form, gridSelection) => {
 *       // Your callout logic here
 *       return {
 *         targetField: calculatedValue
 *       };
 *     }
 *   }
 * ]
 * ```
 */
export const PROCESS_CALLOUTS: ProcessCalloutsConfig = {
  // Callout for aprm_orderinvoice entity - Sum outstandingAmount to expected_payment
  "9BED7889E1034FE68BD85D5D16857320": [
    {
      triggerField: "_internalGridSelectionTrigger",
      execute: async (formValues, _form, gridSelection) => {
        // Log all available form fields to identify the correct field name
        console.log("Available form fields:", Object.keys(formValues));
        console.log("Current form values:", formValues);

        // Get all selected records from aprm_orderinvoice grid
        const selectedRecords = Object.values(gridSelection || {}).flatMap((selection) => selection._selection);

        console.log("Selected records:", selectedRecords);

        if (selectedRecords.length === 0) {
          return {
            expected_payment: "",
            Expected_Payment: "",
            expectedPayment: "",
            "Expected Payment": "",
          };
        }

        // Sum outstandingAmount from selected records
        const total = selectedRecords.reduce((sum, record) => {
          const amount = Number(record.outstandingAmount) || 0;
          return sum + amount;
        }, 0);

        const totalStr = total.toFixed(2);
        console.log("Calculated total:", totalStr);

        // Try multiple possible field name variations
        return {
          expected_payment: totalStr,
          Expected_Payment: totalStr,
          expectedPayment: totalStr,
          "Expected Payment": totalStr,
        };
      },
    },
  ],
};

/**
 * Get callouts for a specific process
 */
export function getProcessCallouts(processId: string): ProcessCallout[] {
  return PROCESS_CALLOUTS[processId] || [];
}
