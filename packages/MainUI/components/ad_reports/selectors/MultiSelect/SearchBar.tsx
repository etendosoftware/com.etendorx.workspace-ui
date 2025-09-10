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

import { Typography, Box, useTheme } from "@mui/material";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import { useStyle } from "@/components/Table/styles";
import { ICON_BUTTON_SIZE, ADD_BUTTON_TEXT } from "./constants";
import type { SearchBarProps } from "./types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

export const SearchBar: React.FC<SearchBarProps> = ({ readOnly, onClear, onOpen, hasItems }) => {
  const { sx } = useStyle();
  const theme = useTheme();

  const handleClear = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    onClear();
  };

  const searchBarStyles = {
    ...sx.searchBarBase,
    cursor: readOnly ? "default" : "pointer",
    opacity: readOnly ? 0.7 : 1,
    "&:hover": !readOnly
      ? {
          backgroundColor: theme.palette.baselineColor.neutral[10],
          color: theme.palette.baselineColor.neutral[100],
          background: theme.palette.baselineColor.neutral[30],
        }
      : undefined,
  };

  return (
    <Box onClick={() => !readOnly && onOpen()} sx={searchBarStyles} data-testid="Box__23a08a">
      <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} data-testid="SearchOutlined__23a08a" />
      <Typography data-testid="Typography__23a08a">{ADD_BUTTON_TEXT}</Typography>
      <IconButton onClick={handleClear} disabled={readOnly || !hasItems} data-testid="IconButton__23a08a">
        <CloseIcon fontSize={ICON_BUTTON_SIZE} data-testid="CloseIcon__23a08a" />
      </IconButton>
    </Box>
  );
};
