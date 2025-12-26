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
  columns: any[];
  onEditRow?: () => void;
  onInsertRow?: () => void;
  onNewRecord?: () => void;
  canEdit?: boolean;
  isRowEditing?: boolean;
  areFiltersDisabled?: boolean;
}

interface FilterValues {
  filterId: string;
  filterValue: string | number;
  filterLabel: string;
}

const convertBooleanToFilterValues = (cellValue: unknown): FilterValues => {
  const boolValue = String(cellValue).toLowerCase();
  return {
    filterId: boolValue,
    filterValue: boolValue,
    filterLabel: boolValue === "true" ? "Yes" : "No",
  };
};

const extractListFilterValues = (
  cellValue: unknown,
  columnMetadata: any,
  isYesNoColumn: boolean
): FilterValues | null => {
  const searchValue = typeof cellValue === "boolean" ? String(cellValue).toLowerCase() : String(cellValue);
  const listOption = columnMetadata?.refList?.find((opt: any) => opt.value === searchValue);

  if (listOption) {
    return {
      filterId: listOption.id,
      filterValue: listOption.value,
      filterLabel: listOption.label,
    };
  }

  if (isYesNoColumn && typeof cellValue === "boolean") {
    return convertBooleanToFilterValues(cellValue);
  }

  return {
    filterId: String(cellValue),
    filterValue: cellValue as string | number,
    filterLabel: String(cellValue),
  };
};

const extractReferenceFilterValues = (cellValue: unknown, rowData: EntityData, columnDataKey: string): FilterValues => {
  const identifierKey = `${columnDataKey}$_identifier`;
  const recordId = String(cellValue);
  const identifier = String(rowData[identifierKey]);

  return {
    filterId: recordId,
    filterValue: identifier,
    filterLabel: identifier,
  };
};

const extractObjectFilterValues = (cellValue: { id: string; _identifier?: string }): FilterValues => {
  return {
    filterId: cellValue.id,
    filterValue: cellValue._identifier || cellValue.id,
    filterLabel: cellValue._identifier || cellValue.id,
  };
};

const extractPrimitiveFilterValues = (cellValue: unknown): FilterValues => {
  const cellValueStr = String(cellValue);
  const isDateTime = /^\d{4}-\d{2}-\d{2}T/.test(cellValueStr);

  if (isDateTime) {
    const dateOnly = cellValueStr.split("T")[0];
    return {
      filterId: dateOnly,
      filterValue: dateOnly,
      filterLabel: dateOnly,
    };
  }

  return {
    filterId: cellValueStr,
    filterValue: cellValue as string | number,
    filterLabel: cellValueStr,
  };
};

export const CellContextMenu: React.FC<CellContextMenuProps> = ({
  anchorEl,
  onClose,
  cell,
  row,
  onFilterByValue,
  columns,
  onEditRow,
  onInsertRow,
  onNewRecord,
  canEdit = false,
  isRowEditing = false,
  areFiltersDisabled = false,
}) => {
  const { t } = useTranslation();

  const isEmptyTableMenu = !row && !cell;

  const handleUseAsFilter = () => {
    if (!cell || !row) return;

    const columnId = cell.column.id;
    const rowData = row.original;
    const columnDataKey = (cell.column.columnDef as ExtendedColumnDef)?.columnName || columnId;
    const cellValue = rowData[columnDataKey];

    const columnMetadata = columns.find((col) => col.id === columnId || col.columnName === columnDataKey);
    const isBooleanColumn = columnMetadata?.type === "boolean";
    const isYesNoColumn = columnMetadata?.column?._identifier === "YesNo";

    let filterValues: FilterValues;

    if (isBooleanColumn && !isYesNoColumn) {
      filterValues = convertBooleanToFilterValues(cellValue);
    } else if (isYesNoColumn || (columnMetadata?.refList && Array.isArray(columnMetadata.refList))) {
      filterValues =
        extractListFilterValues(cellValue, columnMetadata, isYesNoColumn) || extractPrimitiveFilterValues(cellValue);
    } else if (rowData[`${columnDataKey}$_identifier`]) {
      filterValues = extractReferenceFilterValues(cellValue, rowData, columnDataKey);
    } else if (cellValue && typeof cellValue === "object" && "id" in cellValue) {
      filterValues = extractObjectFilterValues(cellValue as { id: string; _identifier?: string });
    } else {
      filterValues = extractPrimitiveFilterValues(cellValue);
    }

    onFilterByValue(columnId, filterValues.filterId, filterValues.filterValue, filterValues.filterLabel);
    onClose();
  };

  const handleEditRow = () => {
    if (onEditRow) {
      onEditRow();
      onClose();
    }
  };

  const handleInsertRow = () => {
    if (onInsertRow) {
      onInsertRow();
      onClose();
    }
  };

  const handleNewRecord = () => {
    if (onNewRecord) {
      onNewRecord();
      onClose();
    }
  };

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl" data-testid="Menu__704a8f">
      <div className="rounded-2xl px-2 py-4">
        {isEmptyTableMenu ? (
          // Menu for empty table background
          canEdit && (
            <>
              <div
                onClick={handleInsertRow}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleInsertRow();
                  }
                }}
                data-testid="insert-row-menu-item">
                {t("table.insertRow")}
              </div>
              {onNewRecord && (
                <div
                  onClick={handleNewRecord}
                  className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNewRecord();
                    }
                  }}
                  data-testid="new-record-menu-item">
                  {t("table.newRecord")}
                </div>
              )}
            </>
          )
        ) : (
          // Menu for clicking on a row
          <>
            {canEdit && !isRowEditing && (
              <>
                <div
                  onClick={handleEditRow}
                  className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleEditRow();
                    }
                  }}
                  data-testid="edit-row-menu-item">
                  {t("table.editRow")}
                </div>
                <div
                  onClick={handleInsertRow}
                  className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleInsertRow();
                    }
                  }}
                  data-testid="insert-row-menu-item">
                  {t("table.insertRow")}
                </div>
                {!areFiltersDisabled && <div className="border-t border-(--color-transparent-neutral-30) my-2" />}
              </>
            )}
            {!areFiltersDisabled && (
              <div
                onClick={handleUseAsFilter}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleUseAsFilter();
                  }
                }}
                data-testid="use-as-filter-menu-item">
                {t("table.useAsFilter")}
              </div>
            )}
          </>
        )}
      </div>
    </Menu>
  );
};
