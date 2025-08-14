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

import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Autocomplete,
  Chip,
  CircularProgress,
  Box,
  InputAdornment,
} from "@mui/material";
import { FilterList as FilterIcon } from "@mui/icons-material";
import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  ColumnFilterUtils,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";

export interface ColumnFilterDropdownProps {
  column: Column;
  selectedOptions: FilterOption[];
  availableOptions: FilterOption[];
  loading: boolean;
  onSelectionChange: (selectedOptions: FilterOption[]) => void;
  onSearchChange?: (searchQuery: string) => void;
  placeholder?: string;
  maxHeight?: number;
}

export const ColumnFilterDropdown: React.FC<ColumnFilterDropdownProps> = ({
  column,
  selectedOptions,
  availableOptions,
  loading,
  onSelectionChange,
  onSearchChange,
  placeholder,
  maxHeight = 300,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const isTableDir = ColumnFilterUtils.isTableDirColumn(column);

  // For tabledir columns, debounce the search
  useEffect(() => {
    if (!isTableDir || !onSearchChange) return;

    const timeoutId = setTimeout(() => {
      if (inputValue.trim() !== "") {
        onSearchChange(inputValue.trim());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, isTableDir, onSearchChange]);

  // Filter options based on input for select columns
  const filteredOptions = useMemo(() => {
    if (isTableDir) {
      return availableOptions; // For tabledir, filtering is done server-side
    }

    if (!inputValue) return availableOptions;

    return availableOptions.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [availableOptions, inputValue, isTableDir]);

  const handleOpen = () => {
    setOpen(true);
    // For tabledir columns, load initial options if not loaded
    if (isTableDir && availableOptions.length === 0 && onSearchChange) {
      onSearchChange("");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setInputValue("");
  };

  const getOptionLabel = (option: FilterOption | string) => {
    if (typeof option === "string") return option;
    return option.label;
  };

  const isOptionEqualToValue = (option: FilterOption, value: FilterOption) => {
    return option.id === value.id;
  };

  const renderTags = (tagValue: FilterOption[], getTagProps: any) => {
    return tagValue.map((option, index) => (
      <Chip
        {...getTagProps({ index })}
        key={option.id}
        label={option.label}
        size="small"
        variant="outlined"
        color="primary"
      />
    ));
  };

  const renderInput = (params: any) => (
    <TextField
      {...params}
      placeholder={placeholder || `Filter ${column.name || column.columnName}...`}
      size="small"
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <FilterIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: (
          <React.Fragment>
            {loading ? <CircularProgress color="inherit" size={16} /> : null}
            {params.InputProps.endAdornment}
          </React.Fragment>
        ),
      }}
      sx={{
        minWidth: 200,
        "& .MuiOutlinedInput-root": {
          fontSize: "0.875rem",
        },
      }}
    />
  );

  const renderOption = (props: any, option: FilterOption, { selected }: any) => (
    <li {...props} key={option.id}>
      <Box
        component="span"
        sx={{
          fontWeight: selected ? "600" : "400",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {option.label}
        {selected && (
          <Box component="span" sx={{ ml: "auto", color: "primary.main" }}>
            ✓
          </Box>
        )}
      </Box>
    </li>
  );

  const noOptionsText = useMemo(() => {
    if (loading) return "Loading...";
    if (isTableDir && inputValue && inputValue.length < 2) {
      return "Type at least 2 characters to search";
    }
    return "No options found";
  }, [loading, isTableDir, inputValue]);

  return (
    <Autocomplete
      multiple
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      value={selectedOptions}
      onChange={(_, newValue) => {
        onSelectionChange(newValue as FilterOption[]);
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={filteredOptions}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderTags={renderTags}
      renderInput={renderInput}
      renderOption={renderOption}
      noOptionsText={noOptionsText}
      loading={loading}
      loadingText="Loading options..."
      disableCloseOnSelect
      size="small"
      ListboxProps={{
        style: { maxHeight },
      }}
      sx={{
        minWidth: 250,
        "& .MuiAutocomplete-popupIndicator": {
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        },
      }}
      componentsProps={{
        popper: {
          placement: "bottom-start",
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                altAxis: true,
                altBoundary: true,
                tether: false,
                padding: 8,
              },
            },
          ],
        },
      }}
    />
  );
};