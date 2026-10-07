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
import { Divider, Menu, MenuItem } from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import { MRT_ActionMenuItem, type MRT_Column, type MRT_TableInstance } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { useTranslation } from "@/hooks/useTranslation";
import { canGroupByColumn } from "@/utils/table/grouping";
import {
  type GroupingMenuActions,
  type SummaryType,
  getGroupingMenuVisibility,
  getSummaryTypes,
} from "./HeaderContextMenu";

type Column = MRT_Column<EntityData>;
type Table = MRT_TableInstance<EntityData>;

/** Arguments MRT passes to `renderColumnActionsMenuItems`. */
export interface ColumnActionsMenuArgs {
  closeMenu: () => void;
  column: Column;
  internalColumnMenuItems: React.ReactNode[];
  table: Table;
}

/** Summary and grouping actions shared with the header context menu. */
export interface ColumnActionsMenuOptions {
  activeSummary: Record<string, SummaryType>;
  onSetSummary: (columnId: string, type: SummaryType) => void;
  onRemoveSummary: (columnId: string) => void;
  /** Present only when the window enables grouping. */
  grouping?: GroupingMenuActions;
}

interface MenuItemProps {
  column: Column;
  table: Table;
  closeMenu: () => void;
}

/** "Set summary function" item with its sub menu of summary functions (same choices as the header context menu). */
const SummaryActionMenuItem = ({
  column,
  table,
  closeMenu,
  onSetSummary,
}: MenuItemProps & Pick<ColumnActionsMenuOptions, "onSetSummary">) => {
  const { t } = useTranslation();
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenSubMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setSubMenuAnchorEl(event.currentTarget);
  };

  const handleSelect = (type: SummaryType) => {
    onSetSummary(column.id, type);
    setSubMenuAnchorEl(null);
    closeMenu();
  };

  return (
    <>
      <MRT_ActionMenuItem
        icon={<FunctionsIcon />}
        label={t("table.setSummaryFunction")}
        onClick={handleOpenSubMenu}
        onOpenSubMenu={handleOpenSubMenu}
        table={table}
        data-testid="column-actions-set-summary"
      />
      <Menu
        anchorEl={subMenuAnchorEl}
        open={Boolean(subMenuAnchorEl)}
        onClose={() => setSubMenuAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        data-testid="column-actions-summary-submenu">
        {getSummaryTypes(column.columnDef as { type?: string }).map((type) => (
          <MenuItem key={type} onClick={() => handleSelect(type)} data-testid={`column-actions-summary-${type}`}>
            {t(`table.summary.${type}`)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

/** "Remove summary function" item. */
const RemoveSummaryActionMenuItem = ({
  column,
  table,
  closeMenu,
  onRemoveSummary,
}: MenuItemProps & Pick<ColumnActionsMenuOptions, "onRemoveSummary">) => {
  const { t } = useTranslation();
  const { ClearAllIcon } = table.options.icons;
  return (
    <MRT_ActionMenuItem
      icon={<ClearAllIcon />}
      label={t("table.removeSummaryFunction")}
      onClick={() => {
        onRemoveSummary(column.id);
        closeMenu();
      }}
      table={table}
      data-testid="column-actions-remove-summary"
    />
  );
};

/** "Group by ‹column›" / "Ungroup" items, following the same rules as the header context menu. */
const buildGroupingMenuItems = (
  { column, table, closeMenu }: MenuItemProps,
  grouping: GroupingMenuActions
): React.ReactNode[] => {
  const { showGroupBy, showUngroup } = getGroupingMenuVisibility(column.id, {
    ...grouping,
    canGroupBy: canGroupByColumn(column.columnDef),
  });
  const { DynamicFeedIcon } = table.options.icons;
  const items: React.ReactNode[] = [];

  if (showGroupBy) {
    items.push(
      <MRT_ActionMenuItem
        key="etendo-group-by"
        icon={<DynamicFeedIcon />}
        label={grouping.getGroupByLabel(String(column.columnDef.header ?? column.id))}
        onClick={() => {
          grouping.onGroupBy(column.id);
          closeMenu();
        }}
        table={table}
        data-testid="column-actions-group-by"
      />
    );
  }
  if (showUngroup) {
    items.push(
      <MRT_ActionMenuItem
        key="etendo-ungroup"
        icon={<DynamicFeedIcon />}
        label={grouping.getUngroupLabel()}
        onClick={() => {
          grouping.onUngroup();
          closeMenu();
        }}
        table={table}
        data-testid="column-actions-ungroup"
      />
    );
  }
  return items;
};

/**
 * Items of the column actions ("3 dots") menu: MRT's own items followed by the summary and grouping
 * actions also offered by the header context menu.
 *
 * @param args - Arguments MRT passes to `renderColumnActionsMenuItems`
 * @param options - Summary state/handlers and grouping actions
 */
export const buildColumnActionsMenuItems = (
  { closeMenu, column, internalColumnMenuItems, table }: ColumnActionsMenuArgs,
  { activeSummary, onSetSummary, onRemoveSummary, grouping }: ColumnActionsMenuOptions
): React.ReactNode[] => {
  const itemProps = { column, table, closeMenu };
  const items: React.ReactNode[] = [
    ...internalColumnMenuItems,
    <Divider key="etendo-divider" />,
    <SummaryActionMenuItem key="etendo-set-summary" {...itemProps} onSetSummary={onSetSummary} />,
  ];

  if (activeSummary[column.id]) {
    items.push(
      <RemoveSummaryActionMenuItem key="etendo-remove-summary" {...itemProps} onRemoveSummary={onRemoveSummary} />
    );
  }
  if (grouping) {
    items.push(...buildGroupingMenuItems(itemProps, grouping));
  }
  return items;
};
