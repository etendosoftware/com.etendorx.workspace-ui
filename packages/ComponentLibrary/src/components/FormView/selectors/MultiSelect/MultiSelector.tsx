import React, { useCallback, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { MaterialReactTable, MRT_Row } from 'material-react-table';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { SelectorTableProps, MultiSelectProps, TableData, Option } from '../../types';
import { useStyle } from '@workspaceui/mainui/components/Table/styles';
import { DEFAULT_COLUMNS, TABLE_INITIAL_STATE, DIALOG_PROPS } from './constants';
import { SelectedItemsContainer } from './SelectedItemsContainer';
import { SearchBar } from './SearchBar';

const SelectorTable: React.FC<SelectorTableProps> = ({ data, onRowClick, columns, title }) => {
  const { sx } = useStyle();

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableRowSelection
      enableMultiRowSelection={false}
      renderTopToolbarCustomActions={() => (
        <Box sx={sx.titleContainer}>
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
      initialState={TABLE_INITIAL_STATE}
    />
  );
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  readOnly,
  title,
  entity,
  columns = DEFAULT_COLUMNS,
}) => {
  const [open, setOpen] = useState(false);
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

  const handleRemoveItem = useCallback(
    (id: string) => {
      onChange(value.filter(item => item.id !== id));
    },
    [onChange, value],
  );

  const handleClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={sx.multiSelectContainer}>
      <Box sx={sx.contentContainer}>
        <Typography>{title}</Typography>
        <SelectedItemsContainer items={value} onRemove={handleRemoveItem} />
      </Box>
      <SearchBar readOnly={readOnly} onClear={handleClear} onOpen={() => setOpen(true)} hasItems={value.length > 0} />
      <Dialog open={open} onClose={() => setOpen(false)} {...DIALOG_PROPS}>
        <DialogContent sx={sx.dialogContent}>
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
