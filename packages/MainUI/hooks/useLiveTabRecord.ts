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

import { useMemo } from "react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";
import { mergeDefinedValues } from "@/utils/expressions/mergeLiveValues";

/**
 * Selected record of a tab with the unsaved values its form is showing on top.
 *
 * Live values are only applied when they were published for that same record, so values of
 * a previous record or of a new one never leak into the evaluation.
 *
 * @param tab - Tab whose form may be publishing live values.
 * @param record - Persisted record currently selected in that tab.
 * @returns The record overlaid with its live values, or the record as-is when there are none.
 */
export function useLiveTabRecord(
  tab: Tab | null | undefined,
  record: EntityData | undefined
): Record<string, unknown> | undefined {
  const windowIdentifier = useCurrentWindowIdentifier();
  const liveEntry = useLiveTabValuesStore((state) => {
    if (!windowIdentifier || !tab) {
      return undefined;
    }
    return state.entries[windowIdentifier]?.[tab.id];
  });

  return useMemo(() => {
    if (!record || liveEntry?.recordId !== String(record.id)) {
      return record;
    }
    return mergeDefinedValues(record, liveEntry.values);
  }, [record, liveEntry]);
}
