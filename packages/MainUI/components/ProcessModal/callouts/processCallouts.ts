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

export const FUNDS_TRANSFER_PROCESS_ID = "CC73C4845CDC487395804946EACB225F";

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
 * Static, per-process callout registry.
 *
 * Empty by design: migrated processes drive their callouts through the generic
 * metadata-hook path (`em_etmeta_on_parameter_change` / the PayScript DSL engine,
 * resolved by `useProcessCallouts` via `getPayScriptRules`), so no process is
 * hardcoded here. The Add-Payment legacy exception that once lived here was
 * retired when the process moved to the generic mechanism.
 */
export const PROCESS_CALLOUTS: ProcessCalloutsConfig = {};

/**
 * Get callouts for a specific process
 */
export function getProcessCallouts(processId: string): ProcessCallout[] {
  return PROCESS_CALLOUTS[processId] || [];
}
