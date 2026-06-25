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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview Detects mandatory process parameters left empty before execution.
 *
 * Mirrors the classic UI criterion: a Report and Process popup validates its
 * required parameters on submit and shows AD_Message `JS1`
 * ("You have not filled in all needed fields") when any is empty, instead of
 * posting to the backend. This helper isolates that decision so the modal can
 * block execution and surface the message.
 */

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Returns true when the parameter is hidden by display logic, so it must not be
 * treated as required. Logic flags are keyed by `dBColumnName` (the form's raw
 * key) and, as a fallback, by the display `name`.
 */
function isParameterHidden(param: ProcessParameter, logicFields?: Record<string, boolean>): boolean {
  if (!logicFields) return false;
  if (logicFields[`${param.dBColumnName}.display`] === false) return true;
  if (logicFields[`${param.name}.display`] === false) return true;
  return false;
}

/**
 * Returns true when a form value counts as "not filled in": null, undefined, an
 * empty string, or an empty array (multi-selectors / grids).
 */
function isValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Finds the mandatory, currently-displayed parameters whose form value is empty.
 *
 * The value is read by the parameter's display `name` (the key react-hook-form
 * registers) and falls back to its `dBColumnName`. Unlike the legacy button-disable
 * check, this inspects the actual current value rather than the mere presence of a
 * `defaultValue` expression, so a parameter whose default failed to resolve is still
 * reported as missing.
 *
 * @param parameters Process parameters keyed by name (the modal's `parameters` map).
 * @param formValues Current form values.
 * @param logicFields Display/readonly logic flags (`<key>.display` / `<key>.readonly`).
 * @returns The mandatory parameters left empty, in iteration order (empty when valid).
 */
export function findMissingMandatoryParameters(
  parameters: Record<string, ProcessParameter>,
  formValues: Record<string, unknown>,
  logicFields?: Record<string, boolean>
): ProcessParameter[] {
  const missing: ProcessParameter[] = [];

  for (const param of Object.values(parameters)) {
    if (!param.mandatory) continue;
    if (isParameterHidden(param, logicFields)) continue;

    let value = formValues[param.name];
    if (value === undefined && param.dBColumnName) {
      value = formValues[param.dBColumnName];
    }

    if (isValueEmpty(value)) {
      missing.push(param);
    }
  }

  return missing;
}
