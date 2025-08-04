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

import { FilterAlt, FilterAltOff } from "@mui/icons-material";
import useStyle from "./styles";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "@/hooks/useTranslation";
import { useCallback, useMemo } from "react";
import type { MRT_TableInstance } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

export default function TopToolbar({
  filterActive,
  toggleFilter,
  table,
}: {
  filterActive: boolean;
  toggleFilter: () => void;
  table: MRT_TableInstance<EntityData>;
}) {
  const styles = useStyle();
  const { t } = useTranslation();
  const label = t(filterActive ? "table.tooltips.implicitFilterOn" : "table.tooltips.implicitFilterOff");
  const rowSelection = table.getState().rowSelection;
  const selectedCount = useMemo(() => Object.keys(rowSelection).length, [rowSelection]);
  const selectionLabel = t(selectedCount === 1 ? "table.selection.single" : "table.selection.multiple");
  const handleClearSelection = useCallback(() => table.setRowSelection({}), [table]);

  return (
    <div className="flex justify-between items-center border-b border-b-transparent-neutral-10">
      <div>
        {selectedCount > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" pl={1}>
            <Chip label={`${selectedCount} ${selectionLabel}`} color="primary" />
            <Button size="small" onClick={handleClearSelection} variant="outlined">
              {t("common.clear")}
            </Button>
          </Stack>
        )}
      </div>
      <Box sx={styles.container} onClick={toggleFilter} className="cursor-pointer">
        <Typography aria-label={label}>{label}</Typography>
        {filterActive ? <FilterAlt sx={styles.icon} /> : <FilterAltOff sx={styles.icon} />}
      </Box>
    </div>
  );
}
