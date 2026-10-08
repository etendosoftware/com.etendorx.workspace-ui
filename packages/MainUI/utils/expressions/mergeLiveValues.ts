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
 * Overlays the values a form is currently showing on top of a base record.
 *
 * react-hook-form's `useWatch` reports `undefined` for fields that are not registered or
 * initialized yet; letting those through would shadow real record values (e.g. `false`),
 * so only defined overrides are applied.
 *
 * @param base - Persisted record values, if any.
 * @param overrides - Live form values keyed by field name.
 * @returns A new object with the base values and every defined override.
 */
export const mergeDefinedValues = (
  base: Record<string, unknown> | null | undefined,
  overrides: Record<string, unknown> | null | undefined
): Record<string, unknown> => {
  const definedOverrides = Object.fromEntries(
    Object.entries(overrides || {}).filter(([, value]) => value !== undefined)
  );
  return { ...base, ...definedOverrides };
};
