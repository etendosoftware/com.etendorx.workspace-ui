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
import { useState } from "react";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import { useTranslation } from "@/hooks/useTranslation";
import type { MRT_Column } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

export type SummaryType = "min" | "max" | "count" | "sum" | "avg";

const NUMERIC_COLUMN_TYPES: readonly string[] = ["integer", "number", "quantity", "amount"];
const BASE_SUMMARY_TYPES: SummaryType[] = ["min", "max", "count"];
const ALL_SUMMARY_TYPES: SummaryType[] = [...BASE_SUMMARY_TYPES, "sum", "avg"];

/** Whether a column holds numbers, so it also accepts the sum and average summary functions. */
export const isNumericSummaryColumn = (columnDef: { type?: string }): boolean =>
  NUMERIC_COLUMN_TYPES.includes(columnDef.type ?? "");

/** Summary functions a column accepts. */
export const getSummaryTypes = (columnDef: { type?: string }): SummaryType[] => {
  if (isNumericSummaryColumn(columnDef)) {
    return ALL_SUMMARY_TYPES;
  }
  return BASE_SUMMARY_TYPES;
};

const MENU_ITEM_CLASS_NAME =
  "w-full text-left bg-transparent border-0 cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)";

/** Grouping actions offered by the column menus (classic "Group by ‹column›" / "Ungroup"). */
export interface GroupingMenuActions {
  /** Column the grid is currently grouped by, if any. */
  groupedColumnId?: string;
  getGroupByLabel: (title: string) => string;
  getUngroupLabel: () => string;
  onGroupBy: (columnId: string) => void;
  onUngroup: () => void;
}

/** Grouping actions for a given column of the header context menu. */
export interface HeaderGroupingOptions extends GroupingMenuActions {
  /** Whether the right-clicked column can be used to group the grid. */
  canGroupBy: boolean;
}

/**
 * Like classic, "Group by" is hidden for the column the grid is already grouped by,
 * and "Ungroup" is offered whenever the grid is grouped.
 */
export const getGroupingMenuVisibility = (columnId: string, grouping: HeaderGroupingOptions) => ({
  showGroupBy: grouping.canGroupBy && grouping.groupedColumnId !== columnId,
  showUngroup: Boolean(grouping.groupedColumnId),
});

interface GroupingMenuItemsProps {
  columnId: string;
  title: string;
  grouping: HeaderGroupingOptions;
  onClose: () => void;
}

/** "Group by ‹column›" / "Ungroup" items of the header context menu. */
const GroupingMenuItems = ({ columnId, title, grouping, onClose }: GroupingMenuItemsProps) => {
  const { showGroupBy, showUngroup } = getGroupingMenuVisibility(columnId, grouping);

  const handleGroupBy = () => {
    grouping.onGroupBy(columnId);
    onClose();
  };

  const handleUngroup = () => {
    grouping.onUngroup();
    onClose();
  };

  return (
    <>
      {showGroupBy && (
        <button type="button" onClick={handleGroupBy} className={MENU_ITEM_CLASS_NAME} data-testid="group-by-menu-item">
          {grouping.getGroupByLabel(title)}
        </button>
      )}
      {showUngroup && (
        <button type="button" onClick={handleUngroup} className={MENU_ITEM_CLASS_NAME} data-testid="ungroup-menu-item">
          {grouping.getUngroupLabel()}
        </button>
      )}
    </>
  );
};

interface HeaderContextMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  column: MRT_Column<EntityData> | null;
  onSetSummary: (columnId: string, type: SummaryType) => void;
  onRemoveSummary: (columnId: string) => void;
  activeSummary: Record<string, SummaryType>;
  grouping?: HeaderGroupingOptions;
}

export const HeaderContextMenu: React.FC<HeaderContextMenuProps> = ({
  anchorEl,
  onClose,
  column,
  onSetSummary,
  onRemoveSummary,
  activeSummary,
  grouping,
}) => {
  const { t } = useTranslation();
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<HTMLElement | null>(null);

  if (!column) return null;
  const columnId = column.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnDef = column.columnDef as { type?: string };
  const isNumeric = isNumericSummaryColumn(columnDef);

  const handleMouseEnterSubMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSubMenuAnchorEl(event.currentTarget);
  };

  const handleCloseSubMenu = () => {
    setSubMenuAnchorEl(null);
  };

  const handleSetSummary = (type: SummaryType) => {
    onSetSummary(columnId, type);
    handleCloseSubMenu();
    onClose();
  };

  const handleRemoveSummary = () => {
    onRemoveSummary(columnId);
    onClose();
  };

  const isSummaryActiveOnThisColumn = Boolean(activeSummary[columnId]);

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl" data-testid="HeaderMenu__summary">
      <div className="rounded-2xl px-2 py-4">
        <div
          className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20) flex justify-between items-center relative"
          onMouseEnter={handleMouseEnterSubMenu}
          data-testid="set-summary-menu-item">
          <span>{t("table.setSummaryFunction")}</span>

          {/* Sub-menu for summary functions */}
          <Menu
            anchorEl={subMenuAnchorEl}
            onClose={handleCloseSubMenu}
            className="rounded-xl ml-2"
            data-testid="Menu__3c9781">
            <div className="rounded-2xl px-2 py-2" onMouseLeave={handleCloseSubMenu}>
              <div
                onClick={() => handleSetSummary("min")}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)">
                {t("table.summary.min")}
              </div>
              <div
                onClick={() => handleSetSummary("max")}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)">
                {t("table.summary.max")}
              </div>
              <div
                onClick={() => handleSetSummary("count")}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)">
                {t("table.summary.count")}
              </div>
              {isNumeric && (
                <>
                  <div
                    onClick={() => handleSetSummary("sum")}
                    className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)">
                    {t("table.summary.sum")}
                  </div>
                  <div
                    onClick={() => handleSetSummary("avg")}
                    className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)">
                    {t("table.summary.avg")}
                  </div>
                </>
              )}
            </div>
          </Menu>
        </div>

        {isSummaryActiveOnThisColumn && (
          <div
            onClick={handleRemoveSummary}
            className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
            data-testid="remove-summary-menu-item">
            {t("table.removeSummaryFunction")}
          </div>
        )}

        {grouping && (
          <GroupingMenuItems
            columnId={columnId}
            title={String(column.columnDef.header ?? columnId)}
            grouping={grouping}
            onClose={onClose}
          />
        )}
      </div>
    </Menu>
  );
};
