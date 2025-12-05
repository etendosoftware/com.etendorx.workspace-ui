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

import React, { useState } from "react";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import { useTranslation } from "@/hooks/useTranslation";
import type { MRT_Column } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

export type SummaryType = "min" | "max" | "count" | "sum" | "avg";

interface HeaderContextMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  column: MRT_Column<EntityData> | null;
  onSetSummary: (columnId: string, type: SummaryType) => void;
  onRemoveSummary: () => void;
  activeSummary: { columnId: string; type: SummaryType } | null;
}

export const HeaderContextMenu: React.FC<HeaderContextMenuProps> = ({
  anchorEl,
  onClose,
  column,
  onSetSummary,
  onRemoveSummary,
  activeSummary,
}) => {
  const { t } = useTranslation();
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<HTMLElement | null>(null);

  if (!column) return null;
  const columnId = column.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnDef = column.columnDef as any;
  const isNumeric = columnDef.type === "integer" || columnDef.type === "number" || columnDef.type === "quantity" || columnDef.type === "amount";

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
    onRemoveSummary();
    onClose();
  };

  const isSummaryActiveOnThisColumn = activeSummary?.columnId === columnId;

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} className="rounded-xl" data-testid="HeaderMenu__summary">
      <div className="rounded-2xl px-2 py-4">
        <div
          className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20) flex justify-between items-center relative"
          onMouseEnter={handleMouseEnterSubMenu}
          data-testid="set-summary-menu-item"
        >
          <span>{t("table.setSummaryFunction")}</span>
          
          {/* Sub-menu for summary functions */}
          <Menu
            anchorEl={subMenuAnchorEl}
            onClose={handleCloseSubMenu}
            className="rounded-xl ml-2"
          >
            <div className="rounded-2xl px-2 py-2" onMouseLeave={handleCloseSubMenu}>
              <div
                onClick={() => handleSetSummary("min")}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
              >
                {t("table.summary.min")}
              </div>
              <div
                onClick={() => handleSetSummary("max")}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
              >
                {t("table.summary.max")}
              </div>
              <div
                onClick={() => handleSetSummary("count")}
                className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
              >
                {t("table.summary.count")}
              </div>
              {isNumeric && (
                <>
                  <div
                    onClick={() => handleSetSummary("sum")}
                    className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                  >
                    {t("table.summary.sum")}
                  </div>
                  <div
                    onClick={() => handleSetSummary("avg")}
                    className="cursor-pointer rounded-lg p-2 transition hover:bg-(--color-baseline-20)"
                  >
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
            data-testid="remove-summary-menu-item"
          >
            {t("table.removeSummaryFunction")}
          </div>
        )}
      </div>
    </Menu>
  );
};
