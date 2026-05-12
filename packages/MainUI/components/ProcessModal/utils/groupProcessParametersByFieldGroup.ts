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

/**
 * Groups process definition parameters by their `fieldGroup` metadata, mirroring
 * the classic UI behavior implemented in `OBViewParameterHandler.java`.
 *
 * **Precondition**: callers MUST pre-sort `parameters` by `sequenceNumber`. The
 * sticky-inheritance rule below relies on that order.
 *
 * Rules:
 * - When a parameter has an explicit non-empty `fieldGroup`, it opens (or
 *   re-enters) a section identified by that id.
 * - When a parameter has a null/empty `fieldGroup` AFTER a section has opened,
 *   it is appended to the most-recently-opened section (sticky inheritance) —
 *   matching how the classic SmartClient UI renders parameters sequentially.
 * - Parameters that appear BEFORE any non-empty `fieldGroup` go into the
 *   synthetic {@link DEFAULT_PROCESS_PARAM_GROUP_ID} bucket.
 * - Each group's `sequenceNumber` is the minimum across its members, so the
 *   returned array is sorted in the same order the user would expect from a
 *   global sort by `sequenceNumber`.
 * - Insertion order within a group is preserved.
 */
export function groupProcessParametersByFieldGroup(parameters: ProcessParameter[]): ProcessParameterGroup[] {
  const buckets: Record<string, ProcessParameterGroup> = {};
  let currentExplicitGroupId: string | null = null;
  let currentExplicitGroupIdentifier = "";

  for (const param of parameters) {
    const explicitId = param.fieldGroup ?? "";
    if (explicitId) {
      currentExplicitGroupId = explicitId;
      currentExplicitGroupIdentifier = param.fieldGroup$_identifier ?? "";
    }

    const bucketId = currentExplicitGroupId ?? DEFAULT_PROCESS_PARAM_GROUP_ID;
    const seq = readSequenceNumber(param);

    if (!buckets[bucketId]) {
      buckets[bucketId] = {
        id: bucketId,
        identifier: currentExplicitGroupIdentifier,
        sequenceNumber: seq,
        parameters: [],
      };
    } else if (seq < buckets[bucketId].sequenceNumber) {
      buckets[bucketId].sequenceNumber = seq;
    }

    buckets[bucketId].parameters.push(param);
  }

  return Object.values(buckets).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}
