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
