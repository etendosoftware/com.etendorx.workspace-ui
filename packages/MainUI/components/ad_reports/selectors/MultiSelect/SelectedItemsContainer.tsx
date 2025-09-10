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

import { Typography, Box } from "@mui/material";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useStyle } from "@/components/Table/styles";
import { ICON_BUTTON_SIZE } from "./constants";
import type { SelectedItemProps, SelectedItemsContainerProps } from "./types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

export const SelectedItem: React.FC<SelectedItemProps> = ({ item, onRemove }) => {
  const { sx } = useStyle();

  return (
    <Box key={item.id} sx={sx.selectedItem} data-testid="Box__229cfc">
      <Typography data-testid="Typography__229cfc">{item.title}</Typography>
      <IconButton onClick={() => onRemove(item.id)} data-testid="IconButton__229cfc">
        <CloseIcon fontSize={ICON_BUTTON_SIZE} data-testid="CloseIcon__229cfc" />
      </IconButton>
    </Box>
  );
};

export const SelectedItemsContainer: React.FC<SelectedItemsContainerProps> = ({ items, onRemove }) => {
  const { sx } = useStyle();

  return (
    <Box sx={sx.selectedContainer} data-testid="Box__229cfc">
      {items.map((item) => (
        <SelectedItem key={item.id} item={item} onRemove={onRemove} data-testid="SelectedItem__229cfc" />
      ))}
      {items.length === 0 && (
        <Box sx={sx.emptyState} data-testid="Box__229cfc">
          No items selected
        </Box>
      )}
    </Box>
  );
};
