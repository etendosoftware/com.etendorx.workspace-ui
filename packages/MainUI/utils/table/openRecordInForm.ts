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
 * @fileoverview Shared "open a grid record in form view" transition.
 *
 * The tab grid hands a record over to the form view from three different places: the row double
 * click, the Enter shortcut and the actions column "open form" button. All three must behave
 * identically, and all three must leave the grid row selected so that coming back to the grid keeps
 * the record highlighted. This module holds that logic as a single React free, dependency injected
 * function so the entry points cannot drift apart and the behaviour can be unit tested without
 * rendering the table.
 */

import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";

/**
 * Delay before the parent tab's graph selection is re-applied.
 *
 * Opening a record clears the graph selection of the tab's descendants, and the surrounding store
 * cascade can transiently drop the parent tab's own selection; re-applying it on a later macrotask
 * restores it once that cascade has settled.
 */
export const PARENT_SELECTION_RESTORE_DELAY_MS = 10;

/**
 * Minimal selection-graph surface used by this module. Keeps it decoupled from the concrete `Graph`
 * implementation, which satisfies this shape structurally.
 */
export interface RecordNavigationGraph {
  getParent: (tab?: Tab) => Tab | undefined;
  getSelected: (tab?: Tab) => EntityData | undefined;
  setSelected: (tab?: Tab, record?: EntityData) => void;
  setSelectedMultiple: (tab?: Tab, records?: EntityData[]) => void;
}

export interface OpenRecordInFormParams {
  /** Record to open. Must belong to the dataset the grid is currently rendering. */
  record: EntityData;
  /** Tab that owns the grid. */
  tab: Tab;
  /** Selection graph shared by every tab of the window. */
  graph: RecordNavigationGraph;
  /** Identifier of the window instance, undefined while it is not resolved yet. */
  windowIdentifier: string | undefined;
  /** Non reactive window-store getter for the selected record id of a tab. */
  getSelectedRecord: (windowIdentifier: string, tabId: string) => string | undefined;
  /** Applies the visual single row selection in the grid, replacing any previous selection. */
  selectRow: (recordId: string) => void;
  /** Switches the tab to form view for the given record id. */
  setRecordId: (recordId: string) => void;
}

/**
 * Normalizes a record id to the string form used by the grid row ids and by the window store.
 *
 * @param record - Record whose id has to be resolved
 * @returns The id as a string, or an empty string when the record carries no usable id
 */
export const resolveRecordId = (record: EntityData): string => {
  const rawId = record?.id;
  if (rawId === undefined || rawId === null) {
    return "";
  }
  return String(rawId);
};

/**
 * Tells whether a child tab is missing the parent selection it needs to open a record.
 *
 * A child tab can only open a record while its parent tab has one selected: without it the form has
 * no parent context and the navigation is rejected downstream anyway. Root tabs are never blocked.
 *
 * @param parent - Parent tab, undefined for a root tab
 * @param windowIdentifier - Identifier of the window instance
 * @param getSelectedRecord - Window-store getter for the selected record id of a tab
 * @returns True when the navigation must be blocked
 */
export const isParentSelectionMissing = (
  parent: Tab | undefined,
  windowIdentifier: string | undefined,
  getSelectedRecord: (windowIdentifier: string, tabId: string) => string | undefined
): boolean => {
  if (!parent) {
    return false;
  }
  if (!windowIdentifier) {
    return true;
  }
  return !getSelectedRecord(windowIdentifier, parent.id);
};

/**
 * Selects the record in the grid and then opens it in form view.
 *
 * The order of operations is the point of this function: the grid selection is applied first so
 * that grid, selection graph and window store all end up pointing at the same record within a
 * single React batch, and the navigation is triggered last. Selecting first is what keeps the row
 * highlighted when the user returns to the grid, and what prevents a previously clicked row from
 * staying highlighted instead of the one that was opened.
 *
 * @param params - Record to open plus the collaborators needed to apply the transition
 * @returns True when the navigation was performed, false when it was blocked because the record has
 *          no usable id or because a child tab has no parent selection
 */
export const openRecordInForm = ({
  record,
  tab,
  graph,
  windowIdentifier,
  getSelectedRecord,
  selectRow,
  setRecordId,
}: OpenRecordInFormParams): boolean => {
  const recordId = resolveRecordId(record);
  if (!recordId) {
    return false;
  }

  const parent = graph.getParent(tab);
  if (isParentSelectionMissing(parent, windowIdentifier, getSelectedRecord)) {
    return false;
  }

  // Read before writing: selecting this tab's record clears its descendants, so the parent has to
  // be restored with the selection it held before this transition started.
  const parentSelection = parent ? graph.getSelected(parent) : undefined;

  selectRow(recordId);
  graph.setSelected(tab, record);
  graph.setSelectedMultiple(tab, [record]);

  if (parent && parentSelection) {
    setTimeout(() => graph.setSelected(parent, parentSelection), PARENT_SELECTION_RESTORE_DELAY_MS);
  }

  setRecordId(recordId);
  return true;
};
