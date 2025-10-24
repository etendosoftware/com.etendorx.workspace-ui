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

"use client";

import type { ToggleableItem } from "@workspaceui/componentlibrary/src/components/DragModal/DragModal.types";
import type { MRT_TableInstance, MRT_RowData, MRT_DefinedColumnDef, MRT_VisibilityState } from "material-react-table";
import { useTranslation } from "@/hooks/useTranslation";
import { useState, useCallback, useEffect } from "react";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import DragModalContent from "@workspaceui/componentlibrary/src/components/DragModal/DragModalContent";
import { useTabContext } from "@/contexts/tab";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import { isEmptyObject } from "@/utils/commons";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

export interface CustomColumnDef<TData extends MRT_RowData = MRT_RowData> extends MRT_DefinedColumnDef<TData> {
  showInGridView?: boolean;
  shownInStatusBar?: boolean;
  displayed?: boolean;
  type?: string;
  fieldId?: string;
}
interface ColumnVisibilityMenuProps<T extends MRT_RowData = MRT_RowData> {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  table: MRT_TableInstance<T>;
}

const ColumnVisibilityMenu = <T extends MRT_RowData = MRT_RowData>({
  anchorEl,
  onClose,
  table,
}: ColumnVisibilityMenuProps<T>) => {
  const { t } = useTranslation();
  const { tab } = useTabContext();
  const { activeWindow } = useMultiWindowURL();
  const { tableColumnVisibility } = useTableStatePersistenceTab(activeWindow?.window_identifier || "", tab.id);

  const [items, setItems] = useState<ToggleableItem[]>([]);

  const handleBack = useCallback(() => {
    onClose();
  }, [onClose]);

  // Initialize items state based on table columns and visibility state
  useEffect(() => {
    if (isEmptyObject(tableColumnVisibility) || items.length > 0) return;
    const visibleColumns = table
      .getAllLeafColumns()
      .filter((column) => {
        if (column.id.startsWith("mrt-")) {
          return false;
        }
        const colDef = column.columnDef as CustomColumnDef;

        if (colDef?.fieldId?.startsWith("audit_")) {
          return true;
        }

        if (colDef.shownInStatusBar) {
          return true;
        }
        if (colDef.displayed === false && !colDef.showInGridView) {
          return false;
        }

        if (colDef.type === "button") {
          return false;
        }

        return true;
      })
      .map((column) => {
        const isCurrentlyVisible = column.getIsVisible();

        return {
          id: column.id,
          label: typeof column.columnDef.header === "string" ? column.columnDef.header : column.id,
          isActive: isCurrentlyVisible,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    setItems(visibleColumns);
  }, [items, table, tableColumnVisibility]);

  // Sync changes back to the table when items change
  useEffect(() => {
    // Get the current visibility state from the table
    const currentVisibilityState = table.getState().columnVisibility;

    // Build a new visibility state object, preserving columns not in the menu
    const newVisibilityState: MRT_VisibilityState = { ...currentVisibilityState };

    // Update only the columns that are in the menu
    for (const item of items) {
      newVisibilityState[item.id] = item.isActive;
    }

    // Set the column visibility state for the entire table at once
    table.setColumnVisibility(newVisibilityState);
  }, [items, table]);

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="w-80" data-testid="Menu__6630cd">
      <DragModalContent
        items={items}
        setItems={setItems}
        onBack={handleBack}
        backButtonText={t("common.close")}
        activateAllText={t("navigation.waterfall.activateAll")}
        deactivateAllText={t("navigation.waterfall.deactivateAll")}
        buttonText={t("table.tooltips.columns")}
        data-testid="DragModalContent__6630cd"
      />
    </Menu>
  );
};

export default ColumnVisibilityMenu;
