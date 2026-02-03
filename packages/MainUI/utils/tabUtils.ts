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
  return (
    str
      // 1. Remove prefixes first
      .replace(/^(fin|c|m|ad|s)_/i, "")
      // 2. Handle CamelCase to snake_case properly
      .replace(/([A-Z])/g, (match, offset) => (offset > 0 && str[offset - 1] !== "_" ? "_" : "") + match.toLowerCase())
      .toLowerCase()
      // 3. Clean up
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "")
  );
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

  const fuzzyResult = 
    fuzzyColumn === fuzzyTable || 
    fuzzyColumn === fuzzyEntity;

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
    const hasMatch = tab.parentColumns.some((column) => {
      return matchesParentColumn(column, activeParentTab.table$_identifier, activeParentTab.entityName);
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
