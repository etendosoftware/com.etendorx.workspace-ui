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

export const isValidNumber = (value: string): boolean => {
  const regex = /^-?\d+(\.\d+)?$/;
  return regex.test(value) && !value.endsWith(".");
};

export const validateNumber = (
  value: string,
  minValue: number | undefined,
  maxValue: number | undefined
): { isValid: boolean; errorMessage: string } => {
  if (!isValidNumber(value)) {
    return { isValid: false, errorMessage: "Please enter a valid number" };
  }

  const num = Number.parseFloat(value);

  if (num < 0) {
    return { isValid: false, errorMessage: "Value must be non-negative" };
  }

  if (minValue !== undefined && num < minValue) {
    return { isValid: false, errorMessage: `Value must be at least ${minValue}` };
  }

  if (maxValue !== undefined && num > maxValue) {
    return { isValid: false, errorMessage: `Value must be at most ${maxValue}` };
  }

  if (Number.isNaN(num)) {
    return { isValid: false, errorMessage: "Please enter a valid number" };
  }

  return { isValid: true, errorMessage: "" };
};
