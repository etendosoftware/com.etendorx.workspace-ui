import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  MaterialReactTable,
  MRT_Row,
  MRT_TableOptions,
  useMaterialReactTable,
} from 'material-react-table';
import { Box, Paper } from '@mui/material';
import {
  Organization,
  TableProps,
  Widget,
} from '../../../../storybook/src/stories/Components/Table/types';
import { tableStyles } from './styles';
import { theme } from '../../theme';
import { getColumns } from '../../../../storybook/src/stories/Components/Table/columns';
import CustomExpandButton from './customExpandButton';
import TopToolbar from './Toolbar';
import BackgroundGradientUrl from '../../assets/images/Sidebar-bg.svg?url';
import SideIcon from '../../assets/icons/codesandbox.svg';
import Sidebar from './Sidebar';
import { createToolbarConfig } from '../../../../storybook/src/stories/Components/Table/toolbarMock';
import { CONTENT, LABELS } from './tableConstants';

const widgets: Widget[] = [];

const Table: React.FC<TableProps> = ({ data, isTreeStructure = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Organization | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const handleRowClick = (row: MRT_Row<Organization>) => {
    setSelectedItem(row.original);
  };

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
      setSelectedItem(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

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
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: { cursor: 'pointer' },
    }),
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
  } as MRT_TableOptions<Organization>);

  const toolbarConfig = useMemo(
    () => createToolbarConfig(toggleDropdown, isDropdownOpen),
    [isDropdownOpen, toggleDropdown],
  );

  return (
    <Box sx={{ ...tableStyles.container }} ref={tableRef}>
      <TopToolbar {...toolbarConfig} isItemSelected={!!selectedItem} />
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          transition: 'all 0.3s ease',
          position: 'relative',
        }}>
        <Paper
          elevation={4}
          sx={{
            ...tableStyles.tablePaper,
            borderRadius: '1rem',
            overflow: 'auto',
            width: isDropdownOpen ? 'calc(70% - 0.5rem)' : '100%',
            transition: 'width 0.3s ease',
          }}>
          <MaterialReactTable table={table} />
        </Paper>
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 0,
            right: isDropdownOpen ? 0 : -4,
            width: '30%',
            height: '50rem',
            backgroundColor: theme.palette.baselineColor.neutral[10],
            boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.1)',
            padding: '0.5rem',
            transition: 'transform 0.3s ease',
            borderRadius: '1rem',
            transform: isDropdownOpen ? 'translateX(0)' : 'translateX(100%)',
            backgroundImage: `url(${BackgroundGradientUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}>
          <Sidebar
            isOpen={isDropdownOpen}
            onClose={toggleDropdown}
            selectedItem={{
              icon: (
                <SideIcon fill={theme.palette.baselineColor.neutral[100]} />
              ),
              identifier: selectedItem?.identificator ?? LABELS.NO_IDENTIFIER,
              title: CONTENT.CURRENT_TITLE ?? LABELS.NO_TITLE,
            }}
            widgets={widgets}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Table;
