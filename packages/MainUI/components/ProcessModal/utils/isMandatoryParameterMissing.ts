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

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

export interface IsMandatoryParameterMissingOptions {
  parameter: ProcessParameter;
  /** Current process-modal form values (react-hook-form snapshot). */
  formValues: Record<string, unknown>;
  /**
   * Resolves the parameter's current visibility. Must be the same source of truth
   * as the rendered selector (`isParameterDisplayed`), so the Execute button agrees
   * with what the user actually sees.
   */
  isDisplayed: (name: string) => boolean;
  /**
   * Classic `allRequiredParametersSet` parity: judge the parameter by its current
   * value only. A `defaultValue` expression that resolved empty, or a field that is
   * absent from the form values (a reset drops clean fields without a default), is
   * still missing. Grid parameters are exempt, as Classic skips `OBPickEditGridItem`.
   */
  requireActualValue?: boolean;
}

const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

/**
 * Returns true when the parameter must not be checked for a value: a `defaultValue`
 * (or a missing form registration) counts as set in the legacy mode, while the
 * value-only mode exempts grid parameters, whose selection is validated elsewhere.
 */
const isSkippedForValueCheck = (
  parameter: ProcessParameter,
  formValues: Record<string, unknown>,
  requireActualValue: boolean
): boolean => {
  if (requireActualValue) return parameter.reference === FIELD_REFERENCE_CODES.WINDOW.id;
  if (parameter.defaultValue) return true;
  const isRegisteredByName = parameter.name in formValues;
  const isRegisteredByDBColumn = Boolean(parameter.dBColumnName && parameter.dBColumnName in formValues);
  return !isRegisteredByName && !isRegisteredByDBColumn;
};

/**
 * Decides whether a mandatory process parameter still lacks a value and must
 * therefore keep the Execute button disabled.
 *
 * A parameter that is currently hidden — either by an explicit display override or
 * by its own display logic — is NOT required, matching Etendo Classic, which only
 * validates the fields the user can actually see. This is the key rule that keeps a
 * mandatory-but-hidden parameter (e.g. one gated behind another field's value) from
 * permanently blocking execution after it is hidden again.
 *
 * @param options - the parameter, the current form values, the visibility resolver
 *   and whether only the current value counts (`requireActualValue`)
 * @returns true when the parameter is mandatory, visible and empty
 */
export const isMandatoryParameterMissing = ({
  parameter,
  formValues,
  isDisplayed,
  requireActualValue = false,
}: IsMandatoryParameterMissingOptions): boolean => {
  const isActive = (parameter as Record<string, unknown>).active !== false;
  if (!parameter.mandatory || !isActive) return false;
  if (isSkippedForValueCheck(parameter, formValues, requireActualValue)) return false;

  const fieldName = parameter.name;
  const dbColumnName = parameter.dBColumnName;

  // Hidden parameters are not required (this is the fix for the reported bug).
  if (!isDisplayed(fieldName)) return false;

  let fieldValue = formValues[fieldName];
  if (fieldValue === undefined && dbColumnName) {
    fieldValue = formValues[dbColumnName];
  }
  return isEmptyValue(fieldValue);
};
