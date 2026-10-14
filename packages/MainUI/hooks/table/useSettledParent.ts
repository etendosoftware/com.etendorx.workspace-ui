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

import { useRef } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { SELECTION_SETTLE_MS, useSettledValue } from "@/hooks/useSettledValue";

/**
 * The parent selection a child tab fetches with. Moving fast over parent records keeps the first one
 * until the selection settles on the last ({@link SELECTION_SETTLE_MS}), so the child does not fetch
 * for every parent passed over; an isolated change, or a refreshed record of the same parent, passes
 * through in the same render.
 */
export function useSettledParent({
  parentRecord,
  parentIdFromUrl,
}: {
  parentRecord?: EntityData | null;
  parentIdFromUrl?: string;
}): { parentId: string; parentRecord: EntityData | null; isPending: boolean } {
  const liveParentId = String(parentRecord?.id ?? parentIdFromUrl ?? "");
  const parentId = useSettledValue(liveParentId, SELECTION_SETTLE_MS);

  // The latest record seen for the settled parent, so a held burst keeps querying with its context.
  // Written during render on purpose (like useSettledValue): the value only depends on this render's inputs.
  const recordRef = useRef<EntityData | null>(parentRecord ?? null);
  if (parentRecord && String(parentRecord.id) === parentId) {
    recordRef.current = parentRecord;
  } else if (!parentRecord && parentId === liveParentId) {
    recordRef.current = null;
  }

  return {
    parentId,
    parentRecord: recordRef.current && String(recordRef.current.id) === parentId ? recordRef.current : null,
    // True while a newer parent is held: the child still shows the previous parent's rows.
    isPending: parentId !== liveParentId,
  };
}
