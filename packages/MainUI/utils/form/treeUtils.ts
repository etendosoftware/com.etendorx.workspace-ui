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
