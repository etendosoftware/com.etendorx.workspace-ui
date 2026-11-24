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
 * Value of the Product Characteristics field of a form. In edit mode, the form initialization of Classic
 * (`CharacteristicsUIDefinition.getFieldProperties`) returns the stored text together with one entry per
 * characteristic of the product, with as many parent levels as the `ShowProductCharacteristicsParents`
 * preference sets (e.g. "Botella / Vidrio").
 */
export interface ProductCharacteristicsValue {
  dbValue: string;
  characteristics: Record<string, string>;
}

export interface ProductCharacteristicLine {
  name: string;
  value: string;
}

/** Suffix of the form key that keeps the characteristics of a Product Characteristics field. */
const CHARACTERISTICS_KEY_SUFFIX = "$_characteristics";

/** Returns whether a form initialization value carries the characteristics of the product. */
export function isProductCharacteristicsValue(value: unknown): value is ProductCharacteristicsValue {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.characteristics === "object" && candidate.characteristics !== null;
}

/** Form key that keeps the characteristics of the field with the given name. */
export function getCharacteristicsKey(fieldName: string): string {
  return `${fieldName}${CHARACTERISTICS_KEY_SUFFIX}`;
}

/** Returns one line per characteristic, in the order the server sent them. */
export function getCharacteristicLines(characteristics: unknown): ProductCharacteristicLine[] {
  if (typeof characteristics !== "object" || characteristics === null) return [];
  return Object.entries(characteristics as Record<string, unknown>).map(([name, value]) => ({
    name,
    value: String(value ?? ""),
  }));
}
