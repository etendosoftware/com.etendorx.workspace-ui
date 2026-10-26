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

/** Process parameters keyed as the metadata emits them. */
type ParametersMap = Record<string, ProcessParameter>;

/**
 * The process form keys each field by its parameter `name`, so two parameters with the same name
 * would share one field (Add Payment's visible "There is a difference of" and its hidden
 * `expectedDifference`): the field would show, and submit, the other parameter's value.
 *
 * Returns the parameters with a unique `name` each: of the parameters sharing a name, the first
 * by sequence number keeps it; the others take their `dBColumnName` as name and keep the shared
 * one as `label`, so their caption does not change. The same map is returned when every name is
 * unique, so nothing re-renders for it.
 */
export function withUniqueParameterNames(parameters: ParametersMap): ParametersMap {
  const keepers = new Map<string, ProcessParameter>();
  let hasDuplicates = false;
  for (const parameter of bySequence(Object.values(parameters))) {
    if (keepers.has(parameter.name)) {
      hasDuplicates = true;
    } else {
      keepers.set(parameter.name, parameter);
    }
  }
  if (!hasDuplicates) return parameters;

  const unique: ParametersMap = {};
  for (const [key, parameter] of Object.entries(parameters)) {
    unique[key] = keepers.get(parameter.name) === parameter ? parameter : renamed(parameter);
  }
  return unique;
}

/** Parameters ordered by sequence number; those without one keep their order, last. */
function bySequence(parameters: ProcessParameter[]): ProcessParameter[] {
  const sequence = (parameter: ProcessParameter) => parameter.sequenceNumber ?? Number.MAX_SAFE_INTEGER;
  return [...parameters].sort((a, b) => sequence(a) - sequence(b));
}

/** A duplicate keyed by its column name, captioned with the shared name. */
function renamed(parameter: ProcessParameter): ProcessParameter {
  const copy: ProcessParameter = { ...parameter };
  copy.name = parameter.dBColumnName;
  copy.label = parameter.name;
  return copy;
}

/** Caption of a parameter: its shared name when it was renamed to be unique. */
export function parameterLabel(parameter: Pick<ProcessParameter, "name"> & { label?: string }): string {
  return parameter.label ?? parameter.name;
}
