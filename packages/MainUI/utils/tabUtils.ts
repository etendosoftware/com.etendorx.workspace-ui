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
  return (
    str
      // Convert camelCase to snake_case (must be done before lowercasing)
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      // Remove common table prefixes
      .replace(/^(fin|c|m|ad|s)_/, "")
      // Remove leading/trailing underscores
      .replace(/^_/, "")
      .replace(/_$/, "")
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

  const normalizedColumn = normalizeIdentifier(columnName.replace(/_id$/, "")); // Remove _id suffix
  const normalizedTable = parentTableIdentifier ? normalizeIdentifier(parentTableIdentifier) : null;
  const normalizedEntity = parentEntityName ? normalizeIdentifier(parentEntityName) : null;

  return normalizedColumn === normalizedTable || normalizedColumn === normalizedEntity;
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

  // Check parentColumns if they exist and have values
  if (tab.parentColumns && tab.parentColumns.length > 0) {
    return tab.parentColumns.some((column) =>
      matchesParentColumn(column, activeParentTab.table$_identifier, activeParentTab.entityName)
    );
  }

  // If no parentTabId and no parentColumns, don't show the tab
  // This indicates no relationship is defined between the tab and the parent
  return false;
}
