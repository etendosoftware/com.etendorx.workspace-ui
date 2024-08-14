import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
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
} from '../../../../storybook/src/stories/Components/Table/types';
import { tableStyles } from './styles';
import { theme } from '../../theme';
import { getColumns } from '../../../../storybook/src/stories/Components/Table/columns';
import CustomExpandButton from './customExpandButton';
import TopToolbar from './Toolbar';
import BackgroundGradientUrl from '../../assets/images/sidebar-bg.svg?url';
import SideIcon from '../../assets/icons/codesandbox.svg';
import Sidebar from './Sidebar';
import { createToolbarConfig } from '../../../../storybook/src/stories/Components/Table/toolbarMock';
import { CONTENT, LABELS } from './tableConstants';
import ResizableRecordContainer from './TabNavigation';
import { widgets } from '../../../../storybook/src/stories/Components/Table/mockWidget';

const Table: React.FC<TableProps> = ({ data, isTreeStructure = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Organization | null>(null);
  const [recordContainerHeight, setRecordContainerHeight] = useState(40);
  const tableRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleRowClick = useCallback((row: MRT_Row<Organization>) => {
    setSelectedItem(row.original);
  }, []);

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
      sx: tableStyles.tableBodyRow,
    }),
    muiTableBodyProps: {
      sx: tableStyles.tableBody,
    },
    muiTableHeadCellProps: {
      sx: tableStyles.tableHeadCell,
    },
    muiTableBodyCellProps: {
      sx: tableStyles.tableBodyCell,
    },
    columnResizeMode: 'onChange',
    displayColumnDefOptions: {
      'mrt-row-expand': {
        ...expandColumnDef,
        muiTableHeadCellProps: { sx: tableStyles.expandColumn },
      },
    },
  } as MRT_TableOptions<Organization>);

  const toolbarConfig = useMemo(
    () =>
      createToolbarConfig(
        toggleDropdown,
        toggleSidebar,
        isDropdownOpen,
        isSidebarOpen,
      ),
    [isDropdownOpen, toggleDropdown, isSidebarOpen, toggleSidebar],
  );

  return (
    <Box sx={tableStyles.container} ref={tableRef}>
      <TopToolbar {...toolbarConfig} isItemSelected={!!selectedItem} />
      <Box
        sx={{
          ...tableStyles.contentContainer,
          height: `calc(100% - ${isDropdownOpen ? recordContainerHeight : 0}vh)`,
        }}>
        <Paper
          elevation={4}
          sx={{
            ...tableStyles.tablePaper,
            width: isSidebarOpen ? 'calc(70% - 0.5rem)' : '100%',
          }}>
          <MaterialReactTable table={table} />
        </Paper>
        <Paper
          elevation={4}
          sx={{
            ...tableStyles.sidebarPaper,
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.5s ease',
            backgroundImage: `url(${BackgroundGradientUrl})`,
            visibility: isSidebarOpen ? 'visible' : 'hidden',
          }}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={toggleSidebar}
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
        <ResizableRecordContainer
          isOpen={isDropdownOpen}
          onClose={toggleDropdown}
          selectedRecord={{
            identifier: selectedItem?.identificator ?? LABELS.NO_IDENTIFIER,
            type: selectedItem?.type ?? LABELS.NO_TYPE,
          }}
          onHeightChange={setRecordContainerHeight}
        />
      </Box>
    </Box>
  );
};

export default Table;
