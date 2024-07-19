import React, { useState } from 'react';
import IconButton from '../../IconButton';
import Search from '../../../assets/icons/search.svg';
import Filter from '../../../assets/icons/filter.svg';
import Columns from '../../../assets/icons/columns.svg';
import Preview from '../../../assets/icons/eye.svg';
import Details from '../../../assets/icons/list.svg';
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
import { MRT_TableInstance } from 'material-react-table';
import { Organization } from '../types';

interface RightSectionProps {
  table: MRT_TableInstance<Organization>;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const RightSection: React.FC<RightSectionProps> = ({
  table,
  isFullScreen,
  toggleFullScreen,
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
          tooltip="Search"
          onClick={e => setSearchAnchor(e.currentTarget)}
          width={16}
          height={16}>
          <Search />
        </IconButton>
        <IconButton
          tooltip="Views"
          width={16}
          height={16}
          onClick={toggleDensity}>
          <ChevronDown />
        </IconButton>
        <IconButton
          tooltip="Filter"
          width={16}
          height={16}
          onClick={() => console.log('Filter')}>
          <Filter />
        </IconButton>
        <IconButton
          tooltip="Columns"
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
          tooltip={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          width={16}
          height={16}
          onClick={toggleFullScreen}>
          <Preview />
        </IconButton>
        <IconButton
          tooltip="Details"
          onClick={() => console.log('Details')}
          width={16}
          height={16}>
          <Details />
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
            placeholder="Buscar..."
            onChange={e => handleSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ m: 1, width: '200px' }}
          />
        </Popover>
      </Box>
    </>
  );
};

export default RightSection;
