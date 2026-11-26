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

import { useEffect, useState } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { useWindowStore } from "@/stores/windowStore";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import type { TabState } from "@/utils/window/constants";

/**
 * Longest wait of a child tab for the record of its parent. The record is on its way when the wait starts, so
 * it normally arrives in a few hundred milliseconds; this only keeps a record that never arrives from blocking
 * the grid, which then loads with the parent id alone (and again if the record arrives later), as before.
 */
export const PARENT_RECORD_WAIT_MS = 2000;

interface ParentRecordPendingParams {
  windowIdentifier: string;
  parentTabId?: string;
  /** Parent record id the tab fetches with (from the graph or, before it, from the store). */
  parentId: string;
  /** Parent record the tab fetches with, null while only its id is known. */
  parentRecord: EntityData | null;
}

/**
 * Whether the record of the parent is on its way: the parent tab was rebuilt from a link or the URL (only its id
 * is known until its grid or its form loads it), or its form is loading that record. In any other case a missing
 * record is not coming, and the child loads with the id, as before.
 */
const isParentRecordArriving = (
  windowIdentifier: string,
  parentTabId: string,
  parentId: string,
  tabs: Record<string, TabState> | undefined
): boolean => {
  const parentTabState = tabs?.[parentTabId];
  if (!windowIdentifier || !parentTabState) {
    return false;
  }
  return Boolean(parentTabState.initializedWithDirectLink) || parentTabState.form?.recordId === parentId;
};

/**
 * Whether a child tab still waits for the record of its parent before its first load. A recovered or linked
 * window knows the parent id before the parent record: loading with the id alone and again with the record
 * (whose session properties the child's where clause reads) made two loads, and the first one could show other
 * rows. Classic loads a child once its parent record is selected.
 */
export function useParentRecordPending({
  windowIdentifier,
  parentTabId,
  parentId,
  parentRecord,
}: ParentRecordPendingParams): boolean {
  const isArriving = useWindowStore((state) =>
    parentTabId
      ? isParentRecordArriving(windowIdentifier, parentTabId, parentId, state.windows[windowIdentifier]?.tabs)
      : false
  );
  // The parent id whose wait ran out: a new parent id waits again
  const [releasedFor, setReleasedFor] = useState<string | null>(null);

  const hasParentRecord = Boolean(parentRecord?.id);
  const hasRealParentId = parentId !== "" && parentId !== NEW_RECORD_ID;
  const isPending = isArriving && hasRealParentId && !hasParentRecord && releasedFor !== parentId;

  useEffect(() => {
    if (!isPending) return;
    const timer = setTimeout(() => setReleasedFor(parentId), PARENT_RECORD_WAIT_MS);
    return () => clearTimeout(timer);
  }, [isPending, parentId]);

  return isPending;
}
