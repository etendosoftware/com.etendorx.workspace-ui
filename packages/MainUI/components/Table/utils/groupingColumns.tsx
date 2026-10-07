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

import type React from "react";
import type { MRT_Cell, MRT_Row, MRT_TableInstance } from "material-react-table";
import type { Column, EntityData } from "@workspaceui/api-client/src/api/types";
import ChevronUp from "../../../../ComponentLibrary/src/assets/icons/chevron-up.svg";
import ChevronDown from "../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import type { SummaryType } from "../HeaderContextMenu";
import { aggregateSummary, getGroupDisplayValue, getGroupingValue } from "@/utils/table/grouping";

/** CSS class of group header rows. */
export const GROUP_ROW_CLASS_NAME = "table-row-group";
const ICON_SIZE = 12;
const ICON_COLOR = "#3F4A7E";
const MAX_SUBTOTAL_FRACTION_DIGITS = 2;

interface GroupCellProps {
  cell: MRT_Cell<EntityData>;
  row: MRT_Row<EntityData>;
}

const getColumnField = (cell: MRT_Cell<EntityData>): string => {
  const columnDef = cell.column.columnDef as { columnName?: string };
  return columnDef.columnName ?? cell.column.id;
};

/**
 * Group header cell of the grouped column: expand/collapse toggle, group value and record count.
 */
export const GroupedCell = ({ cell, row }: GroupCellProps): React.ReactNode => {
  const isExpanded = row.getIsExpanded();
  const Icon = isExpanded ? ChevronUp : ChevronDown;
  return (
    <div className="flex items-center gap-2 font-semibold" data-testid="grouped-cell">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          row.toggleExpanded();
        }}
        aria-expanded={isExpanded}
        className="bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center min-w-5 min-h-5 rounded-full"
        data-testid="grouped-cell-toggle">
        <Icon height={ICON_SIZE} width={ICON_SIZE} fill={ICON_COLOR} data-testid="grouped-cell-icon" />
      </button>
      <span>{getGroupDisplayValue(row.original, getColumnField(cell))}</span>
      <span>({row.subRows?.length ?? 0})</span>
    </div>
  );
};

/**
 * Group header cell of a column with a summary function: the group subtotal.
 */
export const AggregatedCell = ({ cell }: Pick<GroupCellProps, "cell">): React.ReactNode => {
  const value = cell.getValue();
  if (typeof value !== "number") {
    return null;
  }
  return (
    <span className="font-semibold" data-testid="aggregated-cell">
      {value.toLocaleString(undefined, { maximumFractionDigits: MAX_SUBTOTAL_FRACTION_DIGITS })}
    </span>
  );
};

export interface GroupingColumnOptions {
  /** Column the grid is grouped by, if any. */
  groupedColumnId?: string;
  /** Summary function set on the column, if any. */
  summaryType?: SummaryType;
}

/**
 * Column definition props that make a data column work in a grouped grid:
 * - MRT's own "Group by" menu item is disabled (grouping is driven from the header context menu);
 * - records are grouped by the raw value (id for foreign keys) and the header shows the identifier;
 * - the grouped column is locked (cannot be hidden or reordered while grouped);
 * - a summary function becomes the group subtotal (classic `showGroupSummaryInHeader`).
 *
 * @param column - Data column
 * @param options - Current grouping and summary of the column
 */
export const getGroupingColumnProps = (column: Column, { groupedColumnId, summaryType }: GroupingColumnOptions) => {
  const field = column.columnName;
  const props: Record<string, unknown> = {
    enableGrouping: false,
    getGroupingValue: (record: EntityData) => getGroupingValue(record, field),
    GroupedCell,
  };

  if (column.id === groupedColumnId) {
    props.enableHiding = false;
    props.enableColumnOrdering = false;
    props.enableColumnDragging = false;
  }

  if (summaryType) {
    props.aggregationFn = (_columnId: string, leafRows: MRT_Row<EntityData>[]) =>
      aggregateSummary(
        summaryType,
        leafRows.map((row) => row.original),
        field
      );
    props.AggregatedCell = AggregatedCell;
  }

  return props;
};

/**
 * Body row props of a group header row: clicking it only expands/collapses the group
 * (it is not a record, so it is never selected nor opened in the form).
 *
 * @param row - Group header row
 * @param table - Table instance
 */
export const getGroupRowProps = (row: MRT_Row<EntityData>, table: MRT_TableInstance<EntityData>) => ({
  onClick: row.getToggleExpandedHandler(),
  className: GROUP_ROW_CLASS_NAME,
  row,
  table,
});
