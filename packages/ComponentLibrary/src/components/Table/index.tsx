import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  MRT_Row,
  useMaterialReactTable,
} from 'material-react-table';
import { Box, Paper } from '@mui/material';
import { Organization, TableProps } from './types';
import { tableStyles } from './styles';
import CenterSection from './sections/CenterSection';
import LeftSection from './sections/LeftSection';
import RightSection from './sections/RightSection';
import { theme } from '../../theme';
import { getColumns } from './columns';
import CustomExpandButton from './customExpandButton';

const Table: React.FC<TableProps> = ({ data, isTreeStructure = false }) => {
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const tableData = useMemo(
    () => (isTreeStructure ? data.filter(org => !org.parentId) : data),
    [data, isTreeStructure],
  );

  const columns = useMemo(() => getColumns(), []);

  const expandColumnDef = useMemo(() => {
    if (!isTreeStructure) return undefined;
    return {
      header: '',
      size: 40,
      Cell: ({ row }: { row: MRT_Row<Organization> }) => (
        <CustomExpandButton row={row} />
      ),
      muiTableHeadCellProps: {
        sx: {
          borderRight: 'none',
          background: theme.palette.baselineColor.transparentNeutral[5],
        },
      },
      muiTableBodyCellProps: {
        sx: {},
      },
    };
  }, [isTreeStructure]);

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableTopToolbar: false,
    enableExpanding: isTreeStructure,
    getSubRows: isTreeStructure
      ? (row: Organization) => data.filter(org => org.parentId === row.id)
      : undefined,
    initialState: {
      density: 'compact',
    },
    muiTableBodyProps: {
      sx: {
        '& tr': {
          backgroundColor: theme.palette.background.paper,
        },
      },
    },
    muiTableHeadCellProps: {
      sx: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        borderRight: `1px solid ${theme.palette.divider}`,
        '&:last-child': {
          borderRight: 'none',
        },
        background: theme.palette.baselineColor.transparentNeutral[5],
        fontWeight: 'bold',
        color: theme.palette.text.primary,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        borderRight: `1px solid ${theme.palette.divider}`,
      },
    },
    columnResizeMode: 'onChange',
    displayColumnDefOptions: {
      'mrt-row-expand': expandColumnDef,
      'mrt-row-select': {
        size: 10,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
    },
  });

  return (
    <Box
      sx={
        isFullScreen ? tableStyles.fullScreenContainer : tableStyles.container
      }>
      <Box sx={tableStyles.topToolbar}>
        <LeftSection />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            marginLeft: '1rem',
          }}>
          <CenterSection />
        </Box>
        <RightSection
          table={table}
          isFullScreen={isFullScreen}
          toggleFullScreen={toggleFullScreen}
        />
      </Box>
      <Paper
        elevation={4}
        sx={{
          ...tableStyles.tablePaper,
          borderRadius: '1rem',
          overflow: 'hidden',
        }}>
        <MaterialReactTable table={table} />
      </Paper>
    </Box>
  );
};

export default Table;
