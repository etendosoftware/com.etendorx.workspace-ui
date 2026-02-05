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

/**
 * Normalizes a string to lowercase snake_case and removes common prefixes
 * @param str - The string to normalize
 * @returns Normalized string
 */
function normalizeIdentifier(str: string): string {
  if (!str) return "";
  const normalized = str
    // 1. Remove prefixes first
    .replace(/^(?:fin|c|m|ad|s)_/i, "")
    // 2. Handle CamelCase to snake_case properly
    .replace(/([A-Z])/g, (match, offset) => (offset > 0 && str[offset - 1] !== "_" ? "_" : "") + match.toLowerCase())
    .toLowerCase()
    // 3. Clean up
    .replace(/_{2,}/g, "_");

  // 4. Safe trim for underscores (prevents ReDoS warnings in SonarQube)
  let start = 0;
  while (start < normalized.length && normalized[start] === "_") {
    start++;
  }
  let end = normalized.length - 1;
  while (end >= start && normalized[end] === "_") {
    end--;
  }

  return normalized.substring(start, end + 1);
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

  const pTabId = tab.parentTabId || (tab as any).parentTab;
  if (pTabId) {
    const match = pTabId === activeParentTab.id;
    return match;
  }

  // Check parentColumns if they exist and have values
  if (tab.parentColumns && tab.parentColumns.length > 0) {
    const hasMatch = tab.parentColumns.some((parentColumn) => {
      const normalizedColumn = normalizeIdentifier(parentColumn.replace(/_id$/i, "")).replace(/_/g, "");
      const normalizedEntity = normalizeIdentifier(activeParentTab.entityName || "").replace(/_/g, "");
      const normalizedTable = normalizeIdentifier(activeParentTab.table$_identifier || "").replace(/_/g, "");

      // 1. Existing Naive Name Match
      if (
        normalizedColumn === normalizedEntity ||
        normalizedColumn === normalizedTable ||
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

    if (hasMatch) {
      return true;
    }

    // If we have parent columns but none matched, we explicitly return false
    // to avoid falling back to showing orphaned tabs.
    return false;
  }

  return false;
}
