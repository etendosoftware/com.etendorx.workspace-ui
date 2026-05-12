/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * Sentinel id used for the synthetic group that holds parameters without a
 * `fieldGroup` value. Mirrors the convention used by `useFormFields` for
 * regular window forms, so both contexts behave consistently.
 */
export const DEFAULT_PROCESS_PARAM_GROUP_ID = "_main";

export interface ProcessParameterGroup {
  /** Field group id (or the {@link DEFAULT_PROCESS_PARAM_GROUP_ID} sentinel). */
  id: string;
  /** Field group display name (`fieldGroup$_identifier`). Empty for the
   *  default group — the caller resolves the i18n fallback for the title. */
  identifier: string;
  /** Minimum `sequenceNumber` across the members of the group; used to sort
   *  groups themselves in the rendered modal. */
  sequenceNumber: number;
  parameters: ProcessParameter[];
}

const readSequenceNumber = (param: ProcessParameter): number => {
  const raw = (param as unknown as { sequenceNumber?: number | string }).sequenceNumber;
  return Number(raw) || 0;
};

const readGroupId = (param: ProcessParameter): string => {
  const raw = param.fieldGroup ?? "";
  if (raw) return raw;
  return DEFAULT_PROCESS_PARAM_GROUP_ID;
};

/**
 * Groups process definition parameters by their `fieldGroup` metadata.
 *
 * - Parameters without a `fieldGroup` fall into a synthetic
 *   {@link DEFAULT_PROCESS_PARAM_GROUP_ID} bucket.
 * - Each group's `sequenceNumber` is the minimum across its members, so the
 *   returned array is sorted in the same order the user would expect from a
 *   global sort by `sequenceNumber`.
 * - Insertion order within a group is preserved — callers that pre-sort the
 *   input by `sequenceNumber` get a deterministic intra-group order.
 */
export function groupProcessParametersByFieldGroup(parameters: ProcessParameter[]): ProcessParameterGroup[] {
  const buckets: Record<string, ProcessParameterGroup> = {};

  for (const param of parameters) {
    const id = readGroupId(param);
    const seq = readSequenceNumber(param);

    if (!buckets[id]) {
      buckets[id] = {
        id,
        identifier: param.fieldGroup$_identifier ?? "",
        sequenceNumber: seq,
        parameters: [],
      };
    } else if (seq < buckets[id].sequenceNumber) {
      buckets[id].sequenceNumber = seq;
    }

    buckets[id].parameters.push(param);
  }

  return Object.values(buckets).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}
