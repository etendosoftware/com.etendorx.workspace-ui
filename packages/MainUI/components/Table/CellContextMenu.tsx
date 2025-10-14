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
import type { MRT_Row, MRT_Cell } from "material-react-table";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import { useTranslation } from "@/hooks/useTranslation";

interface ExtendedColumnDef {
  columnName?: string;
  [key: string]: unknown;
}

interface CellContextMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  cell: MRT_Cell<EntityData> | null;
  row: MRT_Row<EntityData> | null;
  onFilterByValue: (columnId: string, filterId: string, filterValue: string | number, filterLabel: string) => void;
  columns: any[]; // Array of column definitions with metadata
}

export const CellContextMenu: React.FC<CellContextMenuProps> = ({
  anchorEl,
  onClose,
  cell,
  row,
  onFilterByValue,
  columns,
}) => {
  const { t } = useTranslation();

  const handleUseAsFilter = () => {
    if (!cell || !row) return;

    const columnId = cell.column.id;
    const rowData = row.original;

    // Get the actual column name (camelCase) from the column definition
    // Use columnName which contains the actual data key in camelCase format
    const columnDataKey = (cell.column.columnDef as ExtendedColumnDef)?.columnName || columnId;

    // Try to get the value using the column name
    const cellValue = rowData[columnDataKey];

    // Find the column metadata to check if it's a LIST or BOOLEAN type
    const columnMetadata = columns.find((col) => col.id === columnId || col.columnName === columnDataKey);
    const isBooleanColumn = columnMetadata?.type === "boolean";
    const isYesNoColumn = columnMetadata?.column?._identifier === "YesNo";
    const hasRefList = columnMetadata?.refList && Array.isArray(columnMetadata.refList);

    let filterValue: string | number;
    let filterLabel: string;
    let filterId: string;

    // Check if this is a pure BOOLEAN field (not YesNo reference)
    if (isBooleanColumn && !isYesNoColumn) {
      // For pure boolean fields, use "true" or "false" as string for both id and value
      const boolValue = String(cellValue).toLowerCase(); // Convert to "true" or "false"
      filterId = boolValue;
      filterValue = boolValue;
      filterLabel = boolValue === "true" ? "Yes" : "No"; // This will be overridden by translation in the UI
    } else if (isYesNoColumn || (columnMetadata?.refList && Array.isArray(columnMetadata.refList))) {
      // For YesNo columns or LIST fields, find the matching option in refList by value
      // Convert boolean values to lowercase string for matching (true -> "true", false -> "false")
      const searchValue = typeof cellValue === "boolean" ? String(cellValue).toLowerCase() : String(cellValue);
      const listOption = columnMetadata?.refList?.find((opt: any) => opt.value === searchValue);

      if (listOption) {
        filterId = listOption.id; // Use the list item ID for matching
        filterValue = listOption.value; // Use the value for filtering
        filterLabel = listOption.label; // Use the label for display
      } else {
        // Fallback if not found in refList - for YesNo fields without refList, use same logic as boolean
        if (isYesNoColumn && typeof cellValue === "boolean") {
          const boolValue = String(cellValue).toLowerCase();
          filterId = boolValue;
          filterValue = boolValue;
          filterLabel = boolValue === "true" ? "Yes" : "No";
        } else {
          filterId = String(cellValue);
          filterValue = cellValue as string | number;
          filterLabel = String(cellValue);
        }
      }
    } else if (rowData[`${columnDataKey}$_identifier`]) {
      // This is a reference field (TableDir/Search)
      // For reference fields:
      // - id: the UUID of the referenced record (used in availableOptions)
      // - value: the label/identifier (used for filtering in the backend)
      // - label: the label/identifier (displayed in the UI)
      const identifierKey = `${columnDataKey}$_identifier`;
      const recordId = String(cellValue); // The UUID from businessPartner field
      const identifier = String(rowData[identifierKey]); // The display name

      filterId = recordId; // UUID for matching in availableOptions
      filterValue = identifier; // Label for backend filtering
      filterLabel = identifier; // Label for display
    } else if (cellValue && typeof cellValue === "object" && "id" in cellValue) {
      // Handle reference objects (with id and _identifier)
      const refObject = cellValue as { id: string; _identifier?: string };
      filterId = refObject.id;
      filterValue = refObject._identifier || refObject.id;
      filterLabel = refObject._identifier || refObject.id;
    } else {
      // Handle primitive values (including dates)
      const cellValueStr = String(cellValue);

      // Check if this is a date/datetime field (ISO format with T or timezone)
      // Examples: "2025-09-19T14:22:17-03:00" or "2025-09-19T14:22:17Z"
      const isDateTime = /^\d{4}-\d{2}-\d{2}T/.test(cellValueStr);

      if (isDateTime) {
        // Extract only the date part (YYYY-MM-DD)
        const dateOnly = cellValueStr.split("T")[0];
        filterId = dateOnly;
        filterValue = dateOnly;
        filterLabel = dateOnly;
      } else {
        filterId = cellValueStr;
        filterValue = cellValue as string | number;
        filterLabel = cellValueStr;
      }
    }

    onFilterByValue(columnId, filterId, filterValue, filterLabel);
    onClose();
  };

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl" data-testid="Menu__704a8f">
      <div className="rounded-2xl px-2 py-4">
        <div
          onClick={handleUseAsFilter}
          className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleUseAsFilter();
            }
          }}>
          {t("table.useAsFilter")}
        </div>
      </div>
    </Menu>
  );
};
