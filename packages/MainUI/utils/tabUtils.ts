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

/**
 * Checks if a parent column matches the parent tab's identifier
 * @param columnName - The column name from parentColumns (e.g., "business_partner_id", "invoice_id")
 * @param parentTableIdentifier - The parent tab's table identifier (e.g., "c_bpartner", "c_invoice")
 * @param parentEntityName - The parent tab's entity name (e.g., "BusinessPartner", "FinInvoice")
 * @returns true if the column matches the parent tab
 */
function matchesParentColumn(
  columnName: string,
  parentTableIdentifier: string | undefined,
  parentEntityName: string | undefined
): boolean {
  if (!parentTableIdentifier && !parentEntityName) {
    return false;
  }

  const normalizedColumn = normalizeIdentifier(columnName.replace(/_id$/i, ""));
  const normalizedTable = parentTableIdentifier ? normalizeIdentifier(parentTableIdentifier) : null;
  const normalizedEntity = parentEntityName ? normalizeIdentifier(parentEntityName) : null;

  const result = normalizedColumn === normalizedTable || normalizedColumn === normalizedEntity;

  if (result) return true;

  // Fuzzy match: underscore-agnostic and common Etendo naming diffs
  const fuzzyColumn = normalizedColumn.replace(/_/g, "");
  const fuzzyTable = normalizedTable?.replace(/_/g, "") || "";
  const fuzzyEntity = normalizedEntity?.replace(/_/g, "") || "";

  const fuzzyResult = fuzzyColumn === fuzzyTable || fuzzyColumn === fuzzyEntity;

  return fuzzyResult;
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

    if (hasMatch) {
      return true;
    }
  }

  // Fallback: If it's a Level-1 tab and we are at the root level,
  // and metadata is incomplete (missing linkage), show it anyway
  // if it's an active tab. This prevents "loss" of tabs due to
  // backend metadata context issues.
  if (tab.tabLevel === 1 && activeParentTab.tabLevel === 0) {
    // If we have no linkage but it's clearly a child level,
    // we default to showing it to avoid blank windows.
    return true;
  }

  return false;
}
