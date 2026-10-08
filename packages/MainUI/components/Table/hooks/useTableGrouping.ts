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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MRT_ExpandedState, MRT_SortingState, MRT_Updater } from "material-react-table";
import type { Column, EntityData } from "@workspaceui/api-client/src/api/types";
import { useLanguage } from "@/contexts/language";
import { useTranslation } from "@/hooks/useTranslation";
import {
  GROUP_BY_LABEL,
  GROUPING_TRANSLATION_KEYS,
  MAX_GROUPING_REACHED_LABEL,
  UNGROUP_LABEL,
  buildFirstGroupExpandedState,
  exceedsGroupingLimit,
  getActiveGroupColumnId,
  getGroupingMaxRecords,
  isGroupingEnabled,
  resolveGroupingLabel,
} from "@/utils/table/grouping";

const NO_GROUPING: string[] = [];

interface UseTableGroupingParams {
  /** AD window id, used to resolve the grouping preferences. */
  windowId?: string;
  /** Data columns of the grid. */
  columns: Column[];
  /** Stored grouping state of the tab. */
  grouping: string[];
  setGrouping: (grouping: string[]) => void;
  setSorting: (sorting: MRT_SortingState) => void;
  /** Records loaded in the grid. */
  records: EntityData[];
  loading: boolean;
  shouldUseTreeMode: boolean;
  /** Whether the grid can be regrouped (false while rows have unsaved inline edits). */
  canChangeGrouping: () => boolean;
  /** Shows the "too many records" message. */
  showWarning: (message: string) => void;
}

export interface UseTableGroupingReturn {
  /** Column the grid is grouped by, if any. */
  groupedColumnId?: string;
  /** MRT grouping state (empty when grouping is not active). */
  activeGrouping: string[];
  /** Whether the "Group by" option can be offered. */
  isGroupingAvailable: boolean;
  groupExpanded: MRT_ExpandedState;
  handleGroupExpandedChange: (updater: MRT_Updater<MRT_ExpandedState>) => void;
  groupBy: (columnId: string) => void;
  ungroup: () => void;
  getGroupByLabel: (title: string) => string;
  getUngroupLabel: () => string;
}

const findColumnField = (columns: Column[], columnId: string): string =>
  columns.find((column) => column.id === columnId)?.columnName ?? columnId;

/**
 * Grid grouping state and rules, mirroring classic `ob-view-grid.js` `groupBy` / `clearGroupBy`:
 * a single grouped column, sorted by it, first group opened when the grouping changes and grouping
 * cleared (with the classic message) when the loaded records exceed the limit.
 */
export const useTableGrouping = ({
  windowId,
  columns,
  grouping,
  setGrouping,
  setSorting,
  records,
  loading,
  shouldUseTreeMode,
  canChangeGrouping,
  showWarning,
}: UseTableGroupingParams): UseTableGroupingReturn => {
  const { getLabel } = useLanguage();
  const { t } = useTranslation();
  const [groupExpanded, setGroupExpanded] = useState<MRT_ExpandedState>({});
  // Records shown when the grouping changed: the first group is opened once newer records arrive.
  const pendingFirstGroupRef = useRef<EntityData[] | null>(null);

  const groupedColumnId = getActiveGroupColumnId(grouping, windowId, shouldUseTreeMode);
  const isGroupingAvailable = !shouldUseTreeMode && isGroupingEnabled(windowId);
  const maxRecords = getGroupingMaxRecords(windowId);
  const activeGrouping = useMemo(() => (groupedColumnId ? [groupedColumnId] : NO_GROUPING), [groupedColumnId]);

  const getGroupByLabel = useCallback(
    (title: string) => resolveGroupingLabel(getLabel, t, GROUP_BY_LABEL, GROUPING_TRANSLATION_KEYS.GROUP_BY, { title }),
    [getLabel, t]
  );
  const getUngroupLabel = useCallback(
    () => resolveGroupingLabel(getLabel, t, UNGROUP_LABEL, GROUPING_TRANSLATION_KEYS.UNGROUP),
    [getLabel, t]
  );

  const groupBy = useCallback(
    (columnId: string) => {
      if (!canChangeGrouping()) {
        return;
      }
      setSorting([{ id: columnId, desc: false }]);
      setGrouping([columnId]);
    },
    [canChangeGrouping, setGrouping, setSorting]
  );

  const ungroup = useCallback(() => {
    if (!canChangeGrouping()) {
      return;
    }
    setGrouping(NO_GROUPING);
  }, [canChangeGrouping, setGrouping]);

  const handleGroupExpandedChange = useCallback((updater: MRT_Updater<MRT_ExpandedState>) => {
    setGroupExpanded((previous) => (typeof updater === "function" ? updater(previous) : updater));
  }, []);

  // Grouping changed: collapse everything and wait for the regrouped data to open its first group.
  // biome-ignore lint/correctness/useExhaustiveDependencies: records are captured only when the grouping changes
  useEffect(() => {
    setGroupExpanded({});
    pendingFirstGroupRef.current = groupedColumnId ? records : null;
  }, [groupedColumnId]);

  useEffect(() => {
    if (!groupedColumnId || loading) {
      return;
    }
    if (exceedsGroupingLimit(records.length, maxRecords)) {
      setGrouping(NO_GROUPING);
      showWarning(
        resolveGroupingLabel(getLabel, t, MAX_GROUPING_REACHED_LABEL, GROUPING_TRANSLATION_KEYS.MAX_GROUPING_REACHED, {
          count: maxRecords,
        })
      );
      return;
    }
    const pendingRecords = pendingFirstGroupRef.current;
    if (!pendingRecords || pendingRecords === records || records.length === 0) {
      return;
    }
    pendingFirstGroupRef.current = null;
    setGroupExpanded(
      buildFirstGroupExpandedState(groupedColumnId, records[0], findColumnField(columns, groupedColumnId))
    );
  }, [groupedColumnId, loading, records, maxRecords, columns, setGrouping, showWarning, getLabel, t]);

  return {
    groupedColumnId,
    activeGrouping,
    isGroupingAvailable,
    groupExpanded,
    handleGroupExpandedChange,
    groupBy,
    ungroup,
    getGroupByLabel,
    getUngroupLabel,
  };
};
