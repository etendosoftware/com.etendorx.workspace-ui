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
import type { MRT_TableInstance, MRT_RowData, MRT_DefinedColumnDef } from "material-react-table";
import { useTranslation } from "@/hooks/useTranslation";
import { useMemo, useState, useCallback } from "react";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import DragModalContent from "@workspaceui/componentlibrary/src/components/DragModal/DragModalContent";
export interface CustomColumnDef<TData extends MRT_RowData = MRT_RowData> extends MRT_DefinedColumnDef<TData> {
  showInGridView?: boolean;
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

  // Convert table columns to ToggleableItem format
  const columnItems = useMemo<ToggleableItem[]>(() => {
    return table
      .getAllLeafColumns()
      .filter((column) => column.columnDef.enableHiding !== false)
      .map((column) => {
        const colDef = column.columnDef as CustomColumnDef;
        const shouldBeVisible = colDef.showInGridView ?? true;

        if (column.getIsVisible() !== shouldBeVisible) {
          column.toggleVisibility(shouldBeVisible);
        }

        return {
          id: column.id,
          label: typeof colDef.header === "string" ? colDef.header : column.id,
          isActive: shouldBeVisible,
        };
      });
  }, [table]);

  const [items, setItems] = useState<ToggleableItem[]>(columnItems);

  // Update items when columns change
  useMemo(() => {
    setItems(columnItems);
  }, [columnItems]);

  const handleBack = useCallback(() => {
    onClose();
  }, [onClose]);

  // Sync changes back to the table when items change
  useMemo(() => {
    for (const item of items) {
      const column = table.getAllLeafColumns().find((col) => col.id === item.id);
      if (column && column.getIsVisible() !== item.isActive) {
        column.toggleVisibility();
      }
    }
  }, [items, table]);

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="w-80">
      <DragModalContent
        items={items}
        setItems={setItems}
        onBack={handleBack}
        backButtonText={t("common.close")}
        activateAllText={t("navigation.waterfall.activateAll")}
        deactivateAllText={t("navigation.waterfall.deactivateAll")}
        buttonText={t("table.tooltips.columns")}
      />
    </Menu>
  );
};

export default ColumnVisibilityMenu;
