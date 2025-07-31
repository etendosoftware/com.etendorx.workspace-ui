"use client";

import type { ToggleableItem } from "@workspaceui/componentlibrary/src/components/DragModal/DragModal.types";
import type { MRT_TableInstance, MRT_RowData } from "material-react-table";
import { useTranslation } from "@/hooks/useTranslation";
import { useMemo, useState, useCallback } from "react";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import DragModalContent from "@workspaceui/componentlibrary/src/components/DragModal/DragModalContent";

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
      .map((column) => ({
        id: column.id,
        label: typeof column.columnDef.header === "string" ? column.columnDef.header : column.id,
        isActive: column.getIsVisible(),
      }));
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
