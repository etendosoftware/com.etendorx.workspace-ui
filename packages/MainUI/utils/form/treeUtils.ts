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

import type { EntityData } from "@workspaceui/api-client/src/api/types";

export interface TreeNode extends EntityData {
  depth: number;
  hasChildren: boolean;
}

/**
 * Transforms a flat array of records with parentId references into a
 * depth-annotated flat list suitable for rendering an indented tree dropdown.
 *
 * Root detection: a record is a root when its parentId is falsy OR
 * references an ID not present in the dataset (orphan).
 *
 * Walks depth-first so children appear directly after their parent.
 * Tracks visited nodes to prevent infinite loops from circular references.
 */
export function buildFlatTreeList(records: EntityData[]): TreeNode[] {
  if (records.length === 0) return [];

  const idSet = new Set(records.map((r) => r.id as string));
  const childrenMap = new Map<string, EntityData[]>();
  const roots: EntityData[] = [];

  for (const record of records) {
    const parentId = record.parentId as string | undefined;
    if (!parentId || !idSet.has(parentId)) {
      roots.push(record);
    } else {
      const siblings = childrenMap.get(parentId) ?? [];
      siblings.push(record);
      childrenMap.set(parentId, siblings);
    }
  }

  const result: TreeNode[] = [];
  const visited = new Set<string>();

  const walk = (nodes: EntityData[], depth: number) => {
    for (const node of nodes) {
      const nodeId = node.id as string;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const children = childrenMap.get(nodeId) ?? [];
      result.push({
        ...node,
        depth,
        hasChildren: children.length > 0,
      });
      if (children.length > 0) {
        walk(children, depth + 1);
      }
    }
  };

  walk(roots, 0);

  // Any unvisited records (from circular references) are added as roots
  for (const record of records) {
    if (!visited.has(record.id as string)) {
      result.push({ ...record, depth: 0, hasChildren: false });
    }
  }

  return result;
}

/** Returns the CSS class for a tree node label based on selectability and selection state. */
export function getNodeTextClass(selectable: boolean, isSelected: boolean): string {
  if (!selectable) return "font-semibold text-baseline-60";
  return isSelected ? "text-dynamic-dark font-medium" : "text-baseline-90";
}

/** Builds a Map<id, TreeNode> for O(1) parent lookups. */
export function buildNodeMap<T extends TreeNode>(nodes: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const node of nodes) map.set(node.id as string, node);
  return map;
}

/**
 * Filters tree nodes for search (keeping ancestor chain) or collapse state.
 * When searchTerm is provided, keeps matching nodes + their ancestors.
 * When no searchTerm, hides children of collapsed nodes.
 */
export function filterVisibleNodes<T extends TreeNode>(
  treeNodes: T[],
  nodeMap: Map<string, T>,
  searchTerm: string,
  collapsedNodes: Set<string>
): T[] {
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    const matchIds = new Set(
      treeNodes.filter((n) => (n._identifier as string).toLowerCase().includes(lowerSearch)).map((n) => n.id as string)
    );
    const keepIds = new Set(matchIds);
    for (const node of treeNodes) {
      if (matchIds.has(node.id as string)) {
        let current: T | undefined = node;
        while (current?.parentId && typeof current.parentId === "string") {
          keepIds.add(current.parentId as string);
          current = nodeMap.get(current.parentId as string);
        }
      }
    }
    return treeNodes.filter((n) => keepIds.has(n.id as string));
  }

  return treeNodes.filter((node) => {
    let parentId = node.parentId as string | undefined;
    while (parentId) {
      if (collapsedNodes.has(parentId)) return false;
      const parent = nodeMap.get(parentId);
      parentId = parent?.parentId as string | undefined;
    }
    return true;
  });
}
