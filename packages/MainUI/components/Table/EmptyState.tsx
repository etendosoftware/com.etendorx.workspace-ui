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
import { useTranslation } from "@/hooks/useTranslation";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_TableInstance } from "material-react-table";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import PlusCircle from "@workspaceui/componentlibrary/src/assets/icons/plus-circle.svg";

const EmptyState = ({
  table,
  maxWidth,
  onContextMenu,
  onInsertRow,
}: {
  table?: MRT_TableInstance<EntityData>;
  maxWidth?: number;
  onContextMenu?: (event: React.MouseEvent) => void;
  onInsertRow?: () => void;
}) => {
  const { t } = useTranslation();
  maxWidth = table?.refs.tableContainerRef.current?.clientWidth ?? maxWidth;

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-8 flex-1 min-h-0 w-full"
      style={{ maxWidth }}
      onContextMenu={onContextMenu}>
      <div className="w-16 h-8 text-gray-300 pointer-events-none" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2 pointer-events-none">{t("table.labels.emptyRecords")}</h3>
      <p className="text-sm text-gray-500 mb-4 pointer-events-none">{t("status.noRecords")}</p>

      {onInsertRow && (
        <Button
          variant="filled"
          style={{ maxWidth: "15rem" }}
          startIcon={<PlusCircle fill="white" data-testid="PlusCircle__empty-state" />}
          onClick={onInsertRow}
          data-testid="Button__insert-row-empty-state">
          {t("table.actions.createRecordInGrid")}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
