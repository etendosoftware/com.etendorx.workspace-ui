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

    return tab.parentColumns.some((parentColumn) => {
      const columnLower = parentColumn.toLowerCase();

      const normalizedColumn = columnLower.replace(/_id$/, "").replace(/[_-]/g, "");

      const normalizedEntity = parentEntityLower
        .replace(/^(fin|mgmt|financial|management)/gi, "")
        .replace(/([A-Z])/g, (p1, offset) => (offset > 0 ? `_${p1}` : p1))
        .toLowerCase()
        .replace(/[_-]/g, "");

      const normalizedTable = parentTableName.replace(/^c_/, "").replace(/[_-]/g, "");

      return (
        normalizedColumn.includes(normalizedEntity) ||
        normalizedEntity.includes(normalizedColumn) ||
        normalizedColumn.includes(normalizedTable) ||
        normalizedTable.includes(normalizedColumn)
      );
    });
  }

  return false;
}