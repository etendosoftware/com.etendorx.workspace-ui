import React, { useState } from 'react';
import IconButton from '../../IconButton';
import Search from '../../../assets/icons/search.svg';
import Filter from '../../../assets/icons/filter.svg';
import Columns from '../../../assets/icons/columns.svg';
import Sidebar from '../../../assets/icons/sidebar.svg';
import LowerFlap from '../../../assets/icons/lower-flap.svg';
import ChevronDown from '../../../assets/icons/chevrons-down.svg';
import {
  Box,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
  Popover,
} from '@mui/material';
import { theme } from '../../../theme';
import { TOOLTIPS, PLACEHOLDERS } from '../tableConstants';
import { RightSectionProps } from '../../../../../storybook/src/stories/Components/Table/types';

const RightSection: React.FC<RightSectionProps> = ({
  table,
  isDropdownOpen,
  toggleDropdown,
  searchPlaceholder = PLACEHOLDERS.SEARCH,
}) => {
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);

  const handleSearch = (value: string) => {
    table.setGlobalFilter(value);
  };

  const toggleDensity = () => {
    table.setDensity(
      table.getState().density === 'compact' ? 'comfortable' : 'compact',
    );
  };

  return (
    <>
      <Box
        sx={{
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
          borderRadius: '10rem',
          display: 'flex',
          padding: '0.25rem',
          marginLeft: '0.25rem',
          gap: '0.25rem',
        }}>
        <IconButton
          tooltip={TOOLTIPS.SEARCH}
          onClick={e => setSearchAnchor(e.currentTarget)}
          width={16}
          height={16}>
          <Search />
        </IconButton>
        <IconButton
          tooltip={TOOLTIPS.VIEWS}
          width={16}
          height={16}
          onClick={toggleDensity}>
          <ChevronDown />
        </IconButton>
        <IconButton tooltip={TOOLTIPS.FILTER} width={16} height={16}>
          <Filter />
        </IconButton>
        <IconButton
          tooltip={TOOLTIPS.COLUMNS}
          width={16}
          height={16}
          onClick={e => setColumnMenuAnchor(e.currentTarget)}>
          <Columns />
        </IconButton>
      </Box>
      <Box
        sx={{
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
          borderRadius: '10rem',
          display: 'flex',
          padding: '0.25rem',
          marginLeft: '0.25rem',
          gap: '0.25rem',
        }}>
        <IconButton
          tooltip={
            isDropdownOpen ? TOOLTIPS.EXIT_FULL_SCREEN : TOOLTIPS.FULL_SCREEN
          }
          width={16}
          height={16}
          onClick={toggleDropdown}
          fill={
            isDropdownOpen
              ? theme.palette.baselineColor.neutral[0]
              : theme.palette.baselineColor.neutral[80]
          }
          hoverFill={
            isDropdownOpen
              ? theme.palette.baselineColor.neutral[20]
              : theme.palette.baselineColor.neutral[0]
          }
          sx={{
            ...(isDropdownOpen && {
              backgroundColor: theme.palette.dynamicColor.main,
              '&: hover': {
                background: theme.palette.baselineColor.neutral[80],
              },
            }),
          }}>
          <Sidebar />
        </IconButton>
        <IconButton tooltip={TOOLTIPS.DETAILS} width={16} height={16}>
          <LowerFlap />
        </IconButton>
        {/* Columns menu */}
        <Menu
          anchorEl={columnMenuAnchor}
          open={Boolean(columnMenuAnchor)}
          onClose={() => setColumnMenuAnchor(null)}>
          {table
            .getAllLeafColumns()
            .filter(column => column.id !== 'mrt-row-select')
            .map(column => (
              <MenuItem
                key={column.id}
                onClick={() => column.toggleVisibility()}
                disabled={column.id === 'mrt-row-select'}>
                <Checkbox
                  checked={column.getIsVisible()}
                  disabled={column.id === 'mrt-row-select'}
                />
                <ListItemText primary={column.columnDef.header} />
              </MenuItem>
            ))}
        </Menu>
        {/* Search Popover */}
        <Popover
          open={Boolean(searchAnchor)}
          anchorEl={searchAnchor}
          onClose={() => setSearchAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}>
          <TextField
            autoFocus
            placeholder={searchPlaceholder}
            onChange={e => handleSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ m: 1, width: '12.5rem' }}
          />
        </Popover>
      </Box>
    </>
  );
};

export default RightSection;
