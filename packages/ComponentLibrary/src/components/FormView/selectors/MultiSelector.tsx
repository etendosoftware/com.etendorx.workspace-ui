import React, { useCallback, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography, IconButton } from '@mui/material';
import SearchOutlined from '../../../assets/icons/search.svg';
import { useTheme } from '@mui/material';
import { MaterialReactTable, MRT_Row } from 'material-react-table';
import { useStyle } from '@workspaceui/mainui/components/Table/styles';
import CloseIcon from '../../../assets/icons/x.svg';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { SelectorTableProps, MultiSelectProps, TableData, Option } from '../types';

const SelectorTable: React.FC<SelectorTableProps> = ({ data, onRowClick, columns, title }) => {
  const { sx } = useStyle();

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableRowSelection
      enableMultiRowSelection={false}
      renderTopToolbarCustomActions={() => (
        <Box sx={{ margin: '0.5rem' }}>
          <Typography>{title}</Typography>
        </Box>
      )}
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => onRowClick(row),
        sx: sx.tableBody,
      })}
      muiTablePaperProps={{
        sx: sx.tablePaper,
      }}
      muiTableHeadCellProps={{
        sx: sx.tableHeadCell,
      }}
      muiTableBodyCellProps={{
        sx: sx.tableBodyCell,
      }}
      initialState={{ density: 'compact' }}
    />
  );
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  readOnly,
  title,
  entity,
  columns = [
    {
      header: 'ID',
      accessorKey: 'id',
    },
    {
      header: 'Name',
      accessorKey: '_identifier',
    },
  ],
}) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const { sx } = useStyle();

  const { records = [], loading } = useDatasource(entity);

  const tableData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return records as TableData[];
  }, [records]);

  const handleRowClick = useCallback(
    (row: MRT_Row<TableData>) => {
      const record = row.original;
      const option: Option = {
        id: String(record.id),
        title: String(record._identifier || record.name),
        value: String(record.id),
      };

      const exists = value.some(item => item.id === option.id);
      const newValue = exists ? value.filter(item => item.id !== option.id) : [...value, option];

      onChange(newValue);
    },
    [onChange, value],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange],
  );

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ flex: 1 }}>
        <Typography>{title}</Typography>
        <Box sx={sx.selectedContainer}>
          {value.map(item => (
            <Box key={item.id} sx={sx.selectedItem}>
              <Typography>{item.title}</Typography>
              <IconButton size="small" onClick={() => onChange(value.filter(i => i.id !== item.id))}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          {value.length === 0 && <Box sx={sx.emptyState}>No items selected</Box>}
        </Box>
      </Box>
      <Box
        onClick={() => !readOnly && setOpen(true)}
        sx={{
          ...sx.searchBar,
          cursor: readOnly ? 'default' : 'pointer',
          opacity: readOnly ? 0.7 : 1,
          '&:hover': {
            backgroundColor: readOnly ? 'transparent' : theme.palette.baselineColor.neutral[10],
            color: theme.palette.baselineColor.neutral[100],
            background: theme.palette.baselineColor.neutral[30],
          },
        }}>
        <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
        <Typography>Add</Typography>
        <IconButton
          size="small"
          onClick={handleClear}
          disabled={readOnly || value.length === 0}
          sx={{
            visibility: value.length > 0 ? 'visible' : 'hidden',
            background: theme.palette.baselineColor.neutral[10],
            '&:hover': {
              background: theme.palette.baselineColor.neutral[50],
            },
          }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent>
          <SelectorTable data={tableData} onRowClick={handleRowClick} columns={columns} title={title || ''} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiSelect;
