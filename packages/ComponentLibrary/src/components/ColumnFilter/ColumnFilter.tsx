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

import React from "react";
import { Box, IconButton, Badge, Popover, Typography, Button, Divider, Stack } from "@mui/material";
import { FilterList as FilterIcon, Clear as ClearIcon } from "@mui/icons-material";
import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  ColumnFilterUtils,
  type ColumnFilterState,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { ColumnFilterDropdown } from "./ColumnFilterDropdown";

export interface ColumnFilterProps {
  column: Column;
  filterState?: ColumnFilterState;
  onFilterChange: (selectedOptions: FilterOption[]) => void;
  onLoadOptions?: (searchQuery?: string) => void;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({ column, filterState, onFilterChange, onLoadOptions }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  if (!ColumnFilterUtils.supportsDropdownFilter(column)) {
    return null;
  }

  const isOpen = Boolean(anchorEl);
  const hasActiveFilter = filterState && filterState.selectedOptions.length > 0;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClearFilter = (event: React.MouseEvent) => {
    event.stopPropagation();
    onFilterChange([]);
    handleClose();
  };

  const handleSearchChange = (searchQuery: string) => {
    if (onLoadOptions) {
      onLoadOptions(searchQuery);
    }
  };

  const getFilterSummary = () => {
    if (!hasActiveFilter) return "";

    const count = filterState?.selectedOptions.length || 0;
    if (count === 1) {
      return filterState?.selectedOptions[0].label || "";
    }
    return `${count} selected`;
  };

  return (
    <>
      <Badge
        badgeContent={hasActiveFilter ? filterState?.selectedOptions.length || 0 : 0}
        color="primary"
        invisible={!hasActiveFilter}
        sx={{
          "& .MuiBadge-badge": {
            fontSize: "0.625rem",
            minWidth: "16px",
            height: "16px",
          },
        }}>
        <IconButton
          size="small"
          onClick={handleClick}
          color={hasActiveFilter ? "primary" : "default"}
          sx={{
            padding: "2px",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}>
          <FilterIcon fontSize="small" />
        </IconButton>
      </Badge>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            minWidth: 300,
            maxWidth: 500,
            padding: 2,
            boxShadow: 3,
          },
        }}>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight="600">
              Filter: {column.name || column.columnName}
            </Typography>
            {hasActiveFilter && (
              <IconButton size="small" onClick={handleClearFilter} color="error">
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {hasActiveFilter && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current filter: {getFilterSummary()}
              </Typography>
            </Box>
          )}

          <ColumnFilterDropdown
            column={column}
            selectedOptions={filterState?.selectedOptions || []}
            availableOptions={filterState?.availableOptions || []}
            loading={filterState?.loading || false}
            onSelectionChange={onFilterChange}
            onSearchChange={ColumnFilterUtils.isTableDirColumn(column) ? handleSearchChange : undefined}
          />

          {hasActiveFilter && (
            <>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {filterState?.selectedOptions.length || 0} filter(s) applied
                </Typography>
                <Button size="small" variant="text" color="error" onClick={handleClearFilter} startIcon={<ClearIcon />}>
                  Clear
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </Popover>
    </>
  );
};
