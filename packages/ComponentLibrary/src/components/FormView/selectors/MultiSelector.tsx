import React, { useCallback, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton } from '@mui/material';
import SearchOutlined from '../../../assets/icons/search.svg';
import { useTheme } from '@mui/material';
import { MaterialReactTable, MRT_Row } from 'material-react-table';
import { useStyle } from '@workspaceui/mainui/components/Table/styles';
import CloseIcon from '../../../assets/icons/x.svg';

interface Option<T extends string = string> {
  title: string;
  value: T;
  id: string;
}

interface MultiSelectProps {
  value: Option[];
  onChange: (values: Option[]) => void;
  readOnly?: boolean;
  title?: string;
}

const SelectorTable = ({ data, onRowClick }) => {
  const { sx } = useStyle();

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Credit Available',
        accessorKey: 'creditAvail',
      },
      {
        header: 'Credit Used',
        accessorKey: 'creditUsed',
      },
    ],
    [],
  );

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableRowSelection
      enableMultiRowSelection={false}
      enableTopToolbar={false}
      enableColumnActions={false}
      enableColumnFilters={false}
      enablePagination={false}
      enableSorting={false}
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

const MultiSelect: React.FC<MultiSelectProps> = ({ value = [], onChange, readOnly }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option[]>(value);
  const theme = useTheme();
  const { sx } = useStyle();

  const mockData = useMemo(
    () => [
      {
        id: 'ES-C1/0001',
        name: 'Alimentos y Supermercados, S.A',
        creditAvail: '0.00',
        creditUsed: '0.00',
      },
      {
        id: 'ES-C2/0001',
        name: 'Restaurantes Luna Llena, S.A.',
        creditAvail: '0.00',
        creditUsed: '0.00',
      },
    ],
    [],
  );

  const handleOpenModal = useCallback(() => {
    if (!readOnly) {
      setOpen(true);
    }
  }, [readOnly]);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    onChange(selected);
    handleCloseModal();
  }, [onChange, selected, handleCloseModal]);

  const handleRowClick = useCallback((row: MRT_Row<(typeof mockData)[0]>) => {
    setSelected(prev => {
      const option = {
        id: row.original.id,
        title: row.original.name,
        value: row.original.id,
      };

      const exists = prev.find(item => item.id === option.id);
      if (exists) {
        return prev.filter(item => item.id !== option.id);
      }
      return [...prev, option];
    });
  }, []);

  return (
    <div>
      <Typography>Bussines Partner Selector</Typography>
      <Box sx={sx.selectedContainer}>
        {selected.map(item => (
          <Box key={item.id} sx={sx.selectedItem}>
            <Typography>{item.title}</Typography>
            <IconButton
              size="small"
              onClick={() => {
                setSelected(prev => prev.filter(i => i.id !== item.id));
              }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        {selected.length === 0 && <Box sx={sx.emptyState}>No items selected</Box>}
      </Box>
      <Box
        onClick={handleOpenModal}
        sx={{
          ...sx.searchBar,
          '&:hover': {
            backgroundColor: readOnly ? 'transparent' : theme.palette.baselineColor.neutral[10],
          },
        }}>
        <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
        <Typography>Add</Typography>
        <IconButton
          size="small"
          onClick={e => {
            e.stopPropagation();
            setSelected([]);
            onChange([]);
          }}
          disabled={readOnly || selected.length === 0}
          sx={{
            visibility: selected.length > 0 ? 'visible' : 'hidden',
          }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Dialog open={open} onClose={handleCloseModal} maxWidth="lg" fullWidth>
        <DialogTitle>Business Partner selector</DialogTitle>
        <DialogContent>
          <SelectorTable data={mockData} onRowClick={handleRowClick} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MultiSelect;
