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

import { type Tab, UIPattern } from "@workspaceui/api-client/src/api/types";
import { getGridPageSize, getNumericPreference } from "@/utils/preferences/classicPreferences";

export interface TreeMetadata {
  supportsTreeMode: boolean;
  /** Datasource serving the tree nodes, as resolved by the metadata adapter. */
  treeEntity?: string;
  referencedTableId?: string;
  /** Whether nodes can be dragged and dropped (Classic `canReorderRecords`). */
  canMoveNodes: boolean;
}

const NO_TREE_METADATA: TreeMetadata = { supportsTreeMode: false, canMoveNodes: false };

/**
 * Single source of truth for tree mode: the metadata adapter emits `hasTree` and the tree
 * datasource only for tabs with a table tree configured (same criterion as the Classic UI).
 */
export const isTreeModeSupported = (tab?: Tab): boolean => tab?.hasTree === true && Boolean(tab.treeDatasourceId);

/**
 * Mirrors Classic `OBTreeGridComponent.canReorderRecords`: read-only trees and read-only tabs
 * cannot move nodes.
 */
export const canMoveTreeNodes = (tab: Tab): boolean =>
  tab.isReadOnlyTree !== true && tab.uIPattern !== UIPattern.READ_ONLY;

export const getTreeMetadata = (tab: Tab): TreeMetadata => {
  if (!isTreeModeSupported(tab)) {
    return NO_TREE_METADATA;
  }
  return {
    supportsTreeMode: true,
    treeEntity: tab.treeDatasourceId,
    referencedTableId: tab.tableId,
    canMoveNodes: canMoveTreeNodes(tab),
  };
};

/** Classic preference with the maximum number of nodes a tree request may return. */
export const TREE_FETCH_LIMIT_PREFERENCE = "TreeDatasourceFetchLimit";

/** Classic default of `TreeDatasourceFetchLimit`, the value the core ships at System level. */
export const DEFAULT_TREE_FETCH_LIMIT = 200;

/** Message classic shows when a tree request returns more nodes than the limit. */
export const TOO_MANY_NODES_MESSAGE = "OBUIAPP_TooManyNodes";

/** Error type of the tree datasource answer when the limit is exceeded (`TreeDatasourceService`). */
const TOO_MANY_NODES_ERROR = "tooManyNodes";

/**
 * Number of nodes a tree request asks for, as classic sends `_endRow = OB.Properties.TreeDatasourceFetchLimit`.
 *
 * @returns The `TreeDatasourceFetchLimit` preference, or its classic default
 */
export const getTreeFetchLimit = (): number =>
  getNumericPreference(TREE_FETCH_LIMIT_PREFERENCE, undefined, DEFAULT_TREE_FETCH_LIMIT);

/**
 * True when a tree datasource answer reports more nodes than `TreeDatasourceFetchLimit`
 * (`{ response: { status: -1, error: { type: "tooManyNodes" }, data: [] } }`).
 *
 * @param body - Body of the datasource answer
 */
export const isTooManyNodesResponse = (body: unknown): boolean => {
  const response = (body as { response?: { error?: { type?: string } } } | null)?.response;
  return response?.error?.type === TOO_MANY_NODES_ERROR;
};

/**
 * Records a grid request asks for: the tree fetch limit while the tab shows its tree, as classic does, and
 * the page size of the window (`dataPageSize`) otherwise.
 *
 * @param isTreeMode - Whether the tab shows its tree
 * @param windowId - AD window id of the tab
 */
export const getFetchPageSize = (isTreeMode: boolean, windowId?: string): number => {
  if (isTreeMode) {
    return getTreeFetchLimit();
  }
  return getGridPageSize(windowId);
};
