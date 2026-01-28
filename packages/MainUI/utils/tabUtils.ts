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

import type { Tab } from "@workspaceui/api-client/src/api/types";

export interface TabWithParentInfo extends Tab {
  parentTabId?: string;
  column?: string;
  active?: boolean;
}

export function shouldShowTab(tab: TabWithParentInfo, activeParentTab: Tab | null): boolean {
  if (tab.tabLevel === 0) {
    return true;
  }

  if (!activeParentTab) {
    return false;
  }

  if (tab.active === false) {
    return false;
  }

  if (tab.parentTabId) {
    return tab.parentTabId === activeParentTab.id;
  }

  if (tab.parentColumns && tab.parentColumns.length > 0) {
    const parentEntityLower = activeParentTab.entityName?.toLowerCase() || "";
    const parentTableName = activeParentTab.table$_identifier?.toLowerCase() || "";

    const hasMatch = tab.parentColumns.some((parentColumn) => {
      const columnLower = parentColumn.toLowerCase();

      const normalizedColumn = columnLower.replace(/_id$/, "").replace(/[_-]/g, "");

      const normalizedEntity = parentEntityLower
        .replace(/^(fin|mgmt|financial|management)/gi, "")
        .replace(/([A-Z])/g, (p1, offset) => (offset > 0 ? `_${p1}` : p1))
        .toLowerCase()
        .replace(/[_-]/g, "");

      const normalizedTable = parentTableName.replace(/^c_/, "").replace(/[_-]/g, "");

      // 1. Existing Naive Name Match
      if (
        normalizedColumn.includes(normalizedEntity) ||
        normalizedEntity.includes(normalizedColumn) ||
        normalizedColumn.includes(normalizedTable) ||
        normalizedTable.includes(normalizedColumn)
      ) {
        return true;
      }

      // 2. Metadata-based Match (Fields)
      // If the property name (e.g., "agent") doesn't match the entity (e.g., "etcop_app"),
      // check the field definition to see if it points to that entity.
      if (tab.fields && tab.fields[parentColumn]) {
        const field = tab.fields[parentColumn];

        // Check Referenced Entity
        if (field.referencedEntity && activeParentTab.entityName) {
          if (field.referencedEntity.toLowerCase() === activeParentTab.entityName.toLowerCase()) {
            return true;
          }
        }

        // Check DB Column Name (backup)
        if (field.columnName) {
          const normDBCol = field.columnName.toLowerCase().replace(/_id$/, "").replace(/[_-]/g, "");
          if (
            normDBCol.includes(normalizedEntity) ||
            normalizedEntity.includes(normDBCol) ||
            normDBCol.includes(normalizedTable) ||
            normalizedTable.includes(normDBCol)
          ) {
            return true;
          }
        }
      }

      return false;
    });

    if (!hasMatch) {
      return false;
    }
    return true;
  }

  return false;
}
